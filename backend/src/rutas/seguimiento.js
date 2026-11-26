/* ==========================================================
   Seguimiento de la ruta (Monitoría) - permiso "seguimiento":
   Director(a) general y Monitor(a).
   GET  /api/seguimiento                    Los jóvenes con cupo aprobado en la ruta: datos de contacto
                                            (y del acudiente), módulos, avance, promedio, último ingreso
                                            y el historial de contactos que ha registrado el equipo.
   POST /api/seguimiento/:id/contactos      Registra un contacto con el joven o su acudiente
                                            (WhatsApp, llamada, correo, presencial u otro) y una nota.
   ========================================================== */
const router = require("express").Router();
const pool = require("../db");
const { requiereSesion, requierePermiso } = require("../seguridad");
const { texto, entero, rechazar } = require("../validar");

const TIPOS = ["WhatsApp", "Llamada", "Correo", "Presencial", "Otro"];

router.get("/seguimiento", requiereSesion, requierePermiso("seguimiento"), async (req, res, next) => {
  const q = (sql, p = []) => pool.query(sql, p).then((r) => r.rows);
  try {
    // Solo los jóvenes que tienen al menos un módulo de la ruta aprobado (los cursos en «Lanzamiento»)
    const estudiantes = await q(`
      SELECT u.id, u.nombre, u.correo, u.telefono, u.ciudad, to_char(u.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
             u.acudiente_nombre, u.acudiente_telefono, u.acudiente_correo, u.ultimo_ingreso, u.activo, u.bloqueado_en
      FROM usuarios u
      WHERE u.rol = 'estudiante' AND EXISTS (
        SELECT 1 FROM inscripciones i JOIN cursos c ON c.id = i.curso_id
        WHERE i.estudiante_id = u.id AND i.estado = 'aprobada' AND c.fase = 'Lanzamiento')
      ORDER BY u.nombre`);
    const ids = estudiantes.map((e) => e.id);
    if (!ids.length) return res.json({ estudiantes: [] });

    const modulos = await q(`
      SELECT i.estudiante_id, i.curso_id, c.titulo, COALESCE(f.numero, '') AS ficha, i.creado_en AS desde
      FROM inscripciones i JOIN cursos c ON c.id = i.curso_id LEFT JOIN fichas f ON f.id = i.ficha_id
      WHERE i.estado = 'aprobada' AND c.fase = 'Lanzamiento' AND i.estudiante_id = ANY($1)
      ORDER BY i.creado_en`, [ids]);
    // Actividades que le corresponden (de sus módulos aprobados, para todas las fichas o para la suya)
    const actividades = await q(`
      SELECT i.estudiante_id, count(a.id)::int AS total
      FROM inscripciones i JOIN actividades a ON a.curso_id = i.curso_id AND (a.ficha_id IS NULL OR a.ficha_id = i.ficha_id)
      WHERE i.estado = 'aprobada' AND i.estudiante_id = ANY($1) GROUP BY i.estudiante_id`, [ids]);
    const entregas = await q(`
      SELECT e.estudiante_id, count(*)::int AS entregadas, round(avg(e.nota), 1)::float AS promedio, max(e.creado_en) AS ultima
      FROM entregas e WHERE e.estudiante_id = ANY($1) GROUP BY e.estudiante_id`, [ids]);
    const contactos = await q(`
      SELECT s.id, s.estudiante_id, s.tipo, s.nota, s.creado_en, COALESCE(a.nombre, 'Equipo') AS autor
      FROM seguimiento_contactos s LEFT JOIN usuarios a ON a.id = s.autor_id
      WHERE s.estudiante_id = ANY($1) ORDER BY s.creado_en DESC`, [ids]);

    const de = (lista, id) => lista.filter((x) => x.estudiante_id === id).map(({ estudiante_id, ...x }) => x);
    res.json({
      estudiantes: estudiantes.map((e) => {
        const ent = entregas.find((x) => x.estudiante_id === e.id) || {};
        return {
          ...e,
          modulos: de(modulos, e.id),
          actividades: actividades.find((x) => x.estudiante_id === e.id)?.total || 0,
          entregadas: ent.entregadas || 0,
          promedio: ent.promedio ?? null,
          ultima_entrega: ent.ultima || null,
          contactos: de(contactos, e.id),
        };
      }),
    });
  } catch (e) { next(e); }
});

router.post("/seguimiento/:id/contactos", requiereSesion, requierePermiso("seguimiento"), async (req, res, next) => {
  const id = entero(req.params.id), b = req.body || {};
  if (!id) return res.status(400).json({ error: "Estudiante no válido." });
  if (rechazar(res, { tipo: TIPOS.includes(b.tipo), nota: texto(b.nota, 3, 1000) })) return;
  try {
    const existe = await pool.query("SELECT 1 FROM usuarios WHERE id = $1 AND rol = 'estudiante'", [id]);
    if (!existe.rowCount) return res.status(404).json({ error: "Estudiante no encontrado." });
    const { rows } = await pool.query(
      "INSERT INTO seguimiento_contactos (estudiante_id, autor_id, tipo, nota) VALUES ($1, $2, $3, $4) RETURNING id, tipo, nota, creado_en",
      [id, req.usuario.id, b.tipo, b.nota.trim()]);
    res.status(201).json({ ...rows[0], autor: req.usuario.nombre });
  } catch (e) { next(e); }
});

module.exports = router;
