/* ==========================================================
   Talento Caribe - Efectos visuales (se carga en todas las páginas)
   1. Fondo ambiental con manchas de color (detrás de todo).
   2. Barra superior: más vidrio al bajar, se esconde al bajar y vuelve
      al subir; una línea muestra cuánto se ha leído de la página.
   3. Revelado al hacer scroll ([data-revelar] y [data-escalonar]) y
      números que cuentan desde cero ([data-contar]).
   4. Portal y panel: los indicadores cuentan cada vez que aparecen.
   5. Solo en inicio (index.html): efecto que sigue el cursor (aura y
      estela DETRÁS del contenido), reflejo de luz y giro 3D en las
      tarjetas, logo del hero que se inclina con el puntero, botones
      que se acercan al cursor y destello al hacer clic o tocar.
      Ninguno tapa textos ni bloquea clics.
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

  // 2. Barra de navegación de las páginas públicas
  const header = document.querySelector('.site-header');
  if (header) {
    const lectura = document.createElement('span');
    lectura.className = 'progreso-lectura';
    lectura.setAttribute('aria-hidden', 'true');
    header.append(lectura);
    let anterior = scrollY, pendiente = false;
    const marcar = () => {
      pendiente = false;
      const y = scrollY, recorrido = raiz.scrollHeight - innerHeight, avance = y - anterior;
      header.classList.toggle('con-scroll', y > 12);
      raiz.classList.toggle('desplazado', y > 40);
      // Se esconde al bajar para dar espacio al contenido; con el menú abierto o cerca del inicio, siempre visible
      if (y < 200 || header.querySelector('.nav-toggle[aria-expanded="true"]')) header.classList.remove('oculta');
      else if (Math.abs(avance) > 8) header.classList.toggle('oculta', avance > 0);
      if (Math.abs(avance) > 8) anterior = y;
      lectura.style.transform = `scaleX(${recorrido > 0 ? Math.min(1, y / recorrido) : 0})`;
    };
    marcar();
    addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(marcar); } }, { passive: true });
  }

  // 3. Revelado al hacer scroll. Los elementos que entran juntos en pantalla se escalonan
  //    (uno tras otro); los que entran solos aparecen sin espera. Los hijos de [data-escalonar]
  //    heredan el tipo de revelado del grupo.
  function contar(el, retraso = 0) {
    if (el.dataset.contado || el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
    el.dataset.contado = '1';
    const partes = el.textContent.trim().match(/^(\D{0,3})(\d+(?:[.,]\d+)?)(\D{0,3})$/);
    if (!partes || reducirMovimiento) return;
    const [, antes, numero, despues] = partes, nodo = el.firstChild;
    const decimales = (numero.split(/[.,]/)[1] || '').length, separador = numero.includes(',') ? ',' : '.';
    const meta = parseFloat(numero.replace(',', '.'));
    // Se escribe en el mismo nodo de texto: así no se dispara el MutationObserver del punto 4
    const escribir = (valor) => { nodo.nodeValue = antes + valor.toFixed(decimales).replace('.', separador) + despues; };
    escribir(0);
    setTimeout(() => {
      const inicio = performance.now();
      const paso = (ahora) => {
        const t = Math.min(1, (ahora - inicio) / 1400);
        escribir(meta * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }, retraso);
  }
  function revelar(el, orden = 0) {
    const espera = orden * (el.dataset.revelar === 'rapido' ? 45 : 95);
    el.style.setProperty('--retraso', `${espera}ms`);
    el.classList.add('revelado');
    el.querySelectorAll('[data-contar]').forEach(n => contar(n, espera + 250));
  }
  const vigia = 'IntersectionObserver' in window && !reducirMovimiento
    ? new IntersectionObserver(entradas => {
        entradas.filter(e => e.isIntersecting).forEach((e, i) => { vigia.unobserve(e.target); revelar(e.target, i); });
      }, { threshold: .14, rootMargin: '0px 0px -7% 0px' })
    : null;
  // Si la intro está en pantalla, se espera a que suba el telón: lo que ya se ve se anima al descubrirse
  let esperarIntro = raiz.classList.contains('con-intro') && !raiz.classList.contains('intro-hecha');
  function observar(zona = document) {
    if (esperarIntro) return;
    zona.querySelectorAll('[data-escalonar]').forEach(grupo => [...grupo.children].forEach(hijo => {
      if (!hijo.hasAttribute('data-revelar')) hijo.dataset.revelar = grupo.dataset.escalonar;
    }));
    zona.querySelectorAll('[data-revelar]:not(.revelado)').forEach(el => (vigia ? vigia.observe(el) : revelar(el)));
  }
  const empezar = () => { if (!esperarIntro) return; esperarIntro = false; observar(); };
  if (esperarIntro) {
    addEventListener('tc:intro-sale', () => setTimeout(empezar, 350), { once: true });
    setTimeout(empezar, 7000); // por si la intro no llegara a avisar
  } else observar();
  window.TCRevelar = observar; // para las tarjetas que el JS pinta después (inicio y catálogo)

  // 4. Portal y panel: los indicadores (.kpi, .tarjeta-dato) cuentan desde cero al aparecer.
  //    Cada sección del portal se pinta de nuevo al abrirla; en el panel se muestra y se oculta.
  const zona = document.querySelector('.app-main, .panel-main');
  if (zona && !reducirMovimiento) {
    let pendiente = false;
    const revisar = () => {
      pendiente = false;
      zona.querySelectorAll('.kpi dd, .tarjeta-dato dd').forEach(dd => { if (dd.offsetParent) contar(dd, 150); });
    };
    new MutationObserver(() => { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } })
      .observe(zona, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    revisar();
  }

  // 5. Efectos que siguen al puntero: solo en la página de inicio. En catálogo, registro, login,
  //    portal y panel la interfaz queda limpia para trabajar. Con mouse: aura, estela, reflejo y
  //    giro de tarjetas, logo que se inclina y botones magnéticos. En pantallas táctiles: solo el
  //    destello al tocar.
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
    const claro = raiz.dataset.tema === 'claro';
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

  // Escena del logo del hero: se inclina hacia el puntero con un pequeño retraso (interpolación)
  const escena = document.querySelector('.hero-escena');
  const incl = { x: 0, y: 0, ax: 0, ay: 0, moviendo: false };
  const introEnCurso = () => raiz.classList.contains('con-intro') && !raiz.classList.contains('intro-aterrizo');
  function inclinarEscena() {
    incl.ax += (incl.x - incl.ax) * .07; incl.ay += (incl.y - incl.ay) * .07;
    escena.style.setProperty('--incl-x', incl.ax.toFixed(3));
    escena.style.setProperty('--incl-y', incl.ay.toFixed(3));
    if (Math.abs(incl.x - incl.ax) + Math.abs(incl.y - incl.ay) > .002) requestAnimationFrame(inclinarEscena);
    else incl.moviendo = false;
  }

  // Tarjetas de cursos destacados (data-tilt): giran en 3D según dónde esté el mouse
  let girada = null;
  const soltarTarjeta = () => { if (!girada) return; girada.style.transform = ''; girada.classList.remove('inclinada'); girada = null; };
  function girarTarjeta(tarjeta, e) {
    if (tarjeta !== girada) soltarTarjeta();
    if (!tarjeta) return;
    girada = tarjeta; tarjeta.classList.add('inclinada');
    const r = tarjeta.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width - .5, fy = (e.clientY - r.top) / r.height - .5;
    tarjeta.style.transform = `perspective(900px) rotateX(${(-fy * 8).toFixed(2)}deg) rotateY(${(fx * 10).toFixed(2)}deg) translateY(-6px)`;
  }

  const tarjetas = '.pilar, .curso-card, .chat, .mentor, .pasos li, .section-alt .form, .cifras-grid, .login-card, .portal-card, .activity-card, .tarjeta-dato, .portal-welcome, .my-course, .tarjeta, .kpi, .act-card, .logro, .bienvenida, .department-card, .ia-chat';

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

    if (!mouseFino) return;
    girarTarjeta(e.target.closest?.('[data-tilt].revelado'), e);
    if (escena && !introEnCurso()) {
      const r = escena.getBoundingClientRect();
      if (r.bottom < 0) return; // el hero ya no se ve
      incl.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      incl.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      if (!incl.moviendo) { incl.moviendo = true; requestAnimationFrame(inclinarEscena); }
    }
  }, { passive: true });
  // Al hacer clic o tocar la pantalla: un pequeño destello de luces
  document.addEventListener('pointerdown', e => {
    for (let i = 0; i < 14; i++) { const ang = (i / 14) * Math.PI * 2; particulas.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * 1.6, vy: Math.sin(ang) * 1.6, r: 2.5, vida: 1, paso: .03, c: COLORES[i % COLORES.length] }); }
    if (!animando) { animando = true; requestAnimationFrame(cuadro); }
  });
  raiz.addEventListener('pointerleave', () => { raiz.classList.remove('cursor-activo'); soltarTarjeta(); });

  // Botones del hero "magnéticos": se desplazan un poco hacia el cursor mientras está encima
  if (mouseFino) document.querySelectorAll('.hero-acciones .btn').forEach(boton => {
    boton.addEventListener('pointermove', e => {
      const r = boton.getBoundingClientRect();
      boton.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px`;
    });
    boton.addEventListener('pointerleave', () => { boton.style.translate = ''; });
  });
})();
