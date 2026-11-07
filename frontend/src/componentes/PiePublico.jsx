/* PiePublico.jsx - Pie de página de las páginas públicas.
   completo: el del inicio (enlaces a sus secciones); si no, el corto del catálogo. */
import Logo from "./Logo.jsx";
import { enlace } from "../lib/rutas.js";

export default function PiePublico({ completo = false }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <a href={enlace("index.html")} className="footer-logo"><Logo tipo="completo-sm" alt="Talento Caribe" width="152" height="130" loading="lazy" /></a>
          <p>Tu talento no tiene fronteras.</p>
        </div>
        {completo ? (
          <>
            <nav aria-label="Pie de página">
              <p className="footer-titulo">Aprende</p>
              <ul>
                <li><a href="cursos.html">Catálogo de cursos</a></li>
                <li><a href="#rutas">Rutas de aprendizaje</a></li>
                <li><a href="#metodo">Cómo se aprende</a></li>
              </ul>
            </nav>
            <nav aria-label="Talento Caribe">
              <p className="footer-titulo">Talento Caribe</p>
              <ul>
                <li><a href="#nosotros">Nosotros</a></li>
                <li><a href="#mentores">Mentores</a></li>
                <li><a href="#preguntas">Preguntas frecuentes</a></li>
              </ul>
            </nav>
            <div>
              <p className="footer-titulo">Contacto</p>
              <ul>
                <li><a href="mailto:contacto@talentocaribe.co">contacto@talentocaribe.co</a></li>
                <li><a href="admin/login.html">Ingresar a la plataforma</a></li>
              </ul>
            </div>
          </>
        ) : (
          <nav aria-label="Pie de página">
            <ul>
              <li><a href={enlace("index.html")}>Inicio</a></li>
              <li><a href={enlace("index.html") + "#contacto"}>Contacto</a></li>
              <li><a href={enlace("admin/login.html")}>Ingresar</a></li>
            </ul>
          </nav>
        )}
        <p className="copy">&copy; 2026 Talento Caribe. Barranquilla, Colombia.</p>
      </div>
    </footer>
  );
}
