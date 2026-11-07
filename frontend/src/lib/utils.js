/* utils.js - Utilidades compartidas */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export const sinTildes = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const norm = (t) => String(t || "").trim().toLowerCase();

export function leerLocal(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
export function guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }

/* Edad cumplida a partir de "AAAA-MM-DD" */
export function edadDe(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date(), n = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(n.getTime())) return null;
  let edad = hoy.getFullYear() - n.getFullYear();
  if (hoy.getMonth() < n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())) edad--;
  return edad;
}

// Mismas reglas que el servidor (backend/src/validar.js)
const COMUNES = ["12345678", "123456789", "password", "password1", "password123", "contraseña", "contrasena", "qwerty123", "abc12345", "abcd1234", "admin123", "talento123", "talentocaribe", "colombia123"];
export function problemaClave(clave, correo = "") {
  if (clave.length < 8) return "Usa al menos 8 caracteres.";
  if (new TextEncoder().encode(clave).length > 72) return "La contraseña es demasiado larga.";
  if (!/\p{L}/u.test(clave) || !/\d/.test(clave)) return "Combina letras y números.";
  if (COMUNES.includes(clave.toLowerCase())) return "Esa contraseña es muy común. Elige otra.";
  const usuario = correo.toLowerCase().split("@")[0];
  if (usuario.length >= 4 && clave.toLowerCase().includes(usuario)) return "No uses tu correo dentro de la contraseña.";
  return "";
}

/* Avisos y confirmaciones: cualquier parte del código los pide con un evento y los
   componentes <Avisos /> y <Confirmacion /> (src/componentes/) los muestran. */
export const toast = (mensaje, tipo = "ok") => dispatchEvent(new CustomEvent("tc:toast", { detail: { mensaje, tipo } }));
/* const ok = await confirmar({ titulo, mensaje, aceptar: "Eliminar", peligro: true }) -> true / false */
export const confirmar = (opciones = {}) => new Promise((resolver) => dispatchEvent(new CustomEvent("tc:confirmar", { detail: { ...opciones, resolver } })));
