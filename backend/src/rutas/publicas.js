/* Rutas públicas: estado del servidor, catálogo y formulario de contacto */
const router = require("express").Router();
const pool = require("../db");
const { SQL_CURSOS } = require("../consultas");
const { EMAIL, texto, opcional, limpio, entero, rechazar } = require("../validar");
const { iaConfigurada } = require("./chat");
const correos = require("../correo");

router.get("/salud", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT now() AS hora, (SELECT count(*)::int FROM cursos) AS cursos, (SELECT count(*)::int FROM usuarios) AS usuarios");
    res.json({ servidor: "ok", baseDeDatos: "conectada", asistenteIA: iaConfigurada() ? "conectado" : "sin clave", ...rows[0] });
  } catch (error) {
    res.status(503).json({ servidor: "ok", baseDeDatos: "sin conexión", asistenteIA: iaConfigurada() ? "conectado" : "sin clave", detalle: error.code === "42P01" ? "Faltan tablas: ejecuta npm run db:reiniciar" : error.message });
  }
});

router.get("/cursos", async (req, res, next) => {
  try { res.json((await pool.query(SQL_CURSOS + " ORDER BY id")).rows); } catch (e) { next(e); }
});

router.get("/cursos/:id", async (req, res, next) => {
  const id = entero(req.params.id);
  if (!id) return res.status(400).json({ error: "El id del curso no es válido." });
  try {
    const { rows } = await pool.query(SQL_CURSOS + " WHERE id = $1", [id]);
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Curso no encontrado." });
  } catch (e) { next(e); }
});

router.post("/contacto", async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, {
    nombre: texto(b.nombre, 3, 80), correo: typeof b.correo === "string" && EMAIL.test(b.correo) && b.correo.length <= 120,
    interes: ["curso", "mentor", "alianza", "otro"].includes(b.interes), asunto: texto(b.asunto, 1, 100),
    mensaje: texto(b.mensaje, 10, 1000), telefono: opcional(b.telefono, 20),
  })) return;
  try {
    // $1, $2... evitan la inyección SQL: los datos nunca se pegan dentro del texto de la consulta
    const { rows } = await pool.query(
      "INSERT INTO mensajes_contacto (nombre, correo, telefono, interes, asunto, mensaje) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [b.nombre.trim(), b.correo.trim().toLowerCase(), limpio(b.telefono), b.interes, b.asunto.trim(), b.mensaje.trim()]);
    // Confirmación a quien escribió y copia al equipo (si CORREO_EQUIPO está configurado)
    const mensaje = { nombre: b.nombre.trim(), correo: b.correo.trim(), telefono: limpio(b.telefono), interes: b.interes, asunto: b.asunto.trim(), mensaje: b.mensaje.trim() };
    correos.contactoRecibido(mensaje);
    correos.avisoEquipo(mensaje);
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

module.exports = router;
