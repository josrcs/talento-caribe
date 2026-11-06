/* ==========================================================
   plataforma.js - Puente entre React y los scripts compartidos
   El portal y el panel siguen en JavaScript sin framework y comparten
   con el sitio React estas piezas, que se cargan antes como scripts
   normales en cada página:
     js/config.js        window.TC        (modo demostración o API)
     js/cursos-data.js   catálogo y fichas
     js/datos.js         window.TCDatos, window.TCListo (datos listos)
     js/auth.js          window.TCAuth    (registro e inicio de sesión)
     js/utils.js         window.TCUtil    (avisos, validación de claves)
     js/i18n.js          window.TCi18n    (español / inglés y tema)
     js/efectos.js       window.TCRevelar (aparición al hacer scroll)
   Los componentes NUNCA leen window.* directamente: usan estas funciones.
   ========================================================== */

export const config = () => window.TC || { MODO_DEMO: true, API_URL: "http://localhost:3000/api" };
export const cursos = () => window.TALENTO_CARIBE_CURSOS || [];
export const fichas = () => window.TALENTO_CARIBE_FICHAS || [];
export const fichasDe = (cursoId) => fichas().filter((f) => Number(f.curso_id) === Number(cursoId));
export const buscarCurso = (id) => cursos().find((c) => Number(c.id) === Number(id));

/* Promesa que se cumple cuando datos.js terminó de cargar (en modo API pide los datos al servidor) */
export const datosListos = () => window.TCListo || Promise.resolve();

/* ---------- Idioma ----------
   La traducción del texto en pantalla la hace i18n.js solo (observa el DOM). Para que reconozca
   una frase, cada texto con números o variables debe quedar en UN solo nodo de texto:
   escribe {`${n} semanas`} y no {n} semanas. t() sirve para frases con {variables}. */
export const idioma = () => window.TCi18n?.idioma || "es";
export const t = (texto, vars) =>
  window.TCi18n ? window.TCi18n.t(texto, vars) : texto.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? "");
export const fechaLarga = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const opciones = { day: "numeric", month: "long", year: "numeric" };
  return window.TCi18n ? window.TCi18n.fecha(d, opciones) : d.toLocaleDateString("es-CO", opciones);
};
export const fechaCorta = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short", year: "numeric" }) : "Por definir";

/* ---------- Sesión ---------- */
export const sesion = () => {
  try { return JSON.parse(localStorage.getItem("tc_sesion_demo") || "null"); } catch { return null; }
};
export const guardarSesion = (s) => localStorage.setItem("tc_sesion_demo", JSON.stringify(s));
export const auth = () => window.TCAuth;
export const datos = () => window.TCDatos;

/* ---------- Utilidades de la interfaz ---------- */
export const aviso = (mensaje, tipo = "ok") => window.TCUtil?.toast(mensaje, tipo);
export const problemaClave = (clave, correo) => window.TCUtil?.problemaClave(clave, correo) || "";
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* Hace aparecer con animación lo que tenga data-revelar dentro de `elemento` */
export const revelar = (elemento) => elemento && window.TCRevelar?.(elemento);

/* Edad cumplida a partir de una fecha "AAAA-MM-DD" (-1 si no hay fecha) */
export function edadDesde(fecha) {
  if (!fecha) return -1;
  const nacimiento = new Date(`${fecha}T00:00:00`), hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

/* Petición POST a la API con el mensaje de error del servidor */
export async function enviarApi(ruta, cuerpo) {
  let res;
  try {
    res = await fetch(config().API_URL + ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  } catch {
    throw new Error("No hay conexión con el servidor. Inténtalo de nuevo en unos minutos.");
  }
  const respuesta = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(respuesta.error || "No se pudo completar la solicitud.");
  return respuesta;
}
