/* ==========================================================
   Rutas académicas: inscripciones, actividades, entregas y calificaciones.
   Cada ruta comprueba en la base que el usuario sea dueño de lo que modifica.
   ========================================================== */
const router = require("express").Router();
const pool = require("../db");
const correos = require("../correo");
const { requiereSesion, requiereRol, requierePermiso } = require("../seguridad");
const { texto, linea, opcional, limpio, entero, fecha, URL_OK, rechazar } = require("../validar");
// Enlace http(s) de máximo 300 caracteres (nunca javascript: ni data:, que ejecutarían código al abrirlos)
const enlaceOk = (v) => !v || (typeof v === "string" && v.length <= 300 && URL_OK.test(v));

const TIPOS = ["Tarea", "Práctica", "Quiz", "Lectura", "Proyecto"];
const edadDesde = (nacimiento) => {
  const n = new Date(nacimiento + "T00:00:00"), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
};

/* ---------- Inscripciones ---------- */
// El estudiante solicita un cupo
router.post("/inscripciones", requiereSesion, requiereRol("estudiante"), async (req, res, next) => {
  const cursoId = entero(req.body?.curso_id), numeroFicha = String(req.body?.ficha || "").trim();
  if (!cursoId) return res.status(400).json({ error: "Curso no válido." });
  try {
    const curso = (await pool.query("SELECT id, edad_minima FROM cursos WHERE id = $1", [cursoId])).rows[0];
    if (!curso) return res.status(404).json({ error: "Curso no encontrado." });
    // La ficha elegida (o la primera con inscripciones abiertas) debe ser de este curso
    const ficha = (await pool.query(
      `SELECT id FROM fichas WHERE curso_id = $1 AND estado = 'Inscripciones abiertas' AND ($2 = '' OR numero = $2) ORDER BY fecha_inicio NULLS LAST LIMIT 1`, [cursoId, numeroFicha])).rows[0];
    if (!ficha) return res.status(400).json({ error: numeroFicha ? `La ficha ${numeroFicha} no tiene inscripciones abiertas para este curso.` : "Este curso no tiene fichas con inscripciones abiertas." });
    const yo = (await pool.query("SELECT fecha_nacimiento, numero_documento FROM usuarios WHERE id = $1", [req.usuario.id])).rows[0];
    if (!yo.fecha_nacimiento || !yo.numero_documento) return res.status(400).json({ error: "Completa tu perfil (documento y fecha de nacimiento) antes de inscribirte." });
    const edad = edadDesde(yo.fecha_nacimiento);
    if (edad < curso.edad_minima) return res.status(400).json({ error: `Este curso está dirigido a personas desde los ${curso.edad_minima} años. Puedes explorar otros programas.` });
    const { rows } = await pool.query("INSERT INTO inscripciones (curso_id, ficha_id, estudiante_id, edad) VALUES ($1, $2, $3, $4) RETURNING id, estado", [cursoId, ficha.id, req.usuario.id, edad]);
    avisarInscripcion(rows[0].id, "solicitudRecibida");
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Tu cuenta ya tiene una solicitud para este curso." });
    next(e);
  }
});

