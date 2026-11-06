/* ==========================================================
   server.js - Servidor de Talento Caribe
   - Sirve la página web (index.html, cursos.html, portal.html...)
   - Expone la API en /api conectada a PostgreSQL
   Abre http://localhost:3000 después de ejecutar: npm start

   Rutas de la API (detalle en backend/README.md):
     públicas      GET /api/salud · GET /api/cursos · POST /api/contacto
     asistente IA  POST /api/chat  (Google Gemini, plan gratuito; necesita GEMINI_API_KEY en .env)
     cuenta        POST /api/auth/registro · POST /api/auth/login · GET /api/auth/yo · PUT /api/auth/perfil
                   POST /api/auth/recuperar · POST /api/auth/restablecer  (contraseña olvidada)
     datos         GET /api/datos  (lo que el usuario actual puede ver)
     académico     inscripciones, actividades, entregas y calificaciones
     encuestas     POST /api/encuestas/:id/respuestas  (estudiantes)
     administración cursos, mensajes, gastos y asistente
   Los correos (bienvenida, recuperar contraseña, avisos) salen por SMTP: ver src/correo.js
   ========================================================== */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { cabecerasSeguras, limitePorIP, PRODUCCION } = require("./seguridad");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RAIZ = path.join(__dirname, "..", ".."); // carpeta talento-caribe (el frontend)

app.disable("x-powered-by");
// En Render (u otro hosting con proxy) la IP real del visitante llega en X-Forwarded-For
if (process.env.RENDER || process.env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(cabecerasSeguras);
app.use(express.json({ limit: "100kb" }));
// Permite llamar a la API desde Live Server (puerto 5500) y desde los dominios de CORS_ORIGENES
// (por ejemplo la página publicada en GitHub Pages: https://tu-usuario.github.io)
const ORIGENES_EXTRA = (process.env.CORS_ORIGENES || "").split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
// En producción solo se aceptan los dominios de CORS_ORIGENES (los de Live Server son para trabajar en el computador)
const ORIGENES_LOCALES = PRODUCCION ? [] : ["http://127.0.0.1:5500", "http://localhost:5500", `http://localhost:${PORT}`];
app.use(cors({ origin: [...ORIGENES_LOCALES, ...ORIGENES_EXTRA], maxAge: 600 }));

/* ---------- API ---------- */
// Límite general: 300 peticiones por minuto por IP (la página normal usa muy pocas). Frena a quien
// intente descargar todo o saturar el servidor; las rutas sensibles tienen límites propios más bajos.
app.use("/api", limitePorIP(300, 1, "Demasiadas peticiones seguidas. Espera un minuto."));
app.use("/api", require("./rutas/publicas"));
app.use("/api", require("./rutas/chat"));
app.use("/api/auth", require("./rutas/auth"));
app.use("/api", require("./rutas/datos"));
app.use("/api", require("./rutas/academico"));
app.use("/api", require("./rutas/encuestas"));
app.use("/api", require("./rutas/admin"));
app.use("/api", require("./rutas/cuentas"));
app.use("/api", (req, res) => res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` }));

/* ---------- Página web ----------
   Lista blanca: solo se publican las páginas y las carpetas del frontend. Nunca la carpeta del
   servidor (código y .env), los scripts SQL, el README ni la configuración. (Bloquear solo
   "/backend" no basta: "/%62ackend" es la misma ruta escrita de otra forma.) */
/* El sitio público está hecho con React: se sirve la versión construida (carpeta dist/, se crea con
   "npm run build" en la carpeta principal). Sin dist/ la API funciona igual, pero las páginas avisan
   cómo construirla (en Render no hace falta: allí solo vive la API y la página está en GitHub Pages). */
const WEB = path.join(RAIZ, "dist");
const hayWeb = fs.existsSync(path.join(WEB, "index.html"));
const estaticos = { dotfiles: "deny", index: false, extensions: ["html"] };
// HTML, CSS y JS se revalidan siempre (así una actualización se ve de inmediato); las imágenes se guardan 7 días
for (const carpeta of ["css", "js", "admin"]) app.use(`/${carpeta}`, express.static(path.join(WEB, carpeta), estaticos));
app.use("/assets", express.static(path.join(WEB, "assets"), { ...estaticos, maxAge: "7d" }));
// Archivos que genera Vite: su nombre cambia con cada versión (index-a1b2c3.js), así que se pueden guardar un año
app.use("/app", express.static(path.join(WEB, "app"), { ...estaticos, maxAge: "365d", immutable: true }));
const PAGINAS = ["index", "cursos", "portal", "registro", "recuperar"];
const SIN_WEB = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Talento Caribe</title><body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.6">
<h1>Falta construir la página</h1><p>El sitio está hecho con React y hay que construirlo una vez. En una terminal, en la carpeta principal del proyecto (no en backend/):</p>
<pre style="background:#eee;padding:1rem">npm install\nnpm run build</pre><p>Después recarga esta página. La API ya funciona: <a href="/api/salud">/api/salud</a>.</p></body></html>`;
app.get(/^\/(?:([a-z]+)(?:\.html)?)?$/, (req, res, next) => {
  const pagina = req.params[0] || "index";
  if (!PAGINAS.includes(pagina)) return next();
  hayWeb ? res.sendFile(path.join(WEB, `${pagina}.html`)) : res.status(503).type("html").send(SIN_WEB);
});
// Página 404 con la marca (la misma que usa GitHub Pages; aquí la base de sus enlaces es la raíz del sitio)
const pagina404 = hayWeb ? fs.readFileSync(path.join(WEB, "404.html"), "utf8").replace('<base href="/talento-caribe/">', '<base href="/">') : SIN_WEB;
app.use((req, res) => (req.method === "GET" && req.accepts("html") ? res.status(404).type("html").send(pagina404) : res.status(404).type("text/plain").send("No encontrado")));

/* ---------- Errores ---------- */
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido." });
  if (error.type === "entity.too.large") return res.status(413).json({ error: "Los datos enviados son demasiado grandes." });
  console.error(`✖ ${req.method} ${req.path}:`, error.message); // req.path: sin la parte ?..., que podría llevar un token
  const sinBase = ["ECONNREFUSED", "28P01", "3D000", "42P01"].includes(error.code);
  if (error.code === "23514" || error.code === "22P02") return res.status(400).json({ error: "Algún dato no cumple las reglas de la base de datos." });
  res.status(sinBase ? 503 : 500).json({ error: sinBase ? "La base de datos no está disponible. Revisa que PostgreSQL esté encendido y ejecuta npm run db:init." : "Error interno del servidor." });
});

