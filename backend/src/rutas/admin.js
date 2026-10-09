/* Rutas del equipo administrativo: cursos, mensajes, gastos y asistente */
const router = require("express").Router();
const pool = require("../db");
const { requiereSesion, requierePermiso, AREA_CARGO } = require("../seguridad");
const { texto, opcional, limpio, entero, rechazar } = require("../validar");

function validarCurso(b) {
  return {
    titulo: texto(b.titulo, 3, 100), area: ["Software", "Hardware"].includes(b.area), nivel: ["Básico", "Intermedio"].includes(b.nivel),
    duracion: Number.isInteger(Number(b.duracion)) && b.duracion >= 1 && b.duracion <= 52,
    modalidad: ["Virtual", "Presencial", "Híbrido"].includes(b.modalidad), fase: ["Lanzamiento", "Próximamente"].includes(b.fase),
    instructor: texto(b.instructor, 3, 100), edadMinima: Number.isInteger(Number(b.edadMinima)) && b.edadMinima >= 0 && b.edadMinima <= 100,
    descripcion: texto(b.descripcion, 10, 3000), objetivo: opcional(b.objetivo, 1000), proyecto: opcional(b.proyecto, 200),
    temario: b.temario === undefined || (Array.isArray(b.temario) && b.temario.every((t) => texto(t, 1, 200))),
    modulos: b.modulos === undefined || (Array.isArray(b.modulos) && b.modulos.length <= 30 && b.modulos.every((m) =>
      m && texto(m.titulo, 1, 120) && Array.isArray(m.temas || []) && (m.temas || []).every((t) => texto(t, 1, 160)) &&
      Array.isArray(m.actividades || []) && (m.actividades || []).every((t) => texto(t, 1, 300)) &&
      opcional(m.temasTexto, 300) && opcional(m.evidencia, 300))),
  };
}
/* Solo se guardan los campos conocidos de cada módulo */
const limpiarModulos = (lista) => (lista || []).map((m) => ({ titulo: m.titulo.trim(), temas: (m.temas || []).map((t) => t.trim()), temasTexto: String(m.temasTexto || "").trim(),
  actividades: (m.actividades || []).map((t) => t.trim()), evidencia: String(m.evidencia || "").trim() }));
async function guardarCurso(req, res, next, id) {
  const b = req.body || {};
  if (rechazar(res, validarCurso(b))) return;
  const area = AREA_CARGO[req.usuario.puesto];
  if (area && b.area !== area) return res.status(403).json({ error: `Tu cargo solo administra cursos de ${area}.` });
  try {
    const docente = (await pool.query("SELECT id FROM usuarios WHERE rol = 'docente' AND nombre = $1", [b.instructor.trim()])).rows[0];
    const valores = [b.titulo.trim(), b.area, b.nivel, Number(b.duracion), b.modalidad, b.fase, docente?.id || null, b.instructor.trim(),
      Number(b.edadMinima), b.descripcion.trim(), limpio(b.objetivo), b.temario || [], limpio(b.proyecto), JSON.stringify(limpiarModulos(b.modulos))];
    if (id) {
      if (area && !(await pool.query("SELECT 1 FROM cursos WHERE id = $1 AND area = $2", [id, area])).rowCount) return res.status(403).json({ error: `Tu cargo solo administra cursos de ${area}.` });
      const { rowCount } = await pool.query(`UPDATE cursos SET titulo=$1, area=$2, nivel=$3, duracion_semanas=$4, modalidad=$5, fase=$6, docente_id=$7, instructor=$8,
        edad_minima=$9, descripcion=$10, objetivo=$11, temario=$12, proyecto=$13, modulos=$14, actualizado_en=now() WHERE id=$15`, [...valores, id]);
      return rowCount ? res.json({ ok: true, id }) : res.status(404).json({ error: "Curso no encontrado." });
    }
    const { rows } = await pool.query(`INSERT INTO cursos (titulo, area, nivel, duracion_semanas, modalidad, fase, docente_id, instructor, edad_minima, descripcion, objetivo, temario, proyecto, modulos)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`, valores);
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe un curso con ese nombre." });
    next(e);
  }
}
router.post("/cursos", requiereSesion, requierePermiso("editarCursos"), (req, res, next) => guardarCurso(req, res, next, null));
router.put("/cursos/:id", requiereSesion, requierePermiso("editarCursos"), (req, res, next) => {
  const id = entero(req.params.id);
  id ? guardarCurso(req, res, next, id) : res.status(400).json({ error: "Curso no válido." });
});

