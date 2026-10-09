/* ==========================================================
   Encuestas: el estudiante envía sus respuestas (una vez por encuesta).
   Las preguntas salen de js/encuestas-data.js, el mismo archivo que usa
   la página, así el servidor valida exactamente lo que el estudiante ve.
   Los resultados llegan al panel con GET /api/datos, sin nombres.
   ========================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const router = require("express").Router();
const pool = require("../db");
const { requiereSesion, requiereRol } = require("../seguridad");

// El archivo del frontend se ejecuta en un contexto aislado (como hace scripts/generar-seed.js con los cursos)
const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "..", "..", "js", "encuestas-data.js"), "utf8"), contexto);
const ENCUESTAS = contexto.window.TALENTO_CARIBE_ENCUESTAS;

/* Devuelve las respuestas limpias o null si falta alguna obligatoria o tiene un valor que no existe */
function revisar(encuesta, r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const limpias = {};
  for (const p of encuesta.preguntas) {
    const valor = r[p.id];
    if (p.tipo === "escala") { if (!Number.isInteger(valor) || valor < 1 || valor > 5) return null; limpias[p.id] = valor; }
    else if (p.tipo === "opciones") { if (!p.opciones.includes(valor)) return null; limpias[p.id] = valor; }
    else { const t = typeof valor === "string" ? valor.trim() : ""; if (t.length > 500) return null; limpias[p.id] = t; }
  }
  return limpias;
}

router.post("/encuestas/:id/respuestas", requiereSesion, requiereRol("estudiante"), async (req, res, next) => {
  const encuesta = ENCUESTAS.find((e) => e.id === req.params.id);
  if (!encuesta) return res.status(404).json({ error: "La encuesta no existe." });
  const respuestas = revisar(encuesta, req.body?.respuestas);
  if (!respuestas) return res.status(400).json({ error: "Responde las preguntas obligatorias con una de las opciones." });
  try {
    const { rowCount } = await pool.query(
      "INSERT INTO respuestas_encuesta (encuesta, estudiante_id, respuestas) VALUES ($1, $2, $3) ON CONFLICT (encuesta, estudiante_id) DO NOTHING",
      [encuesta.id, req.usuario.id, JSON.stringify(respuestas)]);
    rowCount ? res.status(201).json({ ok: true }) : res.status(409).json({ error: "Ya respondiste esta encuesta. ¡Gracias!" });
  } catch (e) { next(e); }
});

module.exports = router;
