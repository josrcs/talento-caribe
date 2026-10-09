/* config.js - Configuración global del frontend
   Tres formas de abrir la página:
   1. npm start en backend/ → http://localhost:3000: API en el mismo sitio (PostgreSQL + IA).
   2. Live Server u otro servidor local: modo demostración (datos en localStorage).
   3. GitHub Pages: modo demostración, o la API publicada si se llena API_PUBLICADA
      (por ejemplo "https://talento-caribe-api.onrender.com"). En ese caso agrega la URL de
      GitHub Pages a CORS_ORIGENES en el .env del servidor. */
(() => {
  const API_PUBLICADA = "";

  const conServidor = location.port === "3000";
  const local = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const conApiPublicada = !conServidor && !local && Boolean(API_PUBLICADA);
  window.TC = {
    API_URL: conServidor ? "/api" : conApiPublicada ? API_PUBLICADA.replace(/\/+$/, "") + "/api" : "http://localhost:3000/api",
    MODO_DEMO: !(conServidor || conApiPublicada), // false: cuentas, inscripciones, actividades y panel se guardan en PostgreSQL
    API_CONTACTO: conServidor || conApiPublicada
  };
})();