/* ---------- Fichas (grupos de cada curso) ---------- */
const JORNADAS = ["Mañana", "Tarde", "Noche", "Sábados"], ESTADOS_FICHA = ["Inscripciones abiertas", "En formación", "Próximamente", "Finalizada"];
async function guardarFicha(req, res, next, numeroExistente) {
  const b = req.body || {}, numero = String(numeroExistente || b.numero || "").trim();
  if (rechazar(res, {
    numero: /^[0-9]{4,6}$/.test(numero), curso_id: !!entero(b.curso_id), jornada: JORNADAS.includes(b.jornada),
    inicio: !b.inicio || /^\d{4}-\d{2}-\d{2}$/.test(b.inicio), cupos: Number.isInteger(Number(b.cupos)) && b.cupos >= 1 && b.cupos <= 200, estado: ESTADOS_FICHA.includes(b.estado),
  })) return;
  try {
    const area = AREA_CARGO[req.usuario.puesto];
    if (area && !(await pool.query("SELECT 1 FROM cursos WHERE id = $1 AND area = $2", [b.curso_id, area])).rowCount) return res.status(403).json({ error: `Tu cargo solo administra fichas de cursos de ${area}.` });
    const valores = [b.curso_id, b.jornada, b.inicio || null, Number(b.cupos), b.estado, numero];
    if (numeroExistente) {
      const { rowCount } = await pool.query("UPDATE fichas SET curso_id = $1, jornada = $2, fecha_inicio = $3, cupos = $4, estado = $5 WHERE numero = $6", valores);
      return rowCount ? res.json({ ok: true }) : res.status(404).json({ error: "Ficha no encontrada." });
    }
    await pool.query("INSERT INTO fichas (curso_id, jornada, fecha_inicio, cupos, estado, numero) VALUES ($1, $2, $3, $4, $5, $6)", valores);
    res.status(201).json({ ok: true, numero });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: `Ya existe la ficha ${numero}.` });
    if (e.code === "23503") return res.status(400).json({ error: "El curso no existe." });
    next(e);
  }
}
router.post("/fichas", requiereSesion, requierePermiso("editarCursos"), (req, res, next) => guardarFicha(req, res, next, null));
router.put("/fichas/:numero", requiereSesion, requierePermiso("editarCursos"), (req, res, next) => guardarFicha(req, res, next, req.params.numero));

router.patch("/mensajes/:id/leido", requiereSesion, requierePermiso("mensajes"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Mensaje no válido." });
  try { await pool.query("UPDATE mensajes_contacto SET leido = true WHERE id = $1", [id]); res.json({ ok: true }); } catch (e) { next(e); }
});

router.post("/gastos", requiereSesion, requierePermiso("finanzas"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { concepto: texto(b.concepto, 2, 100), categoria: ["Materiales", "Conectividad", "Transporte", "Servicios", "Otro"].includes(b.categoria), valor: Number.isInteger(Number(b.valor)) && Number(b.valor) > 0 })) return;
  try {
    const { rows } = await pool.query("INSERT INTO gastos (concepto, categoria, valor, usuario_id) VALUES ($1, $2, $3, $4) RETURNING id", [b.concepto.trim(), b.categoria, Number(b.valor), req.usuario.id]);
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

router.put("/config-ia", requiereSesion, requierePermiso("configurarIA"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { tono: opcional(b.tono, 500), contexto: opcional(b.contexto, 2000) })) return;
  try {
    await pool.query(`INSERT INTO config_ia (id, tono, contexto) VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET tono = EXCLUDED.tono, contexto = EXCLUDED.contexto, actualizado_en = now()`, [b.tono || "", b.contexto || ""]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
