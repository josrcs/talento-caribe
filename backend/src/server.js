/* ==========================================================
   server.js - Servidor de Talento Caribe
   - Sirve la página web (index.html, cursos.html, portal.html...)
   - Expone la API en /api conectada a PostgreSQL
   Abre http://localhost:3000 después de ejecutar: npm start

   Rutas de la API (detalle en backend/README.md):
     públicas      GET /api/salud · GET /api/cursos · POST /api/contacto
     asistente IA  POST /api/chat  (Claude; necesita ANTHROPIC_API_KEY en .env)
     cuenta        POST /api/auth/registro · POST /api/auth/login · GET /api/auth/yo · PUT /api/auth/perfil
     datos         GET /api/datos  (lo que el usuario actual puede ver)
     académico     inscripciones, actividades, entregas y calificaciones
     administración cursos, mensajes, gastos y asistente
   ========================================================== */
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RAIZ = path.join(__dirname, "..", ".."); // carpeta talento-caribe (el frontend)

app.disable("x-powered-by");
// En Render (u otro hosting con proxy) la IP real del visitante llega en X-Forwarded-For
if (process.env.RENDER || process.env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));
// Permite llamar a la API desde Live Server (puerto 5500) y desde los dominios de CORS_ORIGENES
// (por ejemplo la página publicada en GitHub Pages: https://tu-usuario.github.io)
const ORIGENES_EXTRA = (process.env.CORS_ORIGENES || "").split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5500", `http://localhost:${PORT}`, ...ORIGENES_EXTRA] }));

/* ---------- API ---------- */
app.use("/api", require("./rutas/publicas"));
app.use("/api", require("./rutas/chat"));
app.use("/api/auth", require("./rutas/auth"));
app.use("/api", require("./rutas/datos"));
app.use("/api", require("./rutas/academico"));
app.use("/api", require("./rutas/admin"));
app.use("/api", (req, res) => res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` }));

/* ---------- Página web ---------- */
// Nunca se publican la carpeta del servidor (tiene el .env) ni los scripts SQL
app.use(["/backend", "/database"], (req, res) => res.status(404).send("No encontrado"));
app.use(express.static(RAIZ, { dotfiles: "deny", extensions: ["html"] }));

/* ---------- Errores ---------- */
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido." });
  console.error(`✖ ${req.method} ${req.originalUrl}:`, error.message);
  const sinBase = ["ECONNREFUSED", "28P01", "3D000", "42P01"].includes(error.code);
  if (error.code === "23514" || error.code === "22P02") return res.status(400).json({ error: "Algún dato no cumple las reglas de la base de datos." });
  res.status(sinBase ? 503 : 500).json({ error: sinBase ? "La base de datos no está disponible. Revisa que PostgreSQL esté encendido y ejecuta npm run db:init." : "Error interno del servidor." });
});

app.listen(PORT, async () => {
  console.log(`\n🌴 Talento Caribe en http://localhost:${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api/salud`);
  console.log(`   Asistente IA: ${require("./rutas/chat").iaConfigurada() ? "✅ conectado a Claude" : "⚠️  sin ANTHROPIC_API_KEY (responde con reglas locales)"}`);
  try {
    await pool.query("SELECT 1 FROM usuarios LIMIT 1");
    console.log("   Base de datos: ✅ conectada\n");
  } catch (error) {
    const msj = error.code === "42P01" ? "faltan tablas o son de la versión anterior → ejecuta npm run db:reiniciar" : error.message;
    console.log(`   Base de datos: ⚠️  ${msj}`);
    console.log("   (La página funciona igual en modo demostración.)\n");
  }
});
