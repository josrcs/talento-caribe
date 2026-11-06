/* Pie - Pie de página de las páginas públicas.
   `inicio` es la dirección del inicio vista desde la página actual ("" en el inicio, "index.html" en las demás). */
export default function Pie({ inicio = "index.html" }) {
  const seccion = (id) => `${inicio}#${id}`;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <a href="index.html" className="footer-logo">
            <img src="assets/img/logo-talento-caribe-claro-sm.png" alt="Talento Caribe" width="152" height="130" loading="lazy" />
          </a>
          <p>Tu talento no tiene fronteras.</p>
        </div>
        <nav aria-label="Pie de página">
          <p className="footer-titulo">Aprende</p>
          <ul>
            <li><a href="cursos.html">Catálogo de cursos</a></li>
            <li><a href={seccion("rutas")}>Rutas de aprendizaje</a></li>
            <li><a href={seccion("metodo")}>Cómo se aprende</a></li>
          </ul>
        </nav>
        <nav aria-label="Talento Caribe">
          <p className="footer-titulo">Talento Caribe</p>
          <ul>
            <li><a href={seccion("nosotros")}>Nosotros</a></li>
            <li><a href={seccion("mentores")}>Mentores</a></li>
            <li><a href={seccion("preguntas")}>Preguntas frecuentes</a></li>
          </ul>
        </nav>
        <div>
          <p className="footer-titulo">Contacto</p>
          <ul>
            <li><a href="mailto:contacto@talentocaribe.co">contacto@talentocaribe.co</a></li>
            <li><a href="admin/login.html">Ingresar a la plataforma</a></li>
          </ul>
        </div>
        <p className="copy">© 2026 Talento Caribe. Barranquilla, Colombia.</p>
      </div>
    </footer>
  );
}
