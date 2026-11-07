/* Modal.jsx - Ventana de diálogo (<dialog>) controlada por React.
   <Modal abierto={x} alCerrar={() => setX(false)} className="modal" etiqueta="id-del-titulo">...</Modal>
   Esc y el clic en el fondo cierran. */
import { useEffect, useRef } from "react";

export default function Modal({ abierto, alCerrar, className = "modal", etiqueta, children, ...resto }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog ref={ref} className={className} aria-labelledby={etiqueta}
      onCancel={(e) => { e.preventDefault(); alCerrar?.(); }}
      onClick={(e) => { if (e.target === ref.current) alCerrar?.(); }} {...resto}>
      {abierto ? children : null}
    </dialog>
  );
}
