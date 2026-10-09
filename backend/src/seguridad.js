/* ==========================================================
   seguridad.js - Contraseñas, sesiones (JWT), permisos y protecciones
   - Las contraseñas se guardan con bcrypt (nunca en texto plano).
   - Al iniciar sesión el servidor entrega un token JWT firmado; el
     navegador lo envía en cada petición: Authorization: Bearer <token>.
   - Cada petición con token revisa en la base que la cuenta siga activa
     y que el token tenga la versión de sesión vigente: así cambiar la
     clave cierra las sesiones abiertas en otros equipos.
   - Los permisos se revisan AQUÍ, en el servidor: ocultar un botón en
     la página no es suficiente.
   - Límites de intentos, bloqueo temporal tras fallos seguidos y
     cabeceras HTTP que endurecen el navegador (CSP, anti-iframe...).
   ========================================================== */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const PRODUCCION = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

/* ---------- Secreto de las sesiones ----------
   En producción el servidor no arranca con un secreto ausente, corto o copiado del ejemplo:
   con un secreto conocido cualquiera podría fabricar un token de administrador. */
let SECRETO = process.env.JWT_SECRETO || "";
const SECRETO_DEBIL = SECRETO.length < 32 || /cambia-esto/i.test(SECRETO);
if (SECRETO_DEBIL && PRODUCCION) {
  console.error("✖ JWT_SECRETO falta o es débil (mínimo 32 caracteres aleatorios). Genera uno con:");
  console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}
if (!SECRETO) {
  SECRETO = crypto.randomBytes(32).toString("hex");
  console.warn("⚠️  Falta JWT_SECRETO en .env: se usará uno temporal (las sesiones se cierran al reiniciar el servidor).");
} else if (SECRETO_DEBIL) {
  console.warn("⚠️  JWT_SECRETO es corto o es el del ejemplo: cámbialo antes de publicar (mínimo 32 caracteres aleatorios).");
}

// Costo 10 (2^10 rondas): cada +1 duplica el tiempo de un ataque contra los hashes, pero también el de cada
// inicio de sesión; en el plan gratuito de Render (CPU compartida) 10 mantiene el ingreso por debajo de 1 s.
const COSTO_BCRYPT = 10;
const cifrar = (clave) => bcrypt.hash(clave, COSTO_BCRYPT);
const comparar = (clave, hash) => bcrypt.compare(clave, hash);
// Hash de relleno: si el correo no existe se compara igual contra algo, así la respuesta tarda
// lo mismo y no se puede averiguar qué cuentas existen midiendo el tiempo.
const HASH_RELLENO = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), COSTO_BCRYPT);
const compararSiempre = async (clave, hash) => (hash ? comparar(clave, hash) : comparar(clave, HASH_RELLENO).then(() => false));

const OPCIONES_JWT = { algorithm: "HS256", issuer: "talento-caribe", expiresIn: "8h" };
const firmar = (datos) => jwt.sign(datos, SECRETO, OPCIONES_JWT);
/* Versión de las sesiones de una cuenta (milisegundos de usuarios.sesiones_desde): va dentro del token */
const versionSesion = (u) => (u.sesiones_desde ? new Date(u.sesiones_desde).getTime() : undefined);
// Solo se acepta HS256 y el emisor propio (evita tokens con alg "none" u otros algoritmos)
const verificar = (token) => jwt.verify(token, SECRETO, { algorithms: ["HS256"], issuer: OPCIONES_JWT.issuer });

