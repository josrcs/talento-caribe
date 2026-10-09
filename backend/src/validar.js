/* validar.js - Ayudas para revisar los datos que llegan del navegador (nunca confiar en ellos) */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_OK = /^https?:\/\/\S+$/;
const texto = (v, min = 0, max = 10000) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const opcional = (v, max) => v === undefined || v === null || v === "" || texto(v, 0, max);
const limpio = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const entero = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const fecha = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00"));
/* Responde 400 con la lista de campos inválidos; devuelve true si había errores */
function rechazar(res, errores) {
  const malos = Object.entries(errores).filter(([, ok]) => !ok).map(([campo]) => campo);
  if (malos.length) { res.status(400).json({ error: "Revisa los datos enviados.", campos: malos }); return true; }
  return false;
}
module.exports = { EMAIL, URL_OK, texto, opcional, limpio, entero, fecha, rechazar };
