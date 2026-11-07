/* AsistenteFlotante.jsx - Asistente disponible en todas las páginas (botón abajo a la derecha).
   Se puede ampliar a pantalla casi completa y conserva el historial por usuario.
   Otras partes de la página lo abren con abrirAsistente("pregunta opcional"). */
import { useEffect, useRef, useState } from "react";
import ChatIA from "./ChatIA.jsx";

export const abrirAsistente = (pregunta) => dispatchEvent(new CustomEvent("tc:asistente", { detail: pregunta }));

export default function AsistenteFlotante({ navegar, panel }) {
  const [abierto, setAbierto] = useState(false);
  const [ampliado, setAmpliado] = useState(false);
  const chat = useRef(null), lanzador = useRef(null), pendiente = useRef(null);

  const cerrar = () => { setAbierto(false); setAmpliado(false); lanzador.current?.focus(); };
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape" && abierto) cerrar(); };
    const abrir = (e) => { pendiente.current = e.detail || null; setAbierto(true); };
    document.addEventListener("keydown", tecla);
    addEventListener("tc:asistente", abrir);
    return () => { document.removeEventListener("keydown", tecla); removeEventListener("tc:asistente", abrir); };
  }, [abierto]);
  useEffect(() => {
    if (!abierto) return;
    chat.current?.enfocar();
    if (pendiente.current) { chat.current?.enviar(pendiente.current); pendiente.current = null; }
  }, [abierto]);

  return (
    <section id="tc-chat-widget" className={"tc-chat-widget" + (abierto ? " is-abierto" : "") + (ampliado ? " is-ampliado" : "")} aria-label="Asistente de Talento Caribe">
      <button ref={lanzador} className="tc-chat-launch" type="button" aria-expanded={abierto} aria-controls="tc-chat-panel" onClick={() => (abierto ? cerrar() : setAbierto(true))}>
        <span className="tc-chat-launch-icon" aria-hidden="true"></span><span className="tc-chat-launch-label">Asistente IA</span>
      </button>
      <div className="tc-chat-panel" id="tc-chat-panel" hidden={!abierto}>
        {abierto && <ChatIA ref={chat} modo="flotante" ampliable cerrable ampliado={ampliado} alAmpliar={() => setAmpliado((a) => !a)} alCerrar={cerrar} alNavegar={cerrar} navegar={navegar} panel={panel} />}
      </div>
    </section>
  );
}
