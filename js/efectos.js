/* ==========================================================
   Talento Caribe - Comportamientos visuales (se carga en todas las páginas)
   1. Barra superior: se esconde al bajar y vuelve al subir; una línea
      muestra cuánto se ha leído de la página.
   2. Revelado al hacer scroll ([data-revelar] y [data-escalonar]) y
      números que cuentan desde cero ([data-contar]).
   3. Portal y panel: los indicadores cuentan cada vez que aparecen.
   ========================================================== */
(() => {
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raiz = document.documentElement;

  // 1. Barra de navegación de las páginas públicas. En las páginas React la barra aparece después:
  //    el componente Encabezado llama a window.TCPrepararBarra(header) cuando ya está en pantalla.
  function prepararBarra(header) {
    if (!header || header.dataset.barraLista) return;
    header.dataset.barraLista = '1';
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
  prepararBarra(document.querySelector('.site-header'));
  window.TCPrepararBarra = prepararBarra;

  // 2. Revelado al hacer scroll. Los elementos que entran juntos en pantalla se escalonan
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
    // Se escribe en el mismo nodo de texto: así no se dispara el MutationObserver del punto 3
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

  // 3. Portal y panel: los indicadores (.kpi, .tarjeta-dato) cuentan desde cero al aparecer.
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
})();
