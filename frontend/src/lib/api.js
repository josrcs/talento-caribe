/* ==========================================================
   api.js - Cliente de la API (fetch)
   pedir("GET", "/datos")  ·  pedir("POST", "/inscripciones", { curso_id, ficha })
   - Envía el token de la sesión en Authorization: Bearer <token>.
   - Si el servidor responde 401 con sesión abierta (venció o se cerró en
     otro equipo), se borra la sesión y se vuelve al inicio de sesión.
   - Los errores llegan como Error con .status, .campos y .puesto.
   ========================================================== */
import { API_URL, SIN_CONEXION } from "./config.js";
import { leerSesion, borrarSesion } from "./sesion.js";
import { ir } from "./rutas.js";

export async function pedir(metodo, ruta, cuerpo, { sinRedirigir = false } = {}) {
  const token = leerSesion()?.token;
  let res;
  try {
    res = await fetch(API_URL + ruta, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }
  const datos = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !sinRedirigir) {
    borrarSesion();
    ir("admin/login.html");
  }
  if (!res.ok) {
    const e = new Error(datos.error || "No se pudo completar la acción.");
    Object.assign(e, { status: res.status, campos: datos.campos, puesto: datos.puesto });
    throw e;
  }
  return datos;
}
