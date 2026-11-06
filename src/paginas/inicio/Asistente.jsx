/* Asistente - Sección del asistente con IA.
   El chat en sí es el componente compartido TCChatUI (js/asistente-ia.js), el mismo del portal y del
   panel: React solo le da un contenedor y lo monta una vez. */
import { useEffect, useRef } from "react";

const VENTAJAS = [
  "Te recomienda una ruta según tus intereses.",
  "Te explica conceptos con ejemplos del Caribe.",
  "Te pone retos rápidos para practicar.",
];

export default function Asistente() {
  const contenedor = useRef(null);
  useEffect(() => {
    const caja = contenedor.current;
    // En desarrollo React ejecuta los efectos dos veces: se monta una sola vez
    if (!caja || caja.dataset.montado || !window.TCChatUI) return;
    caja.dataset.montado = "1";
    window.TCChatUI.montar(caja, { modo: "inicio" });
  }, []);

  return (
    <section id="asistente" className="section" aria-labelledby="asistente-titulo">
      <div className="container asistente-grid">
        <div data-revelar="izquierda">
          <span className="eyebrow">Asistente IA</span>
          <h2 id="asistente-titulo">Pregúntale al asistente de Talento Caribe</h2>
          <p>Conoce todos los cursos y te ayuda a elegir por dónde empezar. Cuéntale qué te gusta y qué sabes hacer.</p>
          <ul className="lista-check">{VENTAJAS.map((v) => <li key={v}>{v}</li>)}</ul>
        </div>
        <div className="chat-completo chat-inicio" id="chat-inicio" ref={contenedor} data-revelar="derecha" />
      </div>
    </section>
  );
}
