/* Rutas de cuenta: registro de estudiantes, inicio de sesión, perfil y recuperación de contraseña */
const crypto = require("crypto");
const router = require("express").Router();
const pool = require("../db");
const correos = require("../correo");
const { cifrar, comparar, firmar, CARGOS, requiereSesion, requiereRol, limitePorIP } = require("../seguridad");
const { perfilPublico } = require("../consultas");
const { EMAIL, texto, opcional, limpio, fecha, rechazar } = require("../validar");

const CAMPOS_EDITABLES = ["nombre", "pais", "tipo_documento", "numero_documento", "fecha_nacimiento", "telefono", "direccion", "ciudad", "region",
  "codigo_postal", "ultimo_estudio", "acudiente_nombre", "acudiente_documento", "acudiente_telefono", "acudiente_correo"];

function validarPerfil(b) {
  return {
    nombre: texto(b.nombre, 3, 100), pais: opcional(b.pais, 60), tipo_documento: opcional(b.tipo_documento, 60),
    numero_documento: opcional(b.numero_documento, 30), fecha_nacimiento: !b.fecha_nacimiento || fecha(b.fecha_nacimiento),
    telefono: opcional(b.telefono, 30), direccion: opcional(b.direccion, 150), ciudad: opcional(b.ciudad, 80), region: opcional(b.region, 80),
    codigo_postal: opcional(b.codigo_postal, 15), ultimo_estudio: opcional(b.ultimo_estudio, 60),
    acudiente_nombre: opcional(b.acudiente_nombre, 100), acudiente_documento: opcional(b.acudiente_documento, 30),
    acudiente_telefono: opcional(b.acudiente_telefono, 30), acudiente_correo: !b.acudiente_correo || EMAIL.test(b.acudiente_correo),
    documentos_disponibles: b.documentos_disponibles === undefined || (Array.isArray(b.documentos_disponibles) && b.documentos_disponibles.every((d) => texto(d, 1, 80))),
  };
}
const sesion = (u, puesto) => {
  const usuario = { ...perfilPublico(u), puesto: puesto ?? u.puesto ?? "" };
  return { token: firmar({ id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, puesto: usuario.puesto || null }), usuario };
};

// Registro (solo estudiantes: docentes y administrativos los crea la institución)
router.post("/registro", async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { ...validarPerfil(b), correo: typeof b.correo === "string" && EMAIL.test(b.correo), clave: texto(b.clave, 8, 72) })) return;
  try {
    const valores = CAMPOS_EDITABLES.map((c) => limpio(b[c]));
    const { rows } = await pool.query(
      `INSERT INTO usuarios (correo, clave_hash, rol, documentos_disponibles, ${CAMPOS_EDITABLES.join(", ")})
       VALUES ($1, $2, 'estudiante', $3, ${CAMPOS_EDITABLES.map((_, i) => "$" + (i + 4)).join(", ")}) RETURNING *`,
      [b.correo.trim().toLowerCase(), await cifrar(b.clave), b.documentos_disponibles || [], ...valores]);
    correos.bienvenida(rows[0]); // sin await: la respuesta no espera al correo
    res.status(201).json(sesion(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo. Inicia sesión." });
    next(e);
  }
});

// Inicio de sesión para los tres roles
router.post("/login", async (req, res, next) => {
  const { correo, clave, rol, puesto } = req.body || {};
  if (rechazar(res, { correo: typeof correo === "string" && EMAIL.test(correo), clave: texto(clave, 1, 72), rol: ["estudiante", "docente", "administrativo"].includes(rol) })) return;
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE correo = $1 AND activo", [correo.trim().toLowerCase()]);
    const u = rows[0];
    // Mismo mensaje si el correo no existe o la clave es incorrecta: no revelamos qué cuentas existen
    if (!u || u.rol !== rol || !(await comparar(clave, u.clave_hash))) return res.status(401).json({ error: "Correo o contraseña incorrectos para este tipo de cuenta." });
    let cargo = null;
    if (rol === "administrativo") {
      if (u.puesto) cargo = u.puesto;                      // cuenta con cargo fijo
      else if (CARGOS.includes(puesto)) cargo = puesto;    // cuenta de demostración: elige el cargo
      else return res.status(400).json({ error: "Elige el cargo con el que ingresarás." });
      if (puesto && u.puesto && puesto !== u.puesto) return res.status(403).json({ error: `Tu cuenta está registrada con el cargo «${u.puesto}».` });
    }
    res.json(sesion(u, cargo));
  } catch (e) { next(e); }
});

