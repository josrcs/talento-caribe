/* ==========================================================
   seguridad.js - Contraseñas, sesiones (JWT) y permisos
   - Las contraseñas se guardan con bcrypt (nunca en texto plano).
   - Al iniciar sesión el servidor entrega un token JWT firmado; el
     navegador lo envía en cada petición: Authorization: Bearer <token>.
   - Los permisos se revisan AQUÍ, en el servidor: ocultar un botón en
     la página no es suficiente.
   ========================================================== */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let SECRETO = process.env.JWT_SECRETO;
if (!SECRETO) {
  SECRETO = crypto.randomBytes(32).toString("hex");
  console.warn("⚠️  Falta JWT_SECRETO en .env: se usará uno temporal (las sesiones se cierran al reiniciar el servidor).");
}

const cifrar = (clave) => bcrypt.hash(clave, 10);
const comparar = (clave, hash) => bcrypt.compare(clave, hash);
const firmar = (datos) => jwt.sign(datos, SECRETO, { expiresIn: "8h" });

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
};
/* Área de cursos que ve cada cargo académico (los demás ven todo el catálogo) */
const AREA_CARGO = { "Director(a) académico(a)": "Software", "Coordinador(a) académico(a)": "Software", "Director(a) de tecnología": "Hardware", "Coordinador(a) de tecnología": "Hardware" };
const puede = (usuario, permiso) => usuario?.rol === "administrativo" && PERMISOS[permiso].includes(usuario.puesto);

/* Middleware: exige sesión válida */
function requiereSesion(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) return res.status(401).json({ error: "Inicia sesión para continuar." });
  try {
    req.usuario = jwt.verify(token, SECRETO);
    next();
  } catch {
    res.status(401).json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." });
  }
}
/* Igual que requiereSesion pero no obliga: si hay token válido llena req.usuario */
function sesionOpcional(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo === "Bearer" && token) { try { req.usuario = jwt.verify(token, SECRETO); } catch { /* sesión vencida: se ignora */ } }
  next();
}
/* Middleware: exige uno de los roles indicados */
const requiereRol = (...roles) => (req, res, next) =>
  roles.includes(req.usuario?.rol) ? next() : res.status(403).json({ error: "Tu cuenta no tiene permiso para esta acción." });
/* Middleware: exige un permiso administrativo */
const requierePermiso = (permiso) => (req, res, next) =>
  puede(req.usuario, permiso) ? next() : res.status(403).json({ error: "Tu cargo no tiene permiso para esta acción." });

/* Middleware: máximo de peticiones por IP en una ventana de tiempo (se cuenta en memoria).
   Frena el abuso de las rutas que cuestan dinero (asistente IA) o que envían correos. */
function limitePorIP(maximo, minutos, mensaje) {
  const ventana = minutos * 60 * 1000, usos = new Map(); // ip -> { inicio, cuenta }
  return (req, res, next) => {
    const ahora = Date.now(), ip = req.ip || "desconocida", u = usos.get(ip);
    if (!u || ahora - u.inicio > ventana) usos.set(ip, { inicio: ahora, cuenta: 1 });
    else if (++u.cuenta > maximo) return res.status(429).json({ error: mensaje });
    if (usos.size > 5000) for (const [clave, v] of usos) if (ahora - v.inicio > ventana) usos.delete(clave);
    next();
  };
}

module.exports = { cifrar, comparar, firmar, CARGOS, PERMISOS, AREA_CARGO, puede, requiereSesion, sesionOpcional, requiereRol, requierePermiso, limitePorIP };
