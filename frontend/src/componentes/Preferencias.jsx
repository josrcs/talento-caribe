/* Preferencias.jsx - Botones para cambiar el tema (claro / oscuro) y el idioma (ES / EN) */
import { cambiarIdioma, cambiarTema, idioma, t } from "../i18n/idioma.js";
import { useTema } from "./Logo.jsx";

const SOL = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const LUNA = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;

export default function Preferencias({ flotante = false }) {
  const claro = useTema() === "claro";
  const etiquetaTema = claro ? t("Cambiar a modo oscuro") : t("Cambiar a modo claro");
  const otro = idioma === "en" ? "es" : "en";
  const etiquetaIdioma = idioma === "en" ? "Ver en español" : "View in English";
  return (
    <div className={"prefs" + (flotante ? " prefs-flotante" : "")}>
      <button type="button" className="pref-btn" data-pref="tema" aria-label={etiquetaTema} title={etiquetaTema} onClick={(e) => cambiarTema(e.currentTarget)}>
        {claro ? LUNA : SOL}
      </button>
      <button type="button" className="pref-btn pref-idioma" data-pref="idioma" lang={otro} aria-label={etiquetaIdioma} title={etiquetaIdioma} data-no-traducir onClick={cambiarIdioma}>
        <span className="pref-idioma-actual">{idioma.toUpperCase()}</span><span className="pref-idioma-otro">{otro.toUpperCase()}</span>
      </button>
    </div>
  );
}
