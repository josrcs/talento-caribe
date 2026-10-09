/* Rutas de cuenta: registro de estudiantes, inicio de sesión, perfil, cambio y recuperación de contraseña.
   Protecciones: límite de intentos por IP, bloqueo temporal de la cuenta tras varios fallos seguidos,
   misma respuesta (y mismo tiempo) exista o no el correo, y registro de eventos de seguridad. */
const crypto = require("crypto");
const router = require("express").Router();
const pool = require("../db");
const correos = require("../correo");
const { cifrar, comparar, compararSiempre, firmar, versionSesion, CARGOS, requiereSesion, requiereRol, limitePorIP, contadorFallos, registrarEvento } = require("../seguridad");
const { perfilPublico } = require("../consultas");
const { EMAIL, linea, opcional, limpio, fecha, claveSegura, MENSAJE_CLAVE, rechazar } = require("../validar");

const CAMPOS_EDITABLES = ["nombre", "pais", "tipo_documento", "numero_documento", "fecha_nacimiento", "telefono", "direccion", "ciudad", "region",
  "codigo_postal", "ultimo_estudio", "acudiente_nombre", "acudiente_documento", "acudiente_telefono", "acudiente_correo"];

function validarPerfil(b) {
  return {
    nombre: linea(b.nombre, 3, 100), pais: opcional(b.pais, 60), tipo_documento: opcional(b.tipo_documento, 60),
    numero_documento: opcional(b.numero_documento, 30), fecha_nacimiento: !b.fecha_nacimiento || fecha(b.fecha_nacimiento),
    telefono: opcional(b.telefono, 30), direccion: opcional(b.direccion, 150), ciudad: opcional(b.ciudad, 80), region: opcional(b.region, 80),
    codigo_postal: opcional(b.codigo_postal, 15), ultimo_estudio: opcional(b.ultimo_estudio, 60),
    acudiente_nombre: opcional(b.acudiente_nombre, 100), acudiente_documento: opcional(b.acudiente_documento, 30),
    acudiente_telefono: opcional(b.acudiente_telefono, 30), acudiente_correo: !b.acudiente_correo || EMAIL.test(b.acudiente_correo),
    documentos_disponibles: b.documentos_disponibles === undefined || (Array.isArray(b.documentos_disponibles) && b.documentos_disponibles.length <= 20 && b.documentos_disponibles.every((d) => linea(d, 1, 80))),
  };
}
const sesion = (u, puesto) => {
  const usuario = { ...perfilPublico(u), puesto: puesto ?? u.puesto ?? "" };
  return { token: firmar({ id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, puesto: usuario.puesto || null, sv: versionSesion(u) }), usuario };
};
const normalizar = (correo) => String(correo || "").trim().toLowerCase();

