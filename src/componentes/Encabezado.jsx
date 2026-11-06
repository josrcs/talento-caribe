/* Encabezado - Barra superior de las páginas públicas.
   - Menú desplegable en celular (botón con tres rayas).
   - Si `espiarSecciones` es true, subraya el enlace de la sección que está en pantalla (inicio).
   - Reserva un lugar para los botones de tema e idioma (los crea i18n.js).
   - efectos.js le agrega la línea de lectura y la esconde al bajar (TCPrepararBarra). */
import { useEffect, useRef, useState } from "react";

export default function Encabezado({ enlaces, acciones, espiarSecciones = false }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [enVista, setEnVista] = useState("");
  const barra = useRef(null);
  const lugarPreferencias = useRef(null);

  useEffect(() => {
    window.TCi18n?.montarControles(lugarPreferencias.current);
    window.TCPrepararBarra?.(barra.current);
  }, []);

  // Subraya el enlace de la sección que ocupa el centro de la pantalla
  useEffect(() => {
    if (!espiarSecciones || !("IntersectionObserver" in window)) return;
    const vigia = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => { if (e.isIntersecting) setEnVista(`#${e.target.id}`); }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main > section[id]").forEach((s) => vigia.observe(s));
    return () => vigia.disconnect();
  }, [espiarSecciones]);

  return (
    <header className="site-header" ref={barra}>
      <nav className="nav container" aria-label="Principal">
        <a href="index.html" className="brand">
          <img src="assets/img/logo-emblema.png" alt="" width="48" height="36" />
          <span>Talento Caribe</span>
        </a>
        <button
          className="nav-toggle" type="button" aria-controls="menu"
          aria-expanded={menuAbierto} aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuAbierto((v) => !v)}
        >
          <span className="nav-toggle-bar" />
        </button>
        <ul id="menu" className="nav-links" onClick={(e) => e.target.closest("a") && setMenuAbierto(false)}>
          {enlaces.map(({ href, texto, actual }) => (
            <li key={href}>
              <a href={href} aria-current={actual ? "page" : undefined} className={enVista === href ? "en-vista" : undefined}>{texto}</a>
            </li>
          ))}
          <li className="prefs-li" ref={lugarPreferencias} />
          <li className="nav-acciones">
            {acciones.map(({ href, texto, principal }) => (
              <a key={href} href={href} className={`btn ${principal ? "btn-primary" : "btn-outline"}`}>{texto}</a>
            ))}
          </li>
        </ul>
      </nav>
    </header>
  );
}
