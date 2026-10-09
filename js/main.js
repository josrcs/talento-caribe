/* main.js - Página de inicio y catálogo: menú, cursos destacados, cifras, cinta de temas
   y menú que marca la sección que se está viendo. */
(() => {
  const cursos = window.TALENTO_CARIBE_CURSOS || [];
  const esc = window.TCUtil.esc; // los cursos los edita el equipo: se escapan para que ningún título pueda inyectar HTML
  const menu = document.querySelector('.nav-toggle');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  // Cursos destacados: mientras llegan los datos se ven las tarjetas esqueleto del HTML
  const destacados = document.querySelector('#cursos-destacados');
  if (destacados) (window.TCListo || Promise.resolve()).then(() => {
    destacados.innerHTML = cursos.filter(c => c.fase === 'Lanzamiento').slice(0, 3).map(c => `
      <article class="curso-card" data-tilt data-revelar="escala">
        <div class="curso-etiquetas"><span class="tag">${esc(c.area)}</span><span class="tag tag-lanzamiento">Inscripciones abiertas</span></div>
        <h3>${esc(c.titulo)}</h3><p>${esc(c.descripcion)}</p>
        <div class="curso-card-pie"><span class="curso-duracion">${Number(c.duracion) || ""} semanas · ${esc(c.modalidad)}</span><a class="btn-texto-plano" href="cursos.html">Ver detalles →</a></div>
      </article>`).join('');
    destacados.removeAttribute('aria-busy');
    window.TCRevelar?.(destacados);
  });

  // Cifras del inicio: salen del catálogo y de los mentores de la página (si cambian, se actualizan solas)
  const cifra = (nombre, valor) => { const el = document.querySelector(`[data-cifra="${nombre}"]`); if (el && valor) el.textContent = valor; };
  cifra('cursos', cursos.length);
  cifra('modulos', cursos.reduce((total, c) => total + (c.modulos || []).length, 0));
  cifra('mentores', document.querySelectorAll('.mentor').length);

  // Cinta de temas: se duplica la lista para que el movimiento no tenga cortes (la copia no la leen los lectores de pantalla)
  const cinta = document.querySelector('.cinta-lista');
  if (cinta) {
    const copia = cinta.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    cinta.after(copia);
  }

  if (!('IntersectionObserver' in window)) return;

  // Menú del inicio: subraya el enlace de la sección que está en el centro de la pantalla
  const enlaces = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (enlaces.length) {
    const espia = new IntersectionObserver(entradas => entradas.forEach(e => {
      if (e.isIntersecting) enlaces.forEach(a => a.classList.toggle('en-vista', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach(s => espia.observe(s));
  }

  // El hero detiene sus animaciones cuando sale de la pantalla (ahorra batería)
  const hero = document.querySelector('.hero');
  if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('hero-fuera', !e.isIntersecting)).observe(hero);
})();
