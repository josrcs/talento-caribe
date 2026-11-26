/* ==========================================================
   Rutas de cuentas
   - Director(a) general (permiso cuentasEquipo): crea y elimina cuentas administrativas con cargo fijo.
   - Director(a) general, Dirección académica y Dirección de tecnología (permiso cuentasDocentes): crean cuentas
     de docentes y las desactivan o reactivan.
   - Coordinación de admisiones y Director(a) general (permiso bloquearEstudiantes): bloquean las cuentas de
     estudiantes inactivos y las desbloquean cuando quieran.
   Todo queda en el registro de seguridad (eventos cuenta_creada, cuenta_eliminada, cuenta_bloqueada
   y cuenta_desbloqueada).
   ========================================================== */
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const correos = require("../correo");
const { requiereSesion, requierePermiso, registrarEvento, CARGOS } = require("../seguridad");
const { EMAIL, linea, entero, generarClave, rechazar } = require("../validar");

// Una cuenta de estudiante es "inactiva" si no ingresa hace al menos estos días (se cuenta desde el último
// ingreso, la creación de la cuenta o el último desbloqueo, lo más reciente)
const DIAS_MINIMOS = 30;
const ACTIVIDAD = "GREATEST(u.creado_en, u.ultimo_ingreso, u.desbloqueado_en)";
const quien = (req) => `${req.usuario.nombre} (${req.usuario.puesto || "administrativo"})`.slice(0, 160);
const faltaColumna = (res, e) => e.code === "42703" && res.status(503).json({ error: "La base es de una versión anterior: ejecuta npm run db:actualizar." });

/* ---------- Equipo administrativo (Director(a) general) ---------- */
router.get("/cuentas/equipo", requiereSesion, requierePermiso("cuentasEquipo"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, COALESCE(puesto, '') AS puesto, activo, creado_en AS creado, ultimo_ingreso
       FROM usuarios WHERE rol = 'administrativo' ORDER BY nombre`);
    res.json(rows.map((u) => ({ ...u, yo: u.id === req.usuario.id })));
  } catch (e) { faltaColumna(res, e) || next(e); }
});

// Crea la cuenta con una contraseña temporal segura que se muestra UNA vez al Director(a) general
router.post("/cuentas/equipo", requiereSesion, requierePermiso("cuentasEquipo"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { nombre: linea(b.nombre, 3, 100), correo: EMAIL.test(b.correo), puesto: CARGOS.includes(b.puesto) })) return;
  const correo = b.correo.trim().toLowerCase(), clave = generarClave();
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, clave_hash, rol, puesto) VALUES ($1, $2, $3, 'administrativo', $4)
       RETURNING id, nombre, correo, puesto, activo, creado_en AS creado, ultimo_ingreso`,
      [b.nombre.trim(), correo, await bcrypt.hash(clave, 10), b.puesto]);
    registrarEvento(req, "cuenta_creada", { usuarioId: rows[0].id, correo, detalle: `cargo ${b.puesto}, por ${quien(req)}` });
    res.status(201).json({ cuenta: rows[0], clave });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    next(e);
  }
});

