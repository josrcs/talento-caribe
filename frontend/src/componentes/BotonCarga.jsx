/* BotonCarga.jsx - Botón con estado de carga (spinner) */
export default function BotonCarga({ cargando = false, children, className = "btn btn-primary", type = "submit", disabled, ...resto }) {
  return (
    <button type={type} className={className} disabled={cargando || disabled} {...resto}>
      <span className="btn-texto" hidden={cargando}>{children}</span>
      <span className="spinner" aria-hidden="true" hidden={!cargando}></span>
    </button>
  );
}
