(() => {
  const cursos = window.TALENTO_CARIBE_CURSOS || [];
  if (window.AOS && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) AOS.init({duration:650, once:true, offset:70});
  const menu = document.querySelector('.nav-toggle');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  const destacados = document.querySelector('#cursos-destacados');
  if (destacados) (window.TCListo || Promise.resolve()).then(() => {
    destacados.innerHTML = cursos.filter(c => c.fase === 'Lanzamiento').slice(0, 3).map(c => `
      <article class="curso-card" data-tilt>
        <div class="curso-etiquetas"><span class="tag">${c.area}</span><span class="tag tag-lanzamiento">Inscripciones abiertas</span></div>
        <h3>${c.titulo}</h3><p>${c.descripcion}</p>
        <div class="curso-card-pie"><span class="curso-duracion">${c.duracion} semanas · ${c.modalidad}</span><a class="btn-texto-plano" href="cursos.html">Ver detalles →</a></div>
      </article>`).join('');
    destacados.querySelectorAll('.curso-card').forEach(el => window.TCObservar?.(el));
  });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll('.section, .curso-card, .pilar, .pasos li, .mentor').forEach(el => observer.observe(el));
    window.TCObservar = el => observer.observe(el); // para tarjetas que llegan después desde la base de datos
  }

  // El efecto que sigue el cursor ahora vive en js/efectos.js (se carga en todas las páginas).
})();
