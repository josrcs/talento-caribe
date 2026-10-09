/* ==========================================================
   Talento Caribe - Efectos visuales (se carga en todas las páginas)
   - Fondo ambiental con manchas de color (detrás de todo).
   - Solo en inicio (index.html): efecto que sigue el cursor (aura y estela
     DETRÁS del contenido), reflejo de luz en las tarjetas de vidrio y destello
     al hacer clic o tocar. Ninguno tapa textos ni bloquea clics.
   - Barra de navegación que se oscurece al hacer scroll.
   - Revelado suave de los títulos de sección.
   ========================================================== */
(() => {
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouseFino = matchMedia('(pointer: fine)').matches;
  const raiz = document.documentElement;

  // 1. Fondo ambiental
  const fondo = document.createElement('div');
  fondo.className = 'fondo-caribe';
  fondo.setAttribute('aria-hidden', 'true');
  fondo.innerHTML = '<span></span><span></span><span></span><span></span>';
  document.body.prepend(fondo);

  // 2. Barra de navegación con más vidrio al bajar
  const header = document.querySelector('.site-header');
  if (header) {
    const marcar = () => header.classList.toggle('con-scroll', window.scrollY > 12);
    marcar();
    window.addEventListener('scroll', marcar, { passive: true });
  }

  // 3. Revelado de títulos al hacer scroll
  if (!reducirMovimiento && 'IntersectionObserver' in window) {
    const titulos = document.querySelectorAll('.section h2:not([data-aos]), .section-intro');
    const obs = new IntersectionObserver(entradas => entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
    }), { threshold: .2 });
    titulos.forEach(el => { el.classList.add('revelar'); obs.observe(el); });
  }

  // 4. Efecto del cursor: aura de color + estela de luces (canvas). Todo va DETRÁS del
  //    contenido (z-index negativo) y con pointer-events: none: nunca tapa textos ni clics.
  //    Solo en la página de inicio: en catálogo, registro, login, portal y panel la interfaz
  //    queda limpia para trabajar. Con mouse: aura, estela, reflejo en tarjetas y destello al
  //    hacer clic. En pantallas táctiles: solo el destello al tocar.
  if (!document.body.classList.contains('page-home') || reducirMovimiento) return;

  const lienzo = document.createElement('canvas');
  lienzo.className = 'cursor-estela';
  lienzo.setAttribute('aria-hidden', 'true');
  let aura = null;
  if (mouseFino) {
    aura = document.createElement('div');
    aura.className = 'cursor-aura';
    aura.setAttribute('aria-hidden', 'true');
    aura.innerHTML = '<span></span><span></span>';
    document.body.append(aura);
  }
  document.body.append(lienzo);
  const ctx = lienzo.getContext('2d');
  let dpr = 1;
  const medir = () => { dpr = Math.min(devicePixelRatio || 1, 2); lienzo.width = innerWidth * dpr; lienzo.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  medir(); addEventListener('resize', medir, { passive: true });

  const COLORES = [[26, 176, 214], [125, 211, 252], [248, 172, 36], [15, 154, 128], [255, 255, 255]];
  const particulas = [];
  let x = innerWidth / 2, y = innerHeight / 2, px = x, py = y, ax = x, ay = y;
  let animando = false, ultimaTarjeta = null;

  function emitir(desdeX, desdeY, hastaX, hastaY) {
    const dist = Math.hypot(hastaX - desdeX, hastaY - desdeY);
    const n = Math.min(4, Math.ceil(dist / 14));
    for (let i = 0; i < n && particulas.length < 140; i++) {
      const t = Math.random(), c = COLORES[Math.floor(Math.random() * COLORES.length)];
      particulas.push({
        x: desdeX + (hastaX - desdeX) * t + (Math.random() - .5) * 8,
        y: desdeY + (hastaY - desdeY) * t + (Math.random() - .5) * 8,
        vx: (Math.random() - .5) * .5, vy: -.15 - Math.random() * .45,
        r: 2 + Math.random() * 5, vida: 1, paso: .012 + Math.random() * .014, c,
      });
    }
  }

  function cuadro() {
    ax += (x - ax) * .08; ay += (y - ay) * .08;
    if (aura) aura.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    // En oscuro las luces se suman ('lighter'); en claro se pintan normal para que se vean sobre blanco
    const claro = document.documentElement.dataset.tema === 'claro';
    ctx.globalCompositeOperation = claro ? 'source-over' : 'lighter';
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx; p.y += p.vy; p.vida -= p.paso;
      if (p.vida <= 0) { particulas.splice(i, 1); continue; }
      const radio = p.r * (0.6 + p.vida * 0.8), alfa = p.vida * (claro ? 0.42 : 0.55);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radio * 3);
      g.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${alfa})`);
      g.addColorStop(.35, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${alfa * .35})`);
      g.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, radio * 3, 0, Math.PI * 2); ctx.fill();
    }
    // Se detiene cuando no hay partículas y el aura alcanzó al puntero (ahorra batería)
    if (particulas.length || Math.abs(x - ax) + Math.abs(y - ay) > .5) requestAnimationFrame(cuadro);
    else animando = false;
  }

  const tarjetas = '.pilar, .curso-card, .chat, .mentor, .pasos li, .section-alt .form, .login-card, .portal-card, .activity-card, .tarjeta-dato, .portal-welcome, .my-course, .tarjeta, .kpi, .act-card, .logro, .bienvenida, .department-card, .ia-chat';

  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return; // al arrastrar el dedo se hace scroll: sin estela
    px = x; py = y; x = e.clientX; y = e.clientY;
    raiz.classList.add('cursor-activo');
    emitir(px, py, x, y);
    if (!animando) { animando = true; requestAnimationFrame(cuadro); }

    // Reflejo de luz dentro de la tarjeta de vidrio bajo el cursor
    const tarjeta = e.target.closest?.(tarjetas);
    if (ultimaTarjeta && ultimaTarjeta !== tarjeta) { ultimaTarjeta.style.removeProperty('--mx'); ultimaTarjeta.style.removeProperty('--my'); }
    ultimaTarjeta = tarjeta;
    if (tarjeta) {
      const r = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tarjeta.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
  }, { passive: true });
  // Al hacer clic o tocar la pantalla: un pequeño destello de luces
  document.addEventListener('pointerdown', e => {
    for (let i = 0; i < 14; i++) { const ang = (i / 14) * Math.PI * 2; particulas.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * 1.6, vy: Math.sin(ang) * 1.6, r: 2.5, vida: 1, paso: .03, c: COLORES[i % COLORES.length] }); }
    if (!animando) { animando = true; requestAnimationFrame(cuadro); }
  });
  document.documentElement.addEventListener('pointerleave', () => raiz.classList.remove('cursor-activo'));
})();
