/* Rutas del equipo administrativo: cursos, mensajes, gastos y asistente */
const router = require("express").Router();
const pool = require("../db");
const { requiereSesion, requierePermiso, AREA_CARGO } = require("../seguridad");
const { texto, linea, opcional, limpio, entero, rechazar } = require("../validar");

function validarCurso(b) {
  return {
    titulo: linea(b.titulo, 3, 100), area: ["Software", "Hardware"].includes(b.area), nivel: ["Básico", "Intermedio"].includes(b.nivel),
    duracion: Number.isInteger(Number(b.duracion)) && b.duracion >= 1 && b.duracion <= 52,
    modalidad: ["Virtual", "Presencial", "Híbrido"].includes(b.modalidad), fase: ["Lanzamiento", "Próximamente"].includes(b.fase),
    instructor: linea(b.instructor, 3, 100), edadMinima: Number.isInteger(Number(b.edadMinima)) && b.edadMinima >= 0 && b.edadMinima <= 100,
    descripcion: texto(b.descripcion, 10, 3000), objetivo: opcional(b.objetivo, 1000, true), proyecto: opcional(b.proyecto, 200, true),
    temario: b.temario === undefined || (Array.isArray(b.temario) && b.temario.length <= 30 && b.temario.every((t) => texto(t, 1, 200))),
    modulos: b.modulos === undefined || (Array.isArray(b.modulos) && b.modulos.length <= 30 && b.modulos.every((m) =>
      m && linea(m.titulo, 1, 120) && Array.isArray(m.temas || []) && (m.temas || []).length <= 40 && (m.temas || []).every((t) => texto(t, 1, 160)) &&
      Array.isArray(m.actividades || []) && (m.actividades || []).length <= 40 && (m.actividades || []).every((t) => texto(t, 1, 300)) &&
      opcional(m.temasTexto, 300, true) && opcional(m.evidencia, 300, true))),
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
    // Al editar, la ficha que ya existe también debe ser de su área (si no, podría "traerse" una ficha de otra área)
    if (area && numeroExistente && (await pool.query("SELECT 1 FROM fichas f JOIN cursos c ON c.id = f.curso_id WHERE f.numero = $1 AND c.area <> $2", [numero, area])).rowCount) {
      return res.status(403).json({ error: `Tu cargo solo administra fichas de cursos de ${area}.` });
    }
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

// Valor en pesos enteros: cualquier cifra de 1 a 1.000.000.000 (cerrada como 50000 o exacta como 12345)
const validarGasto = (b) => ({ concepto: linea(b.concepto, 2, 100), categoria: ["Materiales", "Conectividad", "Transporte", "Servicios", "Otro"].includes(b.categoria), valor: Number.isInteger(Number(b.valor)) && Number(b.valor) > 0 && Number(b.valor) <= 1000000000 });
router.post("/gastos", requiereSesion, requierePermiso("finanzas"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, validarGasto(b))) return;
  try {
    const { rows } = await pool.query("INSERT INTO gastos (concepto, categoria, valor, usuario_id) VALUES ($1, $2, $3, $4) RETURNING id", [b.concepto.trim(), b.categoria, Number(b.valor), req.usuario.id]);
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});
router.put("/gastos/:id", requiereSesion, requierePermiso("finanzas"), async (req, res, next) => {
  const id = entero(req.params.id), b = req.body || {};
  if (!id) return res.status(400).json({ error: "Gasto no válido." });
  if (rechazar(res, validarGasto(b))) return;
  try {
    const { rowCount } = await pool.query("UPDATE gastos SET concepto = $1, categoria = $2, valor = $3 WHERE id = $4", [b.concepto.trim(), b.categoria, Number(b.valor), id]);
    rowCount ? res.json({ ok: true }) : res.status(404).json({ error: "Ese gasto ya no existe." });
  } catch (e) { next(e); }
});
router.delete("/gastos/:id", requiereSesion, requierePermiso("finanzas"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Gasto no válido." });
  try {
    const { rowCount } = await pool.query("DELETE FROM gastos WHERE id = $1", [id]);
    rowCount ? res.json({ ok: true }) : res.status(404).json({ error: "Ese gasto ya no existe." });
  } catch (e) { next(e); }
});

router.put("/config-ia", requiereSesion, requierePermiso("configurarIA"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { tono: opcional(b.tono, 500, true), contexto: opcional(b.contexto, 2000, true) })) return;
  try {
    await pool.query(`INSERT INTO config_ia (id, tono, contexto) VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE SET tono = EXCLUDED.tono, contexto = EXCLUDED.contexto, actualizado_en = now()`, [b.tono || "", b.contexto || ""]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ---------- Registro de seguridad (gerencia, dirección general y tecnología) ----------
   Últimos eventos y un resumen de 24 horas: ingresos, fallos, bloqueos y cambios de contraseña.
   Sirve para notar ataques (muchos fallos desde una IP o contra una cuenta). */
router.get("/seguridad/eventos", requiereSesion, requierePermiso("seguridad"), async (req, res, next) => {
  const tipo = String(req.query.tipo || "");
  try {
    const { rows: eventos } = await pool.query(
      `SELECT e.id, e.tipo, e.correo, e.ip, e.agente, e.detalle, e.creado_en AS creado, u.nombre
       FROM eventos_seguridad e LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE ($1 = '' OR e.tipo = $1) ORDER BY e.creado_en DESC LIMIT 200`, [tipo]);
    const { rows: resumen } = await pool.query(
      "SELECT tipo, count(*)::int AS n FROM eventos_seguridad WHERE creado_en > now() - interval '24 hours' GROUP BY tipo");
    // IPs con más fallos en las últimas 24 horas (posibles ataques de fuerza bruta)
    const { rows: sospechosas } = await pool.query(
      `SELECT ip, count(*)::int AS fallos, count(DISTINCT correo)::int AS cuentas, max(creado_en) AS ultimo
       FROM eventos_seguridad WHERE tipo IN ('ingreso_fallido', 'bloqueo') AND creado_en > now() - interval '24 hours'
       GROUP BY ip HAVING count(*) >= 5 ORDER BY fallos DESC LIMIT 10`);
    res.json({ eventos, resumen: Object.fromEntries(resumen.map((r) => [r.tipo, r.n])), sospechosas });
  } catch (e) {
    if (e.code === "42P01") return res.status(503).json({ error: "Falta la tabla del registro de seguridad: ejecuta npm run db:actualizar." });
    next(e);
  }
});

module.exports = router;