const servidor = app.listen(PORT, async () => {
  console.log(`\n🌴 Talento Caribe en http://localhost:${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api/salud`);
  console.log(`   Página: ${hayWeb ? "✅ versión construida (dist/)" : "⚠️  falta construirla: npm run build en la carpeta principal"}`);
  const chat = require("./rutas/chat");
  console.log(`   Asistente IA: ${chat.iaConfigurada() ? `✅ Google Gemini (${chat.modelo})` : "⚠️  sin GEMINI_API_KEY (responde con reglas locales)"}`);
  const correo = require("./correo");
  console.log(`   Correo: ${correo.configurado() ? `✅ ${correo.medio()}` : "⚠️  sin BREVO_API_KEY ni SMTP (los correos se muestran en esta terminal)"}`);
  try {
    await pool.query("SELECT 1 FROM usuarios LIMIT 1");
    console.log("   Base de datos: ✅ conectada\n");
  } catch (error) {
    const msj = error.code === "42P01" ? "faltan las tablas → ejecuta npm run db:init" : error.message;
    console.log(`   Base de datos: ⚠️  ${msj}`);
    console.log("   (La página funciona igual en modo demostración.)\n");
  }
});
// Una conexión que envía su petición muy despacio (ataque "slowloris") se corta a los 30 s
servidor.headersTimeout = 20000;
servidor.requestTimeout = 30000;