router.delete("/cuentas/equipo/:id", requiereSesion, requierePermiso("cuentasEquipo"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Cuenta no válida." });
  if (id === req.usuario.id) return res.status(409).json({ error: "No puedes eliminar tu propia cuenta." });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const u = (await db.query("SELECT id, nombre, correo, rol, puesto FROM usuarios WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!u || u.rol !== "administrativo") { await db.query("ROLLBACK"); return res.status(404).json({ error: "Esa cuenta administrativa ya no existe." }); }
    // Siempre debe quedar al menos una cuenta activa que pueda entrar como Director(a) general (ese cargo o cuenta sin cargo fijo)
    const gerentes = (await db.query(
      "SELECT count(*)::int AS n FROM usuarios WHERE rol = 'administrativo' AND activo AND (puesto = 'Director(a) general' OR puesto IS NULL) AND id <> $1", [id])).rows[0].n;
    if (!gerentes) { await db.query("ROLLBACK"); return res.status(409).json({ error: "Es la última cuenta que puede entrar como Director(a) general: crea otra antes de eliminarla." }); }
    await db.query("DELETE FROM usuarios WHERE id = $1", [id]); // sus sesiones dejan de valer: la cuenta ya no existe
    await db.query("COMMIT");
    registrarEvento(req, "cuenta_eliminada", { correo: u.correo, detalle: `${u.nombre}, cargo ${u.puesto || "a elección"}, por ${quien(req)}` });
    res.json({ ok: true });
  } catch (e) { await db.query("ROLLBACK").catch(() => {}); next(e); }
  finally { db.release(); }
});

/* ---------- Docentes (Director(a) general, Dirección académica y Dirección de tecnología) ----------
   Un docente queda a cargo de un curso cuando en el curso se escribe su nombre como instructor
   (rutas/admin.js lo busca por nombre), por eso no se permiten dos docentes con el mismo nombre.
   No se eliminan: borrar un docente borraría sus actividades y las entregas de los estudiantes.
   En su lugar se desactivan (no puede ingresar y sus sesiones se cierran) y se pueden reactivar. */
router.get("/cuentas/docentes", requiereSesion, requierePermiso("cuentasDocentes"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.correo, COALESCE(u.especialidad, '') AS especialidad, u.activo, u.creado_en AS creado, u.ultimo_ingreso,
              (SELECT count(*)::int FROM cursos c WHERE c.docente_id = u.id) AS cursos
       FROM usuarios u WHERE u.rol = 'docente' ORDER BY u.activo DESC, u.nombre`);
    res.json(rows);
  } catch (e) { faltaColumna(res, e) || next(e); }
});

// Crea el docente con una contraseña temporal segura que se muestra UNA vez a quien la crea
router.post("/cuentas/docentes", requiereSesion, requierePermiso("cuentasDocentes"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { nombre: linea(b.nombre, 3, 100), correo: EMAIL.test(b.correo), especialidad: linea(b.especialidad, 2, 80) })) return;
  const nombre = b.nombre.trim().replace(/\s+/g, " "), correo = b.correo.trim().toLowerCase(), clave = generarClave();
  try {
    const repetido = (await pool.query("SELECT 1 FROM usuarios WHERE rol = 'docente' AND lower(nombre) = lower($1)", [nombre])).rows.length;
    if (repetido) return res.status(409).json({ error: "Ya hay un docente con ese nombre. Agrega un segundo apellido para diferenciarlos." });
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, clave_hash, rol, especialidad) VALUES ($1, $2, $3, 'docente', $4)
       RETURNING id, nombre, correo, especialidad, activo, creado_en AS creado, ultimo_ingreso, 0 AS cursos`,
      [nombre, correo, await bcrypt.hash(clave, 10), b.especialidad.trim()]);
    registrarEvento(req, "cuenta_creada", { usuarioId: rows[0].id, correo, detalle: `docente de ${rows[0].especialidad}, por ${quien(req)}` });
    res.status(201).json({ cuenta: rows[0], clave });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    next(e);
  }
});

// Desactivar (no puede ingresar y sus sesiones abiertas se cierran) o volver a activar. Sus cursos, actividades y notas se conservan.
router.post("/cuentas/docentes/:id/:accion(desactivar|activar)", requiereSesion, requierePermiso("cuentasDocentes"), async (req, res, next) => {
  const id = entero(req.params.id), activar = req.params.accion === "activar";
  if (!id) return res.status(400).json({ error: "Cuenta no válida." });
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET activo = $2, sesiones_desde = CASE WHEN $2 THEN sesiones_desde ELSE clock_timestamp() END
       WHERE id = $1 AND rol = 'docente' AND activo <> $2 RETURNING id, correo`, [id, activar]);
    if (!rows.length) {
      const u = (await pool.query("SELECT rol FROM usuarios WHERE id = $1", [id])).rows[0];
      return u?.rol === "docente" ? res.status(409).json({ error: activar ? "Esa cuenta ya está activa." : "Esa cuenta ya está desactivada." })
        : res.status(404).json({ error: "Esa cuenta de docente no existe." });
    }
    registrarEvento(req, activar ? "cuenta_desbloqueada" : "cuenta_bloqueada", { usuarioId: id, correo: rows[0].correo, detalle: `docente, por ${quien(req)}` });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ---------- Estudiantes inactivos (Coordinación de admisiones y Director(a) general) ---------- */
router.get("/cuentas/estudiantes", requiereSesion, requierePermiso("bloquearEstudiantes"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.activo, u.creado_en AS creado, u.ultimo_ingreso, u.bloqueado_en, u.bloqueado_por,
              floor(extract(epoch FROM now() - ${ACTIVIDAD}) / 86400)::int AS dias_sin_uso,
              CASE ${ACTIVIDAD} WHEN u.desbloqueado_en THEN 'desbloqueo' WHEN u.ultimo_ingreso THEN 'ingreso' ELSE 'creacion' END AS desde,
              (SELECT count(*)::int FROM inscripciones i WHERE i.estudiante_id = u.id AND i.estado = 'aprobada') AS cursos
       FROM usuarios u WHERE u.rol = 'estudiante' ORDER BY u.activo, dias_sin_uso DESC, u.nombre`);
    res.json({ estudiantes: rows, diasMinimos: DIAS_MINIMOS });
  } catch (e) { faltaColumna(res, e) || next(e); }
});

