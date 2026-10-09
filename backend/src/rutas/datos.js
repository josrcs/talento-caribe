/* ==========================================================
   GET /api/datos - Todo lo que el usuario actual puede ver, en una sola respuesta.
   Cada rol recibe SOLO sus datos:
   - visitante:      catálogo
   - estudiante:     sus inscripciones, las actividades de sus cursos aprobados, sus entregas
                     y qué encuestas ya respondió
   - docente:        estudiantes aprobados de sus cursos, sus actividades y las entregas recibidas
   - administrativo: según su cargo (los datos personales solo para admisiones) y los
                     resultados de las encuestas, sin nombres
   ========================================================== */
const router = require("express").Router();
const pool = require("../db");
const { sesionOpcional, puede } = require("../seguridad");
const { SQL_CURSOS, SQL_FICHAS, SQL_INSCRIPCIONES, SQL_ACTIVIDADES, SQL_ENTREGAS } = require("../consultas");

router.get("/datos", sesionOpcional, async (req, res, next) => {
  const u = req.usuario, q = (sql, p = []) => pool.query(sql, p).then((r) => r.rows);
  // Si la base es de una versión anterior y aún no tiene la tabla de encuestas, el resto de la página sigue funcionando
  const encuestas = (sql, p) => q(sql, p).catch((e) => {
    if (e.code !== "42P01") throw e;
    console.warn("⚠️  Falta la tabla de encuestas: ejecuta npm run db:actualizar");
    return [];
  });
  try {
    const datos = { cursos: await q(SQL_CURSOS + " ORDER BY id"), fichas: await q(SQL_FICHAS + " ORDER BY f.numero"), inscripciones: [], actividades: [], entregas: [], mensajes: [], gastos: [], ia: null, encuestas: [] };
    if (u?.rol === "estudiante") {
      // Solo cuáles encuestas ya respondió (para no mostrárselas de nuevo)
      datos.encuestas = await encuestas("SELECT encuesta, creado_en AS creado FROM respuestas_encuesta WHERE estudiante_id = $1", [u.id]);
      datos.inscripciones = await q(SQL_INSCRIPCIONES + " WHERE i.estudiante_id = $1 ORDER BY i.creado_en", [u.id]);
      // Solo las actividades de sus cursos aprobados que son para todas las fichas o para SU ficha
      datos.actividades = await q(SQL_ACTIVIDADES + ` JOIN inscripciones mi ON mi.curso_id = a.curso_id AND mi.estudiante_id = $1 AND mi.estado = 'aprobada'
        WHERE a.ficha_id IS NULL OR a.ficha_id = mi.ficha_id ORDER BY a.fecha_limite`, [u.id]);
      datos.entregas = await q(SQL_ENTREGAS + " WHERE e.estudiante_id = $1", [u.id]);
    } else if (u?.rol === "docente") {
      const mios = "(SELECT id FROM cursos WHERE docente_id = $1)";
      datos.inscripciones = await q(SQL_INSCRIPCIONES + ` WHERE i.curso_id IN ${mios} AND i.estado = 'aprobada' ORDER BY u.nombre`, [u.id]);
      datos.actividades = await q(SQL_ACTIVIDADES + ` WHERE a.curso_id IN ${mios} ORDER BY a.creado_en DESC`, [u.id]);
      datos.entregas = await q(SQL_ENTREGAS + ` JOIN actividades a ON a.id = e.actividad_id WHERE a.curso_id IN ${mios}`, [u.id]);
    } else if (u?.rol === "administrativo") {
      // Sin permiso de admisiones, las inscripciones llegan anónimas (sirven para contar, no para identificar)
      datos.inscripciones = puede(u, "inscripciones")
        ? await q(SQL_INSCRIPCIONES + " ORDER BY i.creado_en")
        : await q(`SELECT i.id, i.curso_id, COALESCE((SELECT numero FROM fichas WHERE id = i.ficha_id), '') AS ficha, 'Estudiante' AS nombre, 'estudiante-' || i.estudiante_id AS correo, i.edad, i.estado, i.creado_en AS creado FROM inscripciones i ORDER BY i.creado_en`);
      datos.actividades = await q(SQL_ACTIVIDADES + " ORDER BY a.creado_en DESC");
      // El equipo administrativo ve notas y fechas, no el contenido de las respuestas
      datos.entregas = (await q(SQL_ENTREGAS)).map((e) => ({ ...e, respuesta: "", enlace: null, comentario: "" }));
      if (puede(u, "mensajes")) datos.mensajes = await q("SELECT id, nombre, correo, telefono, interes, asunto, mensaje, leido, creado_en FROM mensajes_contacto ORDER BY creado_en");
      if (puede(u, "finanzas")) datos.gastos = await q("SELECT id, concepto, categoria, valor, creado_en AS creado FROM gastos ORDER BY creado_en");
      datos.ia = (await q("SELECT tono, contexto FROM config_ia WHERE id = 1"))[0] || { tono: "", contexto: "" };
      // Resultados de encuestas para todo el equipo, sin el estudiante que respondió
      datos.encuestas = await encuestas("SELECT encuesta, respuestas, creado_en AS creado FROM respuestas_encuesta ORDER BY creado_en DESC");
    }
    res.json(datos);
  } catch (e) { next(e); }
});

module.exports = router;