/* Cargos administrativos y lo que puede hacer cada uno (igual que el panel) */
const CARGOS = [
  "Gerente", "Director(a) general", "Director(a) académico(a)", "Director(a) de tecnología", "Director(a) de admisiones",
  "Director(a) de comunicaciones", "Director(a) administrativo(a)", "Coordinador(a) académico(a)", "Coordinador(a) de tecnología",
  "Coordinador(a) de admisiones", "Coordinador(a) de comunicaciones", "Admisiones y registro", "Administración y finanzas",
  "Comunicaciones y alianzas", "Otro cargo administrativo",
];
const PERMISOS = {
  inscripciones: ["Director(a) de admisiones", "Coordinador(a) de admisiones", "Admisiones y registro"],
  mensajes: ["Director(a) de admisiones", "Director(a) de comunicaciones", "Coordinador(a) de comunicaciones", "Admisiones y registro", "Comunicaciones y alianzas"],
  editarCursos: ["Gerente", "Director(a) académico(a)", "Director(a) de tecnología"],
  finanzas: ["Administración y finanzas", "Director(a) administrativo(a)"],
  configurarIA: ["Gerente"],
  seguridad: ["Gerente", "Director(a) general", "Director(a) de tecnología"],
};
/* Área de cursos que ve cada cargo académico (los demás ven todo el catálogo) */
const AREA_CARGO = { "Director(a) académico(a)": "Software", "Coordinador(a) académico(a)": "Software", "Director(a) de tecnología": "Hardware", "Coordinador(a) de tecnología": "Hardware" };
const puede = (usuario, permiso) => usuario?.rol === "administrativo" && PERMISOS[permiso].includes(usuario.puesto);

/* ---------- Sesiones ---------- */
let avisoSinColumna = false;
/* Devuelve los datos del token si es válido y la cuenta sigue vigente; si no, null */
async function sesionValida(token) {
  let datos;
  try { datos = verificar(token); } catch { return null; }
  try {
    const { rows } = await pool.query(
      "SELECT rol, activo, floor(extract(epoch FROM sesiones_desde) * 1000)::bigint AS version FROM usuarios WHERE id = $1", [datos.id]);
    const u = rows[0];
    // Cuenta borrada o desactivada, rol cambiado, o token de una "versión" anterior de las sesiones
    // (cambiar la contraseña o cerrar las sesiones cambia la versión y anula todos los tokens anteriores)
    if (!u || !u.activo || u.rol !== datos.rol || datos.sv !== Number(u.version)) return null;
  } catch (error) {
    if (error.code !== "42703") throw error; // 42703: base sin la columna sesiones_desde todavía
    if (!avisoSinColumna) { avisoSinColumna = true; console.warn("⚠️  Falta la columna usuarios.sesiones_desde: ejecuta npm run db:actualizar"); }
  }
  return datos;
}
const leerToken = (req) => {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  return tipo === "Bearer" && token && token.length < 2000 ? token : null;
};

/* Middleware: exige sesión válida */
async function requiereSesion(req, res, next) {
  const token = leerToken(req);
  if (!token) return res.status(401).json({ error: "Inicia sesión para continuar." });
  try {
    req.usuario = await sesionValida(token);
    req.usuario ? next() : res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  } catch (e) { next(e); }
}
/* Igual que requiereSesion pero no obliga: si hay token válido llena req.usuario */
async function sesionOpcional(req, res, next) {
  const token = leerToken(req);
  try {
    if (token) req.usuario = (await sesionValida(token)) || undefined; // sesión vencida: se atiende como visitante
    next();
  } catch (e) { next(e); }
}
/* Middleware: exige uno de los roles indicados */
const requiereRol = (...roles) => (req, res, next) =>
  roles.includes(req.usuario?.rol) ? next() : res.status(403).json({ error: "Tu cuenta no tiene permiso para esta acción." });
/* Middleware: exige un permiso administrativo */
const requierePermiso = (permiso) => (req, res, next) =>
  puede(req.usuario, permiso) ? next() : res.status(403).json({ error: "Tu cargo no tiene permiso para esta acción." });

/* ---------- Límites ---------- */
/* Middleware: máximo de peticiones por IP en una ventana de tiempo (se cuenta en memoria).
   Frena el abuso de las rutas que cuestan dinero (asistente IA) o que envían correos. */
function limitePorIP(maximo, minutos, mensaje) {
  const ventana = minutos * 60 * 1000, usos = new Map(); // ip -> { inicio, cuenta }
  return (req, res, next) => {
    const ahora = Date.now(), ip = req.ip || "desconocida", u = usos.get(ip);
    if (!u || ahora - u.inicio > ventana) usos.set(ip, { inicio: ahora, cuenta: 1 });
    else if (++u.cuenta > maximo) {
      res.set("Retry-After", String(Math.ceil((u.inicio + ventana - ahora) / 1000)));
      return res.status(429).json({ error: mensaje });
    }
    if (usos.size > 5000) for (const [clave, v] of usos) if (ahora - v.inicio > ventana) usos.delete(clave);
    next();
  };
}

