/* ==========================================================
   Rutas de cuentas
   - Gerente (permiso cuentasEquipo): crea y elimina cuentas administrativas con cargo fijo.
   - Coordinación de admisiones y Gerente (permiso bloquearEstudiantes): bloquean las cuentas de
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

/* ---------- Equipo administrativo (Gerente) ---------- */
router.get("/cuentas/equipo", requiereSesion, requierePermiso("cuentasEquipo"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, COALESCE(puesto, '') AS puesto, activo, creado_en AS creado, ultimo_ingreso
       FROM usuarios WHERE rol = 'administrativo' ORDER BY nombre`);
    res.json(rows.map((u) => ({ ...u, yo: u.id === req.usuario.id })));
  } catch (e) { faltaColumna(res, e) || next(e); }
});

// Crea la cuenta con una contraseña temporal segura que se muestra UNA vez al Gerente
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
    // Siempre debe quedar al menos una cuenta activa que pueda entrar como Gerente (cargo Gerente o cuenta sin cargo fijo)
    const gerentes = (await db.query(
      "SELECT count(*)::int AS n FROM usuarios WHERE rol = 'administrativo' AND activo AND (puesto = 'Gerente' OR puesto IS NULL) AND id <> $1", [id])).rows[0].n;
    if (!gerentes) { await db.query("ROLLBACK"); return res.status(409).json({ error: "Es la última cuenta que puede entrar como Gerente: crea otra antes de eliminarla." }); }
    await db.query("DELETE FROM usuarios WHERE id = $1", [id]); // sus sesiones dejan de valer: la cuenta ya no existe
    await db.query("COMMIT");
    registrarEvento(req, "cuenta_eliminada", { correo: u.correo, detalle: `${u.nombre}, cargo ${u.puesto || "a elección"}, por ${quien(req)}` });
    res.json({ ok: true });
  } catch (e) { await db.query("ROLLBACK").catch(() => {}); next(e); }
  finally { db.release(); }
});

/* ---------- Estudiantes inactivos (Coordinación de admisiones y Gerente) ---------- */
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

module.exports = router;