router.get("/yo", requiereSesion, async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.usuario.id]);
    if (!rows.length) return res.status(401).json({ error: "La cuenta ya no existe." });
    res.json({ ...perfilPublico(rows[0]), puesto: req.usuario.puesto || "" });
  } catch (e) { next(e); }
});

// Completar o editar el perfil de inscripción (estudiantes)
router.put("/perfil", requiereSesion, requiereRol("estudiante"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, validarPerfil(b))) return;
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${CAMPOS_EDITABLES.map((c, i) => `${c} = $${i + 1}`).join(", ")}, documentos_disponibles = $${CAMPOS_EDITABLES.length + 1}
       WHERE id = $${CAMPOS_EDITABLES.length + 2} RETURNING *`,
      [...CAMPOS_EDITABLES.map((c) => limpio(b[c])), b.documentos_disponibles || [], req.usuario.id]);
    res.json(perfilPublico(rows[0]));
  } catch (e) { next(e); }
});

/* ---------- Recuperar la contraseña ----------
   1. POST /recuperar: si el correo tiene cuenta, se le envía un enlace de un solo uso que vence en 1 hora.
   2. POST /restablecer: con ese enlace se crea la contraseña nueva.
   En la base se guarda el SHA-256 del enlace, nunca el enlace: quien lea la tabla no puede usarlo. */
const huella = (token) => crypto.createHash("sha256").update(token).digest("hex");
// Límites separados: pedir enlaces seguidos no debe impedir usar después el que sí llegó
const limitarPedidos = limitePorIP(5, 15, "Pediste muchos enlaces seguidos. Espera unos minutos y vuelve a intentarlo.");
const limitarCambios = limitePorIP(10, 15, "Hiciste muchos intentos seguidos. Espera unos minutos y vuelve a intentarlo.");

router.post("/recuperar", limitarPedidos, async (req, res, next) => {
  const correo = String(req.body?.correo || "").trim().toLowerCase();
  if (rechazar(res, { correo: EMAIL.test(correo) })) return;
  try {
    const u = (await pool.query("SELECT id, nombre, correo FROM usuarios WHERE correo = $1 AND activo", [correo])).rows[0];
    if (u) {
      const token = crypto.randomBytes(32).toString("hex");
      await pool.query("UPDATE recuperaciones_clave SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL", [u.id]); // solo vale el último enlace
      await pool.query("INSERT INTO recuperaciones_clave (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + interval '1 hour')", [u.id, huella(token)]);
      correos.recuperar(u, `${correos.SITIO}/recuperar.html?token=${token}`);
    }
    // La misma respuesta exista o no la cuenta: así nadie puede averiguar qué correos están registrados
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/restablecer", limitarCambios, async (req, res, next) => {
  const { token, clave } = req.body || {};
  if (rechazar(res, { token: typeof token === "string" && /^[a-f0-9]{64}$/.test(token), clave: texto(clave, 8, 72) })) return;
  try {
    // Una sola consulta marca el enlace como usado y cambia la clave: el mismo enlace no puede usarse dos veces
    const { rows } = await pool.query(`WITH usado AS (
        UPDATE recuperaciones_clave SET usado_en = now() WHERE token_hash = $1 AND usado_en IS NULL AND expira_en > now() RETURNING usuario_id)
      UPDATE usuarios u SET clave_hash = $2 FROM usado WHERE u.id = usado.usuario_id AND u.activo RETURNING u.id, u.nombre, u.correo`,
      [huella(token), await cifrar(clave)]);
    if (!rows.length) return res.status(400).json({ error: "El enlace no es válido o ya venció. Pide uno nuevo." });
    correos.claveCambiada(rows[0]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
