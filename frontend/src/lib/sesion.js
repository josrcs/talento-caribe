/* ==========================================================
   sesion.js - Sesión del navegador
   Al iniciar sesión el servidor entrega un token JWT; se guarda en localStorage
   junto con los datos públicos del perfil (nunca la contraseña). Cada petición
   a la API lo envía en la cabecera Authorization (ver api.js).
   localStorage solo guarda esto, el idioma, el tema y el historial del asistente:
   los datos de la plataforma viven en PostgreSQL.
   ========================================================== */
const CLAVE = "tc_sesion";

export function leerSesion() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE));
    return s?.token ? s : null; // una sesión sin token no sirve contra el servidor
  } catch { return null; }
}
export function guardarSesion(sesion) {
  try { localStorage.setItem(CLAVE, JSON.stringify(sesion)); } catch { /* almacenamiento no disponible */ }
  return sesion;
}
export function borrarSesion() {
  try { localStorage.removeItem(CLAVE); } catch { /* */ }
}
