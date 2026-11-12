/* ==========================================================
   Encuesta.jsx - Encuesta pública y anónima (encuesta.html)
   Cualquier visitante puede responder, sin cuenta. Las preguntas son las mismas del portal
   (compartido/encuestas.json). POST /api/encuestas/:id/respuestas-publicas guarda las respuestas
   en PostgreSQL sin ningún dato de quien responde, y el panel las muestra agrupadas junto a
   las de los estudiantes (sección Encuestas).
   ========================================================== */
import { useState } from "react";
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { pedir } from "../../lib/api.js";
import { SIN_CONEXION } from "../../lib/config.js";
import { encuestas as ENCUESTAS } from "../../../../compartido/encuestas.json";

const ENLACES = [
  { href: "index.html", texto: "Inicio" },
  { href: "cursos.html", texto: "Cursos" },
  { href: "encuesta.html", texto: "Encuesta", actual: true },
];
const ESCALA = [[5, "5 · Muy bien"], [4, "4"], [3, "3"], [2, "2"], [1, "1 · Muy mal"]];
const MAX_TEXTO = 500; // el mismo máximo que valida el servidor

function Pregunta({ pregunta, nombre }) {
  if (pregunta.tipo === "texto") return (
    <div className="pregunta">
      <label htmlFor={nombre}>{pregunta.texto} <small>(opcional)</small></label>
      <textarea id={nombre} name={nombre} maxLength={MAX_TEXTO}></textarea>
    </div>
  );
  const opciones = pregunta.tipo === "escala" ? ESCALA : pregunta.opciones.map((o) => [o, o]);
  return (
    <fieldset className="pregunta">
      <legend>{pregunta.texto}</legend>
      <div className="opciones">
        {opciones.map(([valor, texto]) => <label key={valor}><input type="radio" name={nombre} value={valor} /> <span>{texto}</span></label>)}
      </div>
    </fieldset>
  );
}

export default function Encuesta() {
  const [id, setId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null); // { texto, error }
  const encuesta = ENCUESTAS.find((e) => e.id === id);
  const avisar = (texto, error = false) => setEstado({ texto, error });

  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget, f = form.elements;
    if (f.sitio_web.value) return; // campo trampa: solo un bot lo llena
    if (!encuesta) return avisar("Elige una encuesta para responder.", true);
    // Mismo formato que valida el servidor: número en las escalas, la opción elegida o el texto (opcional)
    const respuestas = {};
    for (const p of encuesta.preguntas) {
      const valor = String(f["p_" + p.id]?.value || "").trim();
      if (p.tipo !== "texto" && !valor) return avisar("Elige una opción en cada pregunta antes de enviar.", true);
      respuestas[p.id] = p.tipo === "escala" ? Number(valor) : valor;
    }
    if (!f.acepto.checked) return avisar("Debes confirmar que participas de forma voluntaria y has leído la política de datos.", true);
    setEnviando(true); setEstado(null);
    try {
      await pedir("POST", `/encuestas/${encodeURIComponent(encuesta.id)}/respuestas-publicas`, { respuestas, acepto: true });
      form.reset(); setId("");
      avisar("¡Gracias! Recibimos tu respuesta. Nos ayuda a mejorar Talento Caribe.");
    } catch (problema) {
      avisar(problema.status ? problema.message : SIN_CONEXION, true);
    } finally { setEnviando(false); }
  }

  return (
    <>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li><a href="admin/login.html" className="btn btn-outline">Ingresar</a></li>} />
      <main id="contenido" className="container legal">
        <span className="eyebrow">Escúchanos también a ti</span>
        <h1>Encuesta de la comunidad</h1>
        <p>Tu opinión nos ayuda a mejorar los cursos y la plataforma. Es voluntaria y anónima: no te pedimos nombre, correo ni documento, y te pedimos no escribir datos personales en las respuestas abiertas. Tarda menos de 2 minutos.</p>

        <form id="form-encuesta" className="encuesta-form form" noValidate onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="e-encuesta">¿Sobre qué quieres opinar?</label>
            <select id="e-encuesta" name="encuesta" value={id} onChange={(e) => { setId(e.target.value); setEstado(null); }}>
              <option value="">Elige una encuesta…</option>
              {ENCUESTAS.map((e) => <option key={e.id} value={e.id}>{e.dept} — {e.titulo}</option>)}
            </select>
          </div>
          {/* key: al cambiar de encuesta las respuestas empiezan vacías */}
          {encuesta && <div className="encuesta-form" key={encuesta.id}>{encuesta.preguntas.map((p) => <Pregunta key={p.id} pregunta={p} nombre={"p_" + p.id} />)}</div>}
          {/* Campo trampa para bots: debe quedar vacío */}
          <div className="campo-trampa" aria-hidden="true">
            <label htmlFor="e-web">No llenar este campo</label>
            <input id="e-web" name="sitio_web" type="text" tabIndex="-1" autoComplete="off" />
          </div>
          <div className="campo campo-check">
            <input id="e-acepto" name="acepto" type="checkbox" />
            <label htmlFor="e-acepto">Participo de forma voluntaria y entiendo que mis respuestas son anónimas y se guardan sin mi nombre para mejorar Talento Caribe, según la <a href="privacidad.html" target="_blank" rel="noopener">Política de Tratamiento de Datos Personales</a>.</label>
          </div>
          {estado && <p className={"form-estado" + (estado.error ? " estado-error" : "")} role="status" aria-live="polite">{estado.texto}</p>}
          <BotonCarga cargando={enviando} id="encuesta-enviar" disabled={!encuesta}>Enviar mis respuestas</BotonCarga>
        </form>
      </main>
      <PiePublico />
    </>
  );
}
