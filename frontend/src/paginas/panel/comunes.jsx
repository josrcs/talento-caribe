/* comunes.jsx - Utilidades del panel administrativo */
import { locale } from "../../i18n/idioma.js";
import { toast } from "../../lib/utils.js";

/* Ejecuta una escritura en la API y avisa si falla. Devuelve true si salió bien. */
export async function intentar(accion, setOcupado) {
  setOcupado?.(true);
  try { await accion(); return true; }
  catch (error) { toast(error.message || "No se pudo guardar. Inténtalo de nuevo.", "error"); return false; }
  finally { setOcupado?.(false); }
}
export const fechaDia = (item) => new Date(item.creado_en || item.creado).toLocaleDateString(locale, { day: "numeric", month: "short" });
export const fechaCorta = (f) => (f ? new Date(String(f).slice(0, 10) + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fechaLarga = (iso) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
export const fechaHora = (iso) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const formatoPesos = (valor) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
export const FilaVacia = ({ columnas, children }) => <tr><td colSpan={columnas}>{children}</td></tr>;
export const PillEstado = ({ estado }) => <span className={"pill " + (estado === "aprobada" ? "pill-ok" : estado === "rechazada" ? "pill-no" : "pill-pendiente")}>{estado}</span>;
/* Gráfica de barras de una sola serie: el valor siempre va escrito (no depende del color) */
export function Barras({ filas, className = "barras", ...resto }) {
  const mayor = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <div className={className} {...resto}>
      {filas.map((f, i) => (
        <div className="barra-fila" key={i} title={f.titulo}>
          <span className="barra-etiqueta" title={f.etiqueta}>{f.etiqueta}</span>
          <span className="barra-pista"><span className="barra-relleno" style={{ "--v": (f.valor / mayor).toFixed(3) }}></span></span>
          <span className="barra-valor">{f.valor}</span>
        </div>
      ))}
    </div>
  );
}
