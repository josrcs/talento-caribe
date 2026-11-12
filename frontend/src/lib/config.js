/* ==========================================================
   config.js - Dónde está la API
   El frontend en React trabaja SIEMPRE con la API real (Express + PostgreSQL):
   - npm run dev (Vite, puerto 5173): "/api" y Vite la reenvía a localhost:3000.
   - npm start en backend/ (puerto 3000): el backend sirve la página y la API juntas.
   - GitHub Pages: la API publicada en Render (API_PUBLICADA).
   Se puede cambiar al construir con la variable VITE_API_URL (ver frontend/.env.ejemplo).
   ========================================================== */
const API_PUBLICADA = "https://talento-caribe-api.onrender.com";

const local = ["localhost", "127.0.0.1", ""].includes(location.hostname);
const enGitHubPages = location.hostname.endsWith("github.io");

export const API_URL = (import.meta.env.VITE_API_URL || (enGitHubPages ? API_PUBLICADA + "/api" : "/api")).replace(/\/+$/, "");
// true en la página publicada: allí no se muestran las cuentas de prueba (el servidor les cambia la clave)
export const PUBLICADA = !local;
// Si la API no responde: en el computador se recuerda encender el servidor; publicada, el servidor
// gratuito de Render puede estar "despertando" (tarda unos segundos tras un rato sin visitas)
export const SIN_CONEXION = local
  ? "No hay conexión con el servidor. Revisa que esté encendido (npm start)."
  : "No hay conexión con el servidor. Puede estar iniciando: inténtalo de nuevo en unos segundos.";

/* Política de Tratamiento de Datos Personales (privacidad.html). Si cambias su texto, sube la versión
   aquí y en backend/src/validar.js (el servidor guarda la versión que aceptó cada persona). */
export const POLITICA_VERSION = "1.0";
export const POLITICA_VIGENCIA = "11 de noviembre de 2026";
// REVISAR ANTES DE PUBLICAR: este correo recibe las consultas y reclamos de datos personales; debe existir y revisarse.
export const CORREO_DATOS = "santiagorcolmenares@gmail.com";
