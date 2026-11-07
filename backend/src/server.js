/* ==========================================================
   server.js - Servidor de Talento Caribe
   - Expone la API en /api conectada a PostgreSQL
   - Sirve la página web en React ya compilada (frontend/dist: se crea con
     "npm run build" dentro de frontend/). Mientras programas puedes usar
     "npm run dev" en frontend/ (puerto 5173), que envía /api a este servidor.
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
const RAIZ = path.join(__dirname, "..", "..", "frontend", "dist"); // la página en React ya compilada

app.disable("x-powered-by");
// En Render (u otro hosting con proxy) la IP real del visitante llega en X-Forwarded-For
if (process.env.RENDER || process.env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(cabecerasSeguras);
app.use(express.json({ limit: "100kb" }));
// Permite llamar a la API desde Vite (npm run dev: 5173, npm run preview: 4173) y desde los dominios de CORS_ORIGENES
// (por ejemplo la página publicada en GitHub Pages: https://tu-usuario.github.io)
const ORIGENES_EXTRA = (process.env.CORS_ORIGENES || "").split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
// En producción solo se aceptan los dominios de CORS_ORIGENES (los de Vite son para trabajar en el computador).
// Vite normalmente reenvía /api por su cuenta (proxy en vite.config.js), así que estas entradas son un respaldo.
const ORIGENES_LOCALES = PRODUCCION ? [] : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173", `http://localhost:${PORT}`];
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

/* ---------- Página web (React compilado en frontend/dist) ----------
   Lista blanca: solo se publican las páginas y las carpetas del build. Nunca la carpeta del
   servidor (código y .env), los scripts SQL, el README ni la configuración. */
const HAY_BUILD = fs.existsSync(path.join(RAIZ, "index.html"));
const estaticos = { dotfiles: "deny", index: false, extensions: ["html"] };
// Los archivos de static/ llevan una huella en el nombre (index-a1b2c3.js): si cambian, cambia el nombre, así que se guardan un año.
// Las páginas HTML se revalidan siempre (así una actualización se ve de inmediato).
app.use("/static", express.static(path.join(RAIZ, "static"), { ...estaticos, maxAge: "365d", immutable: true }));
app.use("/assets", express.static(path.join(RAIZ, "assets"), { ...estaticos, maxAge: "7d" }));
app.use("/admin", express.static(path.join(RAIZ, "admin"), estaticos));
const PAGINAS = ["index", "cursos", "portal", "registro", "recuperar"];
app.get(/^\/(?:([a-z]+)(?:\.html)?)?$/, (req, res, next) => {
  const pagina = req.params[0] || "index";
  if (!PAGINAS.includes(pagina)) return next();
  if (!HAY_BUILD) return res.status(503).type("text/plain; charset=utf-8").send("La página en React aún no está compilada. Ejecuta: cd frontend && npm install && npm run build\n(La API sigue funcionando en /api.)");
  res.sendFile(path.join(RAIZ, `${pagina}.html`));
});
// Página 404 con la marca (la misma que usa GitHub Pages; aquí la base de sus enlaces es la raíz del sitio)
const pagina404 = HAY_BUILD ? fs.readFileSync(path.join(RAIZ, "404.html"), "utf8").replace(/<base href="[^"]*">/, '<base href="/">') : "<h1>Página no encontrada</h1>";
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
  if (!HAY_BUILD) console.log("   Página: ⚠️  falta compilar React → cd frontend && npm install && npm run build (o usa npm run dev en frontend/)");
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
    console.log("   (La página necesita la base de datos: revisa DATABASE_URL en .env.)\n");
  }
});
// Una conexión que envía su petición muy despacio (ataque "slowloris") se corta a los 30 s
servidor.headersTimeout = 20000;
servidor.requestTimeout = 30000;