// Admisiones aprueba o rechaza
router.patch("/inscripciones/:id", requiereSesion, requierePermiso("inscripciones"), async (req, res, next) => {
  const id = entero(req.params.id), estado = req.body?.estado;
  if (!id || !["pendiente", "aprobada", "rechazada"].includes(estado)) return res.status(400).json({ error: "Estado no válido." });
  try {
    // "anterior" ve el estado de antes del cambio: solo se avisa al estudiante si de verdad cambió
    const { rows } = await pool.query(`WITH anterior AS (SELECT estado FROM inscripciones WHERE id = $2)
      UPDATE inscripciones SET estado = $1, revisado_en = now() WHERE id = $2 RETURNING (SELECT estado FROM anterior) AS antes`, [estado, id]);
    if (!rows.length) return res.status(404).json({ error: "Inscripción no encontrada." });
    if (rows[0].antes !== estado && estado !== "pendiente") avisarInscripcion(id, "inscripcionRevisada");
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* Correo al estudiante sobre su inscripción (se arma con los datos del curso y de la ficha) */
async function avisarInscripcion(id, tipo) {
  try {
    const { rows } = await pool.query(`SELECT i.estado, u.nombre, u.correo, c.titulo, f.numero AS ficha, f.jornada, to_char(f.fecha_inicio, 'YYYY-MM-DD') AS inicio
      FROM inscripciones i JOIN usuarios u ON u.id = i.estudiante_id JOIN cursos c ON c.id = i.curso_id LEFT JOIN fichas f ON f.id = i.ficha_id WHERE i.id = $1`, [id]);
    if (rows.length) await correos[tipo](rows[0]);
  } catch (error) { console.error("✖ Aviso de inscripción:", error.message); }
}

// Ficha completa de un estudiante (solo admisiones)
router.get("/estudiantes/:correo", requiereSesion, requierePermiso("inscripciones"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT nombre, correo, tipo_documento, numero_documento, fecha_nacimiento, telefono, direccion, ciudad, region, pais, codigo_postal,
              ultimo_estudio, documentos_disponibles, acudiente_nombre, acudiente_telefono, acudiente_correo
       FROM usuarios WHERE correo = $1 AND rol = 'estudiante'`, [String(req.params.correo).toLowerCase()]);
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Estudiante no encontrado." });
  } catch (e) { next(e); }
});

/* ---------- Actividades (docentes) ---------- */
function validarActividad(b) {
  return {
    curso_id: !!entero(b.curso_id), tipo: TIPOS.includes(b.tipo), modulo: !!entero(b.modulo) && Number(b.modulo) <= 30,
    ficha: !b.ficha || /^[0-9]{4,6}$/.test(String(b.ficha)), titulo: linea(b.titulo, 4, 90), objetivo: opcional(b.objetivo, 160),
    descripcion: texto(b.descripcion, 15, 2000), fecha_limite: fecha(b.fecha_limite), recurso: enlaceOk(b.recurso),
  };
}
const esMiCurso = async (cursoId, docenteId) => (await pool.query("SELECT 1 FROM cursos WHERE id = $1 AND docente_id = $2", [cursoId, docenteId])).rowCount > 0;
/* Número de ficha -> id (debe pertenecer al curso). "" = todas las fichas */
async function fichaDelCurso(numero, cursoId) {
  if (!numero) return { id: null };
  const fila = (await pool.query("SELECT id FROM fichas WHERE numero = $1 AND curso_id = $2", [String(numero), cursoId])).rows[0];
  return fila || null;
}
const esMiActividad = async (actId, docenteId) =>
  (await pool.query("SELECT 1 FROM actividades a JOIN cursos c ON c.id = a.curso_id WHERE a.id = $1 AND c.docente_id = $2", [actId, docenteId])).rowCount > 0;

router.post("/actividades", requiereSesion, requiereRol("docente"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, validarActividad(b))) return;
  try {
    if (!(await esMiCurso(b.curso_id, req.usuario.id))) return res.status(403).json({ error: "Solo puedes publicar actividades en los cursos que dictas." });
    const ficha = await fichaDelCurso(b.ficha, b.curso_id);
    if (!ficha) return res.status(400).json({ error: "Esa ficha no pertenece al curso elegido." });
    const { rows } = await pool.query(
      "INSERT INTO actividades (curso_id, docente_id, modulo, ficha_id, tipo, titulo, objetivo, descripcion, fecha_limite, recurso) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id::text AS id",
      [b.curso_id, req.usuario.id, Number(b.modulo), ficha.id, b.tipo, b.titulo.trim(), limpio(b.objetivo), b.descripcion.trim(), b.fecha_limite, limpio(b.recurso)]);
    const alcance = (await pool.query("SELECT count(*)::int AS n FROM inscripciones WHERE curso_id = $1 AND estado = 'aprobada' AND ($2::int IS NULL OR ficha_id = $2)", [b.curso_id, ficha.id])).rows[0].n;
    res.status(201).json({ id: rows[0].id, estudiantes: alcance });
  } catch (e) { next(e); }
});

router.put("/actividades/:id", requiereSesion, requiereRol("docente"), async (req, res, next) => {
  const id = entero(req.params.id), b = req.body || {};
  if (!id) return res.status(400).json({ error: "Actividad no válida." });
  if (rechazar(res, validarActividad(b))) return;
  try {
    if (!(await esMiActividad(id, req.usuario.id)) || !(await esMiCurso(b.curso_id, req.usuario.id))) return res.status(403).json({ error: "Solo puedes editar actividades de tus cursos." });
    const ficha = await fichaDelCurso(b.ficha, b.curso_id);
    if (!ficha) return res.status(400).json({ error: "Esa ficha no pertenece al curso elegido." });
    await pool.query("UPDATE actividades SET curso_id = $1, modulo = $2, ficha_id = $3, tipo = $4, titulo = $5, objetivo = $6, descripcion = $7, fecha_limite = $8, recurso = $9 WHERE id = $10",
      [b.curso_id, Number(b.modulo), ficha.id, b.tipo, b.titulo.trim(), limpio(b.objetivo), b.descripcion.trim(), b.fecha_limite, limpio(b.recurso), id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/actividades/:id", requiereSesion, requiereRol("docente"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Actividad no válida." });
  try {
    if (!(await esMiActividad(id, req.usuario.id))) return res.status(403).json({ error: "Solo puedes eliminar actividades de tus cursos." });
    await pool.query("DELETE FROM actividades WHERE id = $1", [id]); // sus entregas se borran en cascada
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ---------- Entregas ---------- */
// El estudiante entrega (o actualiza su entrega mientras no esté calificada)
router.put("/actividades/:id/entrega", requiereSesion, requiereRol("estudiante"), async (req, res, next) => {
  const id = entero(req.params.id), b = req.body || {};
  if (!id) return res.status(400).json({ error: "Actividad no válida." });
  if (rechazar(res, { respuesta: texto(b.respuesta, 10, 3000), enlace: enlaceOk(b.enlace) })) return;
  try {
    const permitido = await pool.query(
      `SELECT 1 FROM actividades a JOIN inscripciones i ON i.curso_id = a.curso_id
       WHERE a.id = $1 AND i.estudiante_id = $2 AND i.estado = 'aprobada' AND (a.ficha_id IS NULL OR a.ficha_id = i.ficha_id)`, [id, req.usuario.id]);
    if (!permitido.rowCount) return res.status(403).json({ error: "Esta actividad no pertenece a tus cursos." });
    const { rowCount } = await pool.query(
      `INSERT INTO entregas (actividad_id, estudiante_id, respuesta, enlace) VALUES ($1, $2, $3, $4)
       ON CONFLICT (actividad_id, estudiante_id) DO UPDATE SET respuesta = EXCLUDED.respuesta, enlace = EXCLUDED.enlace, creado_en = now()
       WHERE entregas.estado = 'entregada'`, [id, req.usuario.id, b.respuesta.trim(), limpio(b.enlace)]);
    if (!rowCount) return res.status(409).json({ error: "Esta entrega ya fue calificada y no se puede modificar." });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// El docente califica (1.0 a 5.0) con retroalimentación
router.patch("/entregas/:id", requiereSesion, requiereRol("docente"), async (req, res, next) => {
  const id = entero(req.params.id), nota = Math.round(Number(req.body?.nota) * 10) / 10, comentario = req.body?.comentario;
  if (!id) return res.status(400).json({ error: "Entrega no válida." });
  if (rechazar(res, { nota: nota >= 1 && nota <= 5, comentario: texto(comentario, 5, 800) })) return;
  try {
    const { rowCount } = await pool.query(
      `UPDATE entregas e SET nota = $1, comentario = $2, estado = 'revisada', revisado_en = now()
       FROM actividades a JOIN cursos c ON c.id = a.curso_id
       WHERE e.id = $3 AND a.id = e.actividad_id AND c.docente_id = $4`, [nota, comentario.trim(), id, req.usuario.id]);
    rowCount ? res.json({ ok: true }) : res.status(403).json({ error: "Solo puedes calificar entregas de tus cursos." });
  } catch (e) { next(e); }
});

module.exports = router;
