/* validar.js - Ayudas para revisar los datos que llegan del navegador (nunca confiar en ellos) */
const crypto = require("crypto");
// Correo: letras, números y . _ % + - antes de la @, un dominio con punto y máximo 120 caracteres.
// Más estricto que "algo@algo.algo": rechaza comas, comillas o <> que podrían colarse en las cabeceras de un correo.
const PATRON_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const EMAIL = { test: (v) => typeof v === "string" && v.trim().length <= 120 && PATRON_EMAIL.test(v.trim()) };
const URL_OK = /^https?:\/\/[^\s<>"']+$/;
// Caracteres de control (saltos de línea, tabulaciones, \0...): no caben en un nombre, un asunto o un teléfono
const CONTROL = /[\u0000-\u001f\u007f]/;
const CONTROL_MULTILINEA = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/; // permite \n, \r y \t
const texto = (v, min = 0, max = 10000) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max && !CONTROL_MULTILINEA.test(v);
/* Texto de una sola línea (nombres, asuntos, títulos) */
const linea = (v, min = 0, max = 200) => texto(v, min, max) && !CONTROL.test(v);
const opcional = (v, max, multilinea = false) => v === undefined || v === null || v === "" || (multilinea ? texto(v, 0, max) : linea(v, 0, max));
const limpio = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const entero = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null; };
const fecha = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00"));

/* Contraseña: 8 a 72 caracteres con letras y números, distinta del correo y fuera de las más usadas.
   bcrypt solo usa los primeros 72 BYTES: con tildes o emojis un texto corto puede pasarse. */
const CLAVES_COMUNES = new Set(["12345678", "123456789", "1234567890", "password", "password1", "password123", "contraseña", "contraseña1",
  "contrasena", "contrasena1", "qwerty123", "abc12345", "abcd1234", "11111111", "00000000", "iloveyou1", "admin123", "talento123",
  "talentocaribe", "talentocaribe1", "barranquilla1", "colombia123", "colombia1", "estudiante1", "docente123"]);
const MENSAJE_CLAVE = "La contraseña debe tener entre 8 y 72 caracteres, con letras y números, y no puede ser una muy común ni tu correo.";
function claveSegura(clave, correo = "") {
  if (typeof clave !== "string" || clave.length < 8 || Buffer.byteLength(clave, "utf8") > 72) return false;
  if (!/\p{L}/u.test(clave) || !/\d/.test(clave)) return false;
  const baja = clave.toLowerCase();
  if (CLAVES_COMUNES.has(baja)) return false;
  const usuario = String(correo).toLowerCase().split("@")[0];
  return !(usuario.length >= 4 && baja.includes(usuario));
}

/* Contraseña aleatoria fácil de dictar: 4 bloques de letras y números (ej. Kq7m-x2Pa-9rTe-W4nb).
   La usan npm run cuenta y el Gerente al crear una cuenta administrativa. */
function generarClave() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/l/I, que se confunden
  let clave;
  do clave = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => letras[crypto.randomInt(letras.length)]).join("")).join("-");
  while (!claveSegura(clave));
  return clave;
}

/* Responde 400 con la lista de campos inválidos; devuelve true si había errores */
function rechazar(res, errores) {
  const malos = Object.entries(errores).filter(([, ok]) => !ok).map(([campo]) => campo);
  if (malos.length) { res.status(400).json({ error: "Revisa los datos enviados.", campos: malos }); return true; }
  return false;
}
module.exports = { EMAIL, URL_OK, texto, linea, opcional, limpio, entero, fecha, claveSegura, MENSAJE_CLAVE, generarClave, rechazar };