/* Cuenta intentos FALLIDOS por clave (una IP o un correo). Tras "maximo" fallos dentro de la
   ventana, esa clave queda bloqueada hasta que la ventana termine. Un acierto la limpia. */
function contadorFallos(maximo, minutos) {
  const ventana = minutos * 60 * 1000, fallos = new Map(); // clave -> { inicio, cuenta }
  const vigente = (clave, ahora = Date.now()) => { const f = fallos.get(clave); return f && ahora - f.inicio <= ventana ? f : null; };
  return {
    /* Segundos que faltan para poder intentar de nuevo (0 = no está bloqueada) */
    bloqueado(clave) {
      const f = vigente(clave);
      return f && f.cuenta >= maximo ? Math.ceil((f.inicio + ventana - Date.now()) / 1000) : 0;
    },
    fallo(clave) {
      const ahora = Date.now(), f = vigente(clave, ahora);
      if (f) f.cuenta++; else fallos.set(clave, { inicio: ahora, cuenta: 1 });
      if (fallos.size > 10000) for (const [k, v] of fallos) if (ahora - v.inicio > ventana) fallos.delete(k);
    },
    limpiar(clave) { fallos.delete(clave); },
  };
}

/* ---------- Registro de seguridad ----------
   Inicios de sesión, fallos, bloqueos y cambios de contraseña quedan en eventos_seguridad
   para que el equipo pueda revisar actividad sospechosa. Nunca se guardan contraseñas. */
const TIPOS_EVENTO = ["ingreso", "ingreso_fallido", "bloqueo", "clave_cambiada", "recuperacion_pedida", "clave_restablecida", "sesiones_cerradas", "registro"];
function registrarEvento(req, tipo, { usuarioId = null, correo = null, detalle = null } = {}) {
  if (!TIPOS_EVENTO.includes(tipo)) return;
  const agente = String(req.headers["user-agent"] || "").slice(0, 200);
  pool.query("INSERT INTO eventos_seguridad (tipo, usuario_id, correo, ip, agente, detalle) VALUES ($1, $2, $3, $4, $5, $6)",
    [tipo, usuarioId, correo ? String(correo).slice(0, 120) : null, String(req.ip || "").slice(0, 60), agente, detalle ? String(detalle).slice(0, 200) : null])
    .catch((error) => { if (error.code !== "42P01") console.error("✖ Registro de seguridad:", error.message); });
}
// Se conservan 90 días; la limpieza corre una vez al día
setInterval(() => pool.query("DELETE FROM eventos_seguridad WHERE creado_en < now() - interval '90 days'").catch(() => {}), 24 * 60 * 60 * 1000).unref();

/* ---------- Cabeceras HTTP de seguridad ----------
   CSP: el navegador solo ejecuta scripts de este mismo sitio (ningún <script> inyectado ni
   atributos onclick), así un XSS no puede robar la sesión. Los estilos en línea se permiten
   porque la página usa variables CSS en atributos style. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(PRODUCCION ? ["upgrade-insecure-requests"] : []),
].join("; ");
function cabecerasSeguras(req, res, next) {
  res.set({
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",               // no "adivinar" tipos de archivo
    "X-Frame-Options": "DENY",                          // nadie puede meter la página en un iframe (clickjacking)
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  });
  if (PRODUCCION) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains"); // solo HTTPS
  if (req.path.startsWith("/api")) res.set("Cache-Control", "no-store"); // datos personales: que no queden en caché
  else res.set("Cross-Origin-Resource-Policy", "same-origin"); // otros sitios no pueden incrustar los archivos
  next();
}

module.exports = {
  PRODUCCION, cifrar, comparar, compararSiempre, firmar, versionSesion, CARGOS, PERMISOS, AREA_CARGO, puede,
  requiereSesion, sesionOpcional, requiereRol, requierePermiso, limitePorIP, contadorFallos, registrarEvento, cabecerasSeguras,
};
