/* ==========================================================
   ChatIA.jsx - Chat del asistente de Talento Caribe
   Historial (se recuerda por usuario en este navegador), sugerencias,
   acciones, indicador de escritura, copiar respuesta y nueva conversación.
   Las respuestas salen de src/lib/asistente.js (POST /api/chat con Gemini).
   Props: modo ("inicio" | "flotante"), ampliable, ampliado, cerrable,
          alCerrar, alAmpliar, alNavegar, navegar(seccion) -> true si la página la abrió,
          panel (perfil del cargo, en el panel administrativo), ref (enviar / enfocar).
   ========================================================== */
import { Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { conectarAsistente, contexto, iniciales, L, responder } from "../lib/asistente.js";
import { useDatos } from "../contexto/Datos.jsx";
import { leerSesion } from "../lib/sesion.js";
import { leerLocal, guardarLocal } from "../lib/utils.js";
import { locale } from "../i18n/idioma.js";
import { enlace } from "../lib/rutas.js";
import Icono from "./Icono.jsx";

/* Markdown mínimo: **negrita**, _cursiva_, `código` y listas. React escapa el texto, así que es seguro. */
function enLinea(texto) {
  const partes = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|(^|\s)[_*]([^_*]+)[_*](?=\s|$|[.,)])/g;
  let ultimo = 0, m, k = 0;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1] !== undefined) partes.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2] !== undefined) partes.push(<code key={k++}>{m[2]}</code>);
    else partes.push(<Fragment key={k++}>{m[3]}<em>{m[4]}</em></Fragment>);
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}
export function Formato({ texto }) {
  const bloques = [];
  let lista = null;
  String(texto).split("\n").forEach((l) => {
    const ul = l.match(/^\s*[-•]\s+(.*)/), ol = l.match(/^\s*(\d+)[.)]\s+(.*)/);
    if (ul || ol) {
      const tipo = ul ? "ul" : "ol";
      if (!lista || lista.tipo !== tipo) { lista = { tipo, items: [] }; bloques.push(lista); }
      lista.items.push(ul ? ul[1] : ol[2]);
    } else { lista = null; if (l.trim()) bloques.push(l); }
  });
  return bloques.map((b, i) => {
    if (typeof b === "string") return <p key={i}>{enLinea(b)}</p>;
    const Lista = b.tipo;
    return <Lista key={i}>{b.items.map((x, j) => <li key={j}>{enLinea(x)}</li>)}</Lista>;
  });
}

const hora = (iso) => new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
const SUBTITULO = { estudiante: "Tu tutor de aprendizaje", docente: "Tu copiloto docente", administrativo: "Tu asistente de gestión", visitante: "Te ayudo a empezar" };

