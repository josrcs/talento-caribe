/* ==========================================================
   EncabezadoPublico.jsx - Barra superior de las páginas públicas
   - Menú plegable en celulares.
   - Se esconde al bajar y vuelve al subir; una línea muestra cuánto se ha leído.
   - En el inicio subraya el enlace de la sección que se está viendo.
   - Los botones de tema e idioma van antes del último elemento del menú.
   <EncabezadoPublico enlaces={[{ href: "#metodo", texto: "Cómo se aprende" }, ...]} ultimo={<li>...</li>} />
   ========================================================== */
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";
import Preferencias from "./Preferencias.jsx";
import { enlace } from "../lib/rutas.js";

export default function EncabezadoPublico({ enlaces = [], ultimo }) {
  const [abierto, setAbierto] = useState(false);
  const [enVista, setEnVista] = useState("");
  const header = useRef(null), lectura = useRef(null), menuAbierto = useRef(false);
  menuAbierto.current = abierto;

  useEffect(() => {
    const raiz = document.documentElement, h = header.current;
    let anterior = scrollY, pendiente = false;
    const marcar = () => {
      pendiente = false;
      const y = scrollY, recorrido = raiz.scrollHeight - innerHeight, avance = y - anterior;
      h.classList.toggle("con-scroll", y > 12);
      raiz.classList.toggle("desplazado", y > 40);
      // Se esconde al bajar para dar espacio al contenido; con el menú abierto o cerca del inicio, siempre visible
      if (y < 200 || menuAbierto.current) h.classList.remove("oculta");
      else if (Math.abs(avance) > 8) h.classList.toggle("oculta", avance > 0);
      if (Math.abs(avance) > 8) anterior = y;
      lectura.current.style.transform = `scaleX(${recorrido > 0 ? Math.min(1, y / recorrido) : 0})`;
    };
    marcar();
    const alDesplazar = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(marcar); } };
    addEventListener("scroll", alDesplazar, { passive: true });
    return () => removeEventListener("scroll", alDesplazar);
  }, []);

  // Menú del inicio: marca la sección que está en el centro de la pantalla
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const espia = new IntersectionObserver((entradas) => entradas.forEach((e) => { if (e.isIntersecting) setEnVista("#" + e.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => espia.observe(s));
    return () => espia.disconnect();
  }, []);

  // Al tocar un enlace del menú en el celular, el menú se cierra
  const alTocar = (e) => {
    if (e.target.closest("a")) setAbierto(false);
  };
  return (
    <header className="site-header" ref={header}>
      <nav className="nav container" aria-label="Principal">
        <a href={enlace("index.html")} className="brand">
          <Logo tipo="emblema" width="48" height="36" />
          <span>Talento Caribe</span>
        </a>
        <button className="nav-toggle" type="button" aria-expanded={abierto} aria-controls="menu" aria-label={abierto ? "Cerrar menú" : "Abrir menú"} onClick={() => setAbierto(!abierto)}>
          <span className="nav-toggle-bar"></span>
        </button>
        <ul id="menu" className="nav-links" onClick={alTocar}>
          {enlaces.map((x) => (
            <li key={x.href}>
              <a href={x.href} aria-current={x.actual ? "page" : undefined}
                className={[x.className, enVista && x.href === enVista ? "en-vista" : ""].filter(Boolean).join(" ") || undefined}>{x.texto}</a>
            </li>
          ))}
          <li className="prefs-li"><Preferencias /></li>
          {ultimo}
        </ul>
      </nav>
      <span className="progreso-lectura" aria-hidden="true" ref={lectura}></span>
    </header>
  );
}
