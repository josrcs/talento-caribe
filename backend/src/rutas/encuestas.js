/* ==========================================================
   Encuestas: el estudiante envía sus respuestas (una vez por encuesta) y cualquier
   visitante puede responder la encuesta pública y anónima (encuesta.html), sin cuenta.
   Las preguntas salen de compartido/encuestas.json, el mismo archivo que usa
   la página en React, así el servidor valida exactamente lo que el estudiante ve.
   Los resultados llegan al panel con GET /api/datos, sin nombres.
   ========================================================== */
const router = require("express").Router();
const pool = require("../db");
const { requiereSesion, requiereRol, limitePorIP } = require("../seguridad");

const { encuestas: ENCUESTAS } = require("../../../compartido/encuestas.json");

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

/* Encuesta pública y anónima: sin sesión y sin datos de quien responde (estudiante_id queda vacío).
   Límite por IP para que nadie llene los resultados a punta de envíos repetidos. */
const limitarPublicas = limitePorIP(5, 10, "Enviaste varias respuestas seguidas. Espera unos minutos y vuelve a intentarlo.");
router.post("/encuestas/:id/respuestas-publicas", limitarPublicas, async (req, res, next) => {
  const encuesta = ENCUESTAS.find((e) => e.id === req.params.id);
  if (!encuesta) return res.status(404).json({ error: "La encuesta no existe." });
  if (req.body?.acepto !== true) return res.status(400).json({ error: "Debes confirmar que participas de forma voluntaria." });
  const respuestas = revisar(encuesta, req.body?.respuestas);
  if (!respuestas) return res.status(400).json({ error: "Responde las preguntas obligatorias con una de las opciones." });
  try {
    await pool.query("INSERT INTO respuestas_encuesta (encuesta, estudiante_id, respuestas) VALUES ($1, NULL, $2)", [encuesta.id, JSON.stringify(respuestas)]);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
