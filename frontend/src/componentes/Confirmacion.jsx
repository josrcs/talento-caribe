/* Confirmacion.jsx - Confirmación con el estilo de la plataforma (en vez de la ventana gris de confirm()).
   const ok = await confirmar({ titulo, mensaje, aceptar: "Eliminar", peligro: true })  (src/lib/utils.js)
   En acciones peligrosas el foco empieza en "Cancelar"; Esc o clic fuera también cancelan. */
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";

export default function Confirmacion() {
  const [pregunta, setPregunta] = useState(null);
  const si = useRef(null), no = useRef(null);
  useEffect(() => {
    const abrir = (e) => setPregunta((anterior) => { anterior?.resolver(false); return e.detail; }); // otra pregunta abierta cuenta como cancelada
    addEventListener("tc:confirmar", abrir);
    return () => removeEventListener("tc:confirmar", abrir);
  }, []);
  useEffect(() => { if (pregunta) (pregunta.peligro ? no : si).current?.focus(); }, [pregunta]);
  const terminar = (valor) => { pregunta?.resolver(valor); setPregunta(null); };
  const p = pregunta || {};
  return (
    <Modal abierto={Boolean(pregunta)} alCerrar={() => terminar(false)} className="modal modal-confirmar" etiqueta="tc-confirmar-titulo" aria-describedby="tc-confirmar-texto">
      <div className="modal-contenido">
        <h2 id="tc-confirmar-titulo">{p.titulo || "¿Confirmas?"}</h2>
        <p id="tc-confirmar-texto" className="modal-sub">{p.mensaje}</p>
        <div className="modal-acciones">
          <button ref={si} type="button" className={"btn btn-primary" + (p.peligro ? " btn-peligro-solido" : "")} onClick={() => terminar(true)}>{p.aceptar || "Confirmar"}</button>
          <button ref={no} type="button" className="btn btn-outline" onClick={() => terminar(false)}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}