function Mensaje({ m, inicialesUsuario }) {
  const [copiado, setCopiado] = useState(false);
  const bot = m.de === "bot";
  return (
    <div className={`ia-msg ia-msg-${m.de}`}>
      {bot ? <span className="ia-avatar ia-avatar-bot" aria-hidden="true"></span> : <span className="ia-avatar ia-avatar-yo" aria-hidden="true">{inicialesUsuario}</span>}
      <div className="ia-cuerpo">
        <div className="ia-burbuja" data-no-traducir={bot ? undefined : ""}>
          {bot ? <Formato texto={m.texto} /> : <p>{m.texto.split("\n").map((l, i) => <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>)}</p>}
        </div>
        <div className="ia-meta">
          <span>{bot ? "Asistente" : "Tú"} · {hora(m.hora)}</span>
          {bot && (
            <button type="button" className="ia-copiar" title="Copiar respuesta" aria-label="Copiar respuesta" onClick={() => { navigator.clipboard?.writeText(m.texto); setCopiado(true); }}>
              <Icono nombre={copiado ? "check" : "copiar"} tam={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatIA({ modo = "x", className = "", ampliable, ampliado, cerrable, alCerrar, alAmpliar, alNavegar, navegar, panel, ref, ...resto }) {
  const { modelo } = useDatos();
  const sesion = leerSesion();
  const rol = sesion?.rol || "visitante";
  conectarAsistente({ modelo, sesion, panel }); // el asistente responde con los datos que tiene la página
  const clave = "tc_chat_" + (sesion?.correo || "visitante");
  const inicialesUsuario = (sesion?.nombre || "Tú").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const [historial, setHistorial] = useState(() => leerLocal(clave, []));
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const log = useRef(null), entrada = useRef(null), ocupado = useRef(false);

  const guardar = (lista) => { const corta = lista.slice(-60); guardarLocal(clave, corta); return corta; };
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [historial, escribiendo]);
  useEffect(() => { // la caja de texto crece con el mensaje
    const el = entrada.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [texto]);

  async function enviar(pregunta) {
    pregunta = String(pregunta || "").trim();
    if (!pregunta || ocupado.current) return;
    ocupado.current = true; setTexto("");
    const yo = { de: "yo", texto: pregunta, hora: new Date().toISOString() };
    let lista = guardar([...historial, yo]);
    setHistorial(lista); setEscribiendo(true);
    const inicio = Date.now();
    const respuesta = await responder(pregunta, lista.map((h) => ({ rol: h.de === "yo" ? "user" : "assistant", texto: h.texto })));
    // "Escribiendo..." dura un tiempo natural; si la IA real ya tardó, no se agrega espera
    const pausa = Math.min(1300, 450 + respuesta.texto.length * 4) - (Date.now() - inicio);
    if (pausa > 0) await new Promise((ok) => setTimeout(ok, pausa));
    lista = guardar([...lista, { de: "bot", hora: new Date().toISOString(), ...respuesta }]);
    setHistorial(lista); setEscribiendo(false);
    ocupado.current = false;
  }
  useImperativeHandle(ref, () => ({ enviar, enfocar: () => entrada.current?.focus() }));

  function ejecutar(accion) {
    if (accion.ir && navegar?.(accion.ir)) { alNavegar?.(); return; }
    if (accion.url) location.href = enlace(accion.url);
    else if (accion.ir) location.href = enlace(rol === "administrativo" ? "admin/panel.html" : "portal.html") + "#" + accion.ir;
  }
  function nueva() { setHistorial(guardar([])); entrada.current?.focus(); }

  const c = contexto();
  const saludo = {
    estudiante: L(`¡Hola, ${c.nombre || "estudiante"}! 👋 Soy tu tutor. Te ayudo a organizarte, entender conceptos y avanzar en tus actividades.`, `Hi, ${c.nombre || "student"}! 👋 I'm your tutor. I'll help you get organized, understand concepts and move forward with your activities.`),
    docente: L(`¡Hola, ${c.nombre || "profe"}! 👋 Te ayudo a crear actividades, revisar entregas y acompañar a tus estudiantes.`, `Hi, ${c.nombre || "teacher"}! 👋 I'll help you create activities, review submissions and support your students.`),
    administrativo: L(`¡Hola, ${c.nombre || ""}! 👋 Te ayudo con indicadores, inscripciones y las funciones de tu cargo.`, `Hi, ${c.nombre || ""}! 👋 I'll help you with indicators, enrollments and your role's functions.`),
    visitante: L("¡Hola! 👋 Soy el asistente de Talento Caribe. Te ayudo a encontrar tu primer curso.", "Hi! 👋 I'm the Talento Caribe assistant. I'll help you find your first course."),
  }[rol];
  const ultimo = historial[historial.length - 1];
  const idEntrada = "ia-entrada-" + modo;

  return (
    <div className={`${className} ia-chat ia-chat-${modo}`.trim()} {...resto}>
      <header className="ia-cabecera">
        <span className="ia-avatar ia-avatar-bot" aria-hidden="true"></span>
        <div className="ia-cabecera-texto"><strong>Asistente Talento Caribe</strong><small><span className="punto-en-linea" aria-hidden="true"></span>{SUBTITULO[rol]}</small></div>
        <div className="ia-cabecera-acciones">
          <button type="button" className="ia-icono-btn" title="Nueva conversación" aria-label="Nueva conversación" onClick={nueva}><Icono nombre="reiniciar" tam={18} /></button>
          {ampliable && <button type="button" className="ia-icono-btn" title="Ampliar" aria-label="Ampliar chat" onClick={alAmpliar}><Icono nombre={ampliado ? "reducir" : "ampliar"} tam={18} /></button>}
          {cerrable && <button type="button" className="ia-icono-btn" title="Cerrar" aria-label="Cerrar asistente" onClick={alCerrar}>×</button>}
        </div>
      </header>
      <div className="ia-log" role="log" aria-live="polite" aria-label="Conversación con el asistente" ref={log}>
        {!historial.length && (
          <div className="ia-bienvenida">
            <span className="ia-bienvenida-logo" aria-hidden="true"></span>
            <p>{saludo}</p>
            <div className="ia-iniciales">
              {iniciales(rol).map((x) => <button key={x.texto} type="button" className="ia-inicial" onClick={() => enviar(x.texto)}><Icono nombre={x.icono} tam={18} /><span>{x.texto}</span></button>)}
            </div>
          </div>
        )}
        {historial.map((m, i) => <Mensaje key={i + m.hora} m={m} inicialesUsuario={inicialesUsuario} />)}
        {!escribiendo && ultimo?.de === "bot" && (ultimo.sugerencias?.length || ultimo.acciones?.length) ? (
          <div className="ia-extras">
            {(ultimo.acciones || []).map((a, i) => <button key={"a" + i} type="button" className="ia-accion" onClick={() => ejecutar(a)}>{a.texto} <Icono nombre="flecha" tam={14} /></button>)}
            {(ultimo.sugerencias || []).map((s) => <button key={s} type="button" className="ia-sugerencia" onClick={() => enviar(s)}>{s}</button>)}
          </div>
        ) : null}
        {escribiendo && (
          <div className="ia-msg ia-msg-bot ia-escribiendo">
            <span className="ia-avatar ia-avatar-bot" aria-hidden="true"></span>
            <div className="ia-burbuja"><span className="ia-puntos"><i></i><i></i><i></i></span><span className="sr-only">El asistente está escribiendo</span></div>
          </div>
        )}
      </div>
      <form className="ia-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
        <label className="sr-only" htmlFor={idEntrada}>Escribe tu mensaje</label>
        <textarea id={idEntrada} ref={entrada} rows="1" maxLength="500" placeholder="Escribe tu pregunta…" value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(texto); } }} />
        <button type="submit" className="ia-enviar" aria-label="Enviar"><Icono nombre="enviar" tam={18} /></button>
      </form>
      <p className="ia-nota">Asistente con IA · verifica la información importante.</p>
    </div>
  );
}
