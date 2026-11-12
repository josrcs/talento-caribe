/* ==========================================================
   Guia.jsx - Tour de bienvenida paso a paso (portal y panel)
   iniciarGuia(pasos, clave, forzar): pasos = [{ sel: "selector CSS", titulo, texto }].
   Se muestra una vez por clave (localStorage) salvo que se fuerce con el botón "Guía".
   ========================================================== */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const iniciarGuia = (pasos, clave = null, forzar = false) => dispatchEvent(new CustomEvent("tc:guia", { detail: { pasos, clave, forzar } }));

export default function Guia() {
  const [guia, setGuia] = useState(null); // { pasos, clave }
  const [i, setI] = useState(0);
  const [pos, setPos] = useState(null);
  const globo = useRef(null), siguiente = useRef(null);

  useEffect(() => {
    const abrir = (e) => {
      const { pasos, clave, forzar } = e.detail;
      const intentar = () => {
        // Si la animación de entrada sigue en pantalla, espera a que termine
        if (document.querySelector(".intro")) { setTimeout(intentar, 400); return; }
        try { if (!forzar && clave && localStorage.getItem(clave)) return; } catch { /* sin almacenamiento */ }
        const visibles = pasos.filter((p) => { const el = document.querySelector(p.sel); return el && el.getClientRects().length; });
        if (visibles.length) { setI(0); setGuia({ pasos: visibles, clave }); }
      };
      intentar();
    };
    addEventListener("tc:guia", abrir);
    return () => removeEventListener("tc:guia", abrir);
  }, []);

  const cerrar = useCallback(() => {
    try { if (guia?.clave) localStorage.setItem(guia.clave, "1"); } catch { /* */ }
    setGuia(null); setPos(null);
  }, [guia]);

  // Ubica el foco y el globo junto al elemento del paso actual
  const medir = useCallback(() => {
    if (!guia) return;
    const el = document.querySelector(guia.pasos[i].sel); if (!el) return;
    const r = el.getBoundingClientRect(), m = 8, gw = Math.min(340, innerWidth - 32), gh = globo.current?.offsetHeight || 200;
    let top = r.bottom + 16; if (top + gh > innerHeight - 12) top = Math.max(12, r.top - gh - 16);
    setPos({ foco: { top: r.top - m, left: r.left - m, width: r.width + m * 2, height: r.height + m * 2 }, globo: { top, left: Math.min(Math.max(16, r.left), innerWidth - gw - 16), width: gw } });
  }, [guia, i]);
  useLayoutEffect(() => {
    if (!guia) return;
    document.querySelector(guia.pasos[i].sel)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => { medir(); siguiente.current?.focus(); }, 320);
    return () => clearTimeout(t);
  }, [guia, i, medir]);
  useEffect(() => {
    if (!guia) return;
    const tecla = (e) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, guia.pasos.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    document.addEventListener("keydown", tecla);
    addEventListener("resize", medir, { passive: true });
    return () => { document.removeEventListener("keydown", tecla); removeEventListener("resize", medir); };
  }, [guia, cerrar, medir]);

  if (!guia) return null;
  const paso = guia.pasos[i], ultimo = i === guia.pasos.length - 1;
  return (
    <div className="guia-capa">
      <div className="guia-foco" aria-hidden="true" style={pos?.foco}></div>
      <div ref={globo} className="guia-globo cambia" key={i} role="dialog" aria-modal="true" aria-labelledby="guia-titulo" style={pos?.globo || { visibility: "hidden" }}>
        <span className="guia-paso">{`Paso ${i + 1} de ${guia.pasos.length}`}</span>
        <h2 id="guia-titulo">{paso.titulo}</h2>
        <p>{paso.texto}</p>
        <div className="guia-puntos" aria-hidden="true">{guia.pasos.map((_, j) => <i key={j} className={j === i ? "on" : ""}></i>)}</div>
        <div className="guia-botones">
          <button type="button" className="btn-texto-plano" onClick={cerrar}>Saltar guía</button>
          <span>
            <button type="button" className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => setI(i - 1)}>Atrás</button>{" "}
            <button ref={siguiente} type="button" className="btn btn-primary btn-sm" onClick={() => (ultimo ? cerrar() : setI(i + 1))}>{ultimo ? "¡Listo!" : "Siguiente"}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
