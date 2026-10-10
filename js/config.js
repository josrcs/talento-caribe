/* config.js - Configuración global del frontend
   Tres formas de abrir la página:
   1. npm start en backend/ → http://localhost:3000: API en el mismo sitio (PostgreSQL + IA).
   2. Live Server u otro servidor local: modo demostración (datos en localStorage).
   3. GitHub Pages: modo demostración, o la API publicada si se llena API_PUBLICADA
      (por ejemplo "https://talento-caribe-api.onrender.com"). En ese caso agrega la URL de
      GitHub Pages a CORS_ORIGENES en el .env del servidor. */
(() => {
  const API_PUBLICADA = "";

  const conServidor = ["3000", "3001"].includes(location.port); // 3001: npm run pruebas (base de pruebas)
  const local = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const conApiPublicada = !conServidor && !local && Boolean(API_PUBLICADA);
  window.TC = {
    API_URL: conServidor ? "/api" : conApiPublicada ? API_PUBLICADA.replace(/\/+$/, "") + "/api" : "http://localhost:3000/api",
    MODO_DEMO: !(conServidor || conApiPublicada), // false: cuentas, inscripciones, actividades y panel se guardan en PostgreSQL
    API_CONTACTO: conServidor || conApiPublicada,
    // Mensaje si la API no responde: en el computador se recuerda encender el servidor; publicada, el
    // servidor gratuito puede estar "despertando" (tarda unos segundos tras un rato sin visitas)
    SIN_CONEXION: conServidor ? "No hay conexión con el servidor. Revisa que esté encendido (npm start)." : "No hay conexión con el servidor. Puede estar iniciando: inténtalo de nuevo en unos segundos."
  };
})();
