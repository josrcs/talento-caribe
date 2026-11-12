/* Avisos.jsx - Mensajes breves (toasts). Se piden desde cualquier parte con toast("Guardado") (src/lib/utils.js). */
import { useEffect, useState } from "react";

export default function Avisos() {
  const [avisos, setAvisos] = useState([]);
  useEffect(() => {
    const nuevo = (e) => {
      const id = Date.now() + Math.random();
      setAvisos((lista) => [...lista, { id, ...e.detail, sale: false }]);
      setTimeout(() => setAvisos((lista) => lista.map((a) => (a.id === id ? { ...a, sale: true } : a))), 3600); // se desliza hacia afuera
      setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 4000);
    };
    addEventListener("tc:toast", nuevo);
    return () => removeEventListener("tc:toast", nuevo);
  }, []);
  return (
    <div id="toasts" className="toasts" aria-live="polite">
      {avisos.map((a) => <div key={a.id} className={`toast toast-${a.tipo}${a.sale ? " sale" : ""}`}>{a.mensaje}</div>)}
    </div>
  );
}