// Bloquear: la cuenta no puede ingresar y sus sesiones abiertas se cierran. Solo si está inactiva.
async function bloquear(req, filtro, parametros) {
  const { rows } = await pool.query(
    `UPDATE usuarios u SET activo = false, sesiones_desde = clock_timestamp(), bloqueado_en = now(), bloqueado_por = $1
     WHERE u.rol = 'estudiante' AND u.activo AND ${ACTIVIDAD} < now() - make_interval(days => $2) AND ${filtro}
     RETURNING u.id, u.nombre, u.correo, floor(extract(epoch FROM now() - ${ACTIVIDAD}) / 86400)::int AS dias`, [quien(req), ...parametros]);
  for (const u of rows) {
    registrarEvento(req, "cuenta_bloqueada", { usuarioId: u.id, correo: u.correo, detalle: `${u.dias} días sin ingresar, por ${quien(req)}` });
    correos.cuentaBloqueada(u);
  }
  return rows;
}

router.post("/cuentas/estudiantes/:id/bloquear", requiereSesion, requierePermiso("bloquearEstudiantes"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Cuenta no válida." });
  try {
    if ((await bloquear(req, "u.id = $3", [DIAS_MINIMOS, id])).length) return res.json({ ok: true });
    const u = (await pool.query(`SELECT rol, activo, floor(extract(epoch FROM now() - ${ACTIVIDAD}) / 86400)::int AS dias FROM usuarios u WHERE id = $1`, [id])).rows[0];
    if (!u || u.rol !== "estudiante") return res.status(404).json({ error: "Esa cuenta de estudiante no existe." });
    if (!u.activo) return res.status(409).json({ error: "Esa cuenta ya está bloqueada." });
    res.status(409).json({ error: `Solo se bloquean cuentas inactivas: esta ingresó hace ${u.dias} día(s) y el mínimo es ${DIAS_MINIMOS}.` });
  } catch (e) { faltaColumna(res, e) || next(e); }
});

router.post("/cuentas/estudiantes/bloquear-inactivas", requiereSesion, requierePermiso("bloquearEstudiantes"), async (req, res, next) => {
  const dias = entero(req.body?.dias);
  if (!dias || dias < DIAS_MINIMOS || dias > 730) return res.status(400).json({ error: `Elige entre ${DIAS_MINIMOS} y 730 días sin ingresar.` });
  try {
    const bloqueadas = await bloquear(req, "true", [dias]);
    res.json({ ok: true, bloqueadas: bloqueadas.length });
  } catch (e) { faltaColumna(res, e) || next(e); }
});

// Desbloquear en cualquier momento: la inactividad se vuelve a contar desde hoy
router.post("/cuentas/estudiantes/:id/desbloquear", requiereSesion, requierePermiso("bloquearEstudiantes"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Cuenta no válida." });
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET activo = true, bloqueado_en = NULL, bloqueado_por = NULL, desbloqueado_en = now()
       WHERE id = $1 AND rol = 'estudiante' AND NOT activo RETURNING id, nombre, correo`, [id]);
    if (!rows.length) {
      const u = (await pool.query("SELECT rol, activo FROM usuarios WHERE id = $1", [id])).rows[0];
      return u?.rol === "estudiante" ? res.status(409).json({ error: "Esa cuenta ya está activa." }) : res.status(404).json({ error: "Esa cuenta de estudiante no existe." });
    }
    registrarEvento(req, "cuenta_desbloqueada", { usuarioId: id, correo: rows[0].correo, detalle: `por ${quien(req)}` });
    correos.cuentaReactivada(rows[0]);
    res.json({ ok: true });
  } catch (e) { faltaColumna(res, e) || next(e); }
});

/* Eliminar la cuenta de un estudiante (solo Director(a) general). La base borra con ella sus inscripciones,
   entregas, respuestas de encuestas y el historial de monitoría (ON DELETE CASCADE). No se puede deshacer. */
router.delete("/cuentas/estudiantes/:id", requiereSesion, requierePermiso("eliminarEstudiantes"), async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "Cuenta no válida." });
  try {
    const { rows } = await pool.query("DELETE FROM usuarios WHERE id = $1 AND rol = 'estudiante' RETURNING id, nombre, correo", [id]);
    if (!rows.length) return res.status(404).json({ error: "Esa cuenta de estudiante no existe." });
    registrarEvento(req, "cuenta_eliminada", { correo: rows[0].correo, detalle: `estudiante ${rows[0].nombre}, por ${quien(req)}`.slice(0, 200) });
    res.json({ ok: true, nombre: rows[0].nombre });
  } catch (e) { next(e); }
});

module.exports = router;