// Registro (solo estudiantes: docentes y administrativos los crea la institución).
// Límite por IP: cada cuenta nueva envía un correo, y no queremos que se usen para llenar buzones ajenos.
const limitarRegistros = limitePorIP(5, 60, "Se crearon muchas cuentas desde tu conexión. Espera un rato y vuelve a intentarlo.");
router.post("/registro", limitarRegistros, async (req, res, next) => {
  const b = req.body || {};
  if (!claveSegura(b.clave, b.correo)) return res.status(400).json({ error: MENSAJE_CLAVE, campos: ["clave"] });
  if (rechazar(res, { ...validarPerfil(b), correo: EMAIL.test(b.correo) })) return;
  try {
    const valores = CAMPOS_EDITABLES.map((c) => limpio(b[c]));
    const { rows } = await pool.query(
      `INSERT INTO usuarios (correo, clave_hash, rol, documentos_disponibles, ${CAMPOS_EDITABLES.join(", ")})
       VALUES ($1, $2, 'estudiante', $3, ${CAMPOS_EDITABLES.map((_, i) => "$" + (i + 4)).join(", ")}) RETURNING *`,
      [normalizar(b.correo), await cifrar(b.clave), b.documentos_disponibles || [], ...valores]);
    correos.bienvenida(rows[0]); // sin await: la respuesta no espera al correo
    registrarEvento(req, "registro", { usuarioId: rows[0].id, correo: rows[0].correo });
    res.status(201).json(sesion(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo. Inicia sesión." });
    next(e);
  }
});

/* ---------- Inicio de sesión para los tres roles ----------
   Contra la fuerza bruta (probar miles de contraseñas):
   - una IP con 10 fallos en 15 minutos queda bloqueada hasta que pasen esos 15 minutos;
   - una cuenta con 8 fallos en 15 minutos también, venga de donde venga el ataque;
   - además, máximo 30 intentos por IP cada 15 minutos aunque sean correctos. */
const limitarIngresos = limitePorIP(30, 15, "Hiciste muchos intentos de ingreso. Espera unos minutos y vuelve a intentarlo.");
const fallosIP = contadorFallos(10, 15), fallosCuenta = contadorFallos(8, 15);
const mensajeBloqueo = (segundos) => `Demasiados intentos fallidos. Por seguridad, espera ${Math.ceil(segundos / 60)} minuto(s) o recupera tu contraseña.`;

router.post("/login", limitarIngresos, async (req, res, next) => {
  const { correo, clave, rol, puesto } = req.body || {};
  if (rechazar(res, { correo: EMAIL.test(correo), clave: typeof clave === "string" && clave.length >= 1 && clave.length <= 200, rol: ["estudiante", "docente", "administrativo"].includes(rol) })) return;
  const cuenta = normalizar(correo), ip = req.ip || "desconocida";
  const espera = Math.max(fallosIP.bloqueado(ip), fallosCuenta.bloqueado(cuenta));
  if (espera) {
    res.set("Retry-After", String(espera));
    return res.status(429).json({ error: mensajeBloqueo(espera) });
  }
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE correo = $1 AND activo", [cuenta]);
    const u = rows[0];
    // La clave se compara SIEMPRE (con un hash de relleno si el correo no existe): misma respuesta y mismo
    // tiempo, así nadie puede averiguar qué cuentas existen
    const claveOk = await compararSiempre(clave, u?.clave_hash);
    if (!u || u.rol !== rol || !claveOk) {
      fallosIP.fallo(ip); fallosCuenta.fallo(cuenta);
      const bloqueo = fallosCuenta.bloqueado(cuenta) || fallosIP.bloqueado(ip);
      registrarEvento(req, bloqueo ? "bloqueo" : "ingreso_fallido", { usuarioId: u?.id, correo: cuenta, detalle: !u ? "correo sin cuenta" : u.rol !== rol ? `tipo de cuenta ${rol}` : "contraseña incorrecta" });
      return res.status(401).json({ error: "Correo o contraseña incorrectos para este tipo de cuenta." });
    }
    let cargo = null;
    if (rol === "administrativo") {
      if (u.puesto) cargo = u.puesto;                      // cuenta con cargo fijo
      else if (CARGOS.includes(puesto)) cargo = puesto;    // cuenta de demostración: elige el cargo
      else return res.status(400).json({ error: "Elige el cargo con el que ingresarás." });
      if (puesto && u.puesto && puesto !== u.puesto) return res.status(403).json({ error: `Tu cuenta está registrada con el cargo «${u.puesto}».` });
    }
    fallosCuenta.limpiar(cuenta); fallosIP.limpiar(ip);
    registrarEvento(req, "ingreso", { usuarioId: u.id, correo: cuenta, detalle: cargo ? `cargo ${cargo}` : u.rol });
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

/* ---------- Cambiar la contraseña (con sesión iniciada) ----------
   Pide la contraseña actual: si alguien encuentra la sesión abierta en un computador
   prestado no puede quedarse con la cuenta. Al cambiarla se cierran las sesiones de los
   demás equipos (sesiones_desde) y este navegador recibe un token nuevo. */
const limitarCambioClave = limitePorIP(10, 15, "Hiciste muchos intentos seguidos. Espera unos minutos y vuelve a intentarlo.");
router.put("/clave", requiereSesion, limitarCambioClave, async (req, res, next) => {
  const { actual, nueva } = req.body || {};
  if (typeof actual !== "string" || !actual || actual.length > 200) return res.status(400).json({ error: "Escribe tu contraseña actual.", campos: ["actual"] });
  if (!claveSegura(nueva, req.usuario.correo)) return res.status(400).json({ error: MENSAJE_CLAVE, campos: ["nueva"] });
  if (nueva === actual) return res.status(400).json({ error: "La contraseña nueva debe ser distinta de la actual.", campos: ["nueva"] });
  try {
    const u = (await pool.query("SELECT * FROM usuarios WHERE id = $1 AND activo", [req.usuario.id])).rows[0];
    if (!u) return res.status(401).json({ error: "La cuenta ya no existe." });
    const espera = fallosCuenta.bloqueado(u.correo);
    if (espera) return res.status(429).json({ error: mensajeBloqueo(espera) });
    if (!(await comparar(actual, u.clave_hash))) {
      fallosCuenta.fallo(u.correo);
      registrarEvento(req, "ingreso_fallido", { usuarioId: u.id, correo: u.correo, detalle: "contraseña actual incorrecta al cambiarla" });
      return res.status(400).json({ error: "La contraseña actual no es correcta.", campos: ["actual"] });
    }
    const { rows } = await pool.query("UPDATE usuarios SET clave_hash = $1, sesiones_desde = clock_timestamp() WHERE id = $2 RETURNING *", [await cifrar(nueva), u.id]);
    await pool.query("UPDATE recuperaciones_clave SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL", [u.id]); // los enlaces pendientes ya no sirven
    correos.claveCambiada(u);
    registrarEvento(req, "clave_cambiada", { usuarioId: u.id, correo: u.correo });
    res.json(sesion(rows[0], req.usuario.puesto));
  } catch (e) { next(e); }
});

/* Cerrar la sesión en todos los equipos, este incluido (por ejemplo si se usó un computador público) */
router.post("/cerrar-sesiones", requiereSesion, async (req, res, next) => {
  try {
    await pool.query("UPDATE usuarios SET sesiones_desde = clock_timestamp() WHERE id = $1", [req.usuario.id]);
    registrarEvento(req, "sesiones_cerradas", { usuarioId: req.usuario.id, correo: req.usuario.correo });
    res.json({ ok: true });
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
  const correo = normalizar(req.body?.correo);
  if (rechazar(res, { correo: EMAIL.test(correo) })) return;
  // La misma respuesta, y en el mismo tiempo, exista o no la cuenta: se responde ANTES de buscarla y
  // el enlace se prepara después. Así nadie puede averiguar qué correos están registrados.
  res.json({ ok: true });
  try {
    const u = (await pool.query("SELECT id, nombre, correo FROM usuarios WHERE correo = $1 AND activo", [correo])).rows[0];
    if (!u) return;
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE recuperaciones_clave SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL", [u.id]); // solo vale el último enlace
    await pool.query("INSERT INTO recuperaciones_clave (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + interval '1 hour')", [u.id, huella(token)]);
    correos.recuperar(u, `${correos.SITIO}/recuperar.html?token=${token}`);
    registrarEvento(req, "recuperacion_pedida", { usuarioId: u.id, correo });
  } catch (error) { console.error("✖ Recuperar contraseña:", error.message); }
});

router.post("/restablecer", limitarCambios, async (req, res, next) => {
  const { token, clave } = req.body || {};
  if (rechazar(res, { token: typeof token === "string" && /^[a-f0-9]{64}$/.test(token) })) return;
  if (!claveSegura(clave)) return res.status(400).json({ error: MENSAJE_CLAVE, campos: ["clave"] });
  try {
    // Una sola consulta marca el enlace como usado y cambia la clave: el mismo enlace no puede usarse dos veces.
    // sesiones_desde = now() cierra las sesiones abiertas (por si alguien más tenía acceso a la cuenta).
    const { rows } = await pool.query(`WITH usado AS (
        UPDATE recuperaciones_clave SET usado_en = now() WHERE token_hash = $1 AND usado_en IS NULL AND expira_en > now() RETURNING usuario_id)
      UPDATE usuarios u SET clave_hash = $2, sesiones_desde = now() FROM usado WHERE u.id = usado.usuario_id AND u.activo RETURNING u.id, u.nombre, u.correo`,
      [huella(token), await cifrar(clave)]);
    if (!rows.length) return res.status(400).json({ error: "El enlace no es válido o ya venció. Pide uno nuevo." });
    correos.claveCambiada(rows[0]);
    fallosCuenta.limpiar(rows[0].correo); // quien recupera su clave no debe seguir bloqueado
    registrarEvento(req, "clave_restablecida", { usuarioId: rows[0].id, correo: rows[0].correo });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
