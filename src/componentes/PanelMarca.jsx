/* PanelMarca - Columna izquierda de las páginas de acceso (registro, recuperar contraseña, 404):
   logo, una frase y un detalle opcional (children). */
export default function PanelMarca({ eyebrow, titulo, texto, children }) {
  return (
    <section className="login-story" aria-label="Talento Caribe">
      <a href="index.html" className="login-logo">
        <img src="assets/img/logo-talento-caribe-claro-sm.png" alt="Talento Caribe — inicio" width="208" height="177" />
      </a>
      <div className="login-story-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{titulo}</h1>
        <p>{texto}</p>
      </div>
      {children || <p className="acceso-pie">Plataforma educativa gratuita · Barranquilla, Colombia</p>}
    </section>
  );
}
