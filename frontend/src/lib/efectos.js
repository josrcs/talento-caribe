/* ==========================================================
   efectos.js - Comportamientos visuales (todas las páginas)
   1. Revelado al hacer scroll ([data-revelar] y [data-escalonar]) y números
      que cuentan desde cero ([data-contar]). Los elementos que React pinta
      después (tarjetas, resultados de filtros) se detectan solos.
   2. Portal y panel: los indicadores (.kpi dd, .tarjeta-dato dd) cuentan
      cada vez que aparecen.
   Solo agrega clases y estilos de animación: el contenido lo pinta React.
   ========================================================== */
const reducirMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
const raiz = document.documentElement;

// Transición entre páginas (efectos.css): si el navegador la omite (pestaña oculta, carga lenta) no es un error
for (const evento of ["pageswap", "pagereveal"]) addEventListener(evento, (e) => { const vt = e.viewTransition; if (vt) for (const p of [vt.ready, vt.finished, vt.updateCallbackDone]) p?.catch(() => {}); });

function contar(el, retraso = 0) {
  if (el.dataset.contado || el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
  el.dataset.contado = "1";
  const partes = el.textContent.trim().match(/^(\D{0,3})(\d+(?:[.,]\d+)?)(\D{0,3})$/);
  if (!partes || reducirMovimiento) return;
  const [, antes, numero, despues] = partes, nodo = el.firstChild;
  const decimales = (numero.split(/[.,]/)[1] || "").length, separador = numero.includes(",") ? "," : ".";
  const meta = parseFloat(numero.replace(",", "."));
  const escribir = (valor) => { if (nodo.isConnected) nodo.nodeValue = antes + valor.toFixed(decimales).replace(".", separador) + despues; };
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
  const espera = orden * (el.dataset.revelar === "rapido" ? 45 : 95);
  el.style.setProperty("--retraso", `${espera}ms`);
  el.classList.add("revelado");
  el.querySelectorAll("[data-contar]").forEach((n) => contar(n, espera + 250));
}

export function iniciarEfectos() {
  const vigia = "IntersectionObserver" in window && !reducirMovimiento
    ? new IntersectionObserver((entradas) => {
        entradas.filter((e) => e.isIntersecting).forEach((e, i) => { vigia.unobserve(e.target); revelar(e.target, i); });
      }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" })
    : null;
  // Si la intro está en pantalla, se espera a que suba el telón: lo que ya se ve se anima al descubrirse
  let esperarIntro = raiz.classList.contains("con-intro") && !raiz.classList.contains("intro-hecha");
  function observar(zona = document) {
    if (esperarIntro) return;
    zona.querySelectorAll("[data-escalonar]").forEach((grupo) => [...grupo.children].forEach((hijo) => {
      if (!hijo.hasAttribute("data-revelar")) hijo.dataset.revelar = grupo.dataset.escalonar;
    }));
    zona.querySelectorAll("[data-revelar]:not(.revelado)").forEach((el) => (vigia ? vigia.observe(el) : revelar(el)));
  }
  const empezar = () => { if (!esperarIntro) return; esperarIntro = false; observar(); };
  if (esperarIntro) {
    addEventListener("tc:intro-sale", () => setTimeout(empezar, 350), { once: true });
    setTimeout(empezar, 7000); // por si la intro no llegara a avisar
  }

  // Lo que React agrega después también se revela; los indicadores del portal y el panel cuentan al aparecer
  let pendiente = false;
  const revisar = () => {
    pendiente = false;
    observar();
    if (reducirMovimiento) return;
    document.querySelectorAll(".app-main .kpi dd, .app-main .tarjeta-dato dd, .panel-main .kpi dd, .panel-main .tarjeta-dato dd").forEach((dd) => { if (dd.offsetParent) contar(dd, 150); });
  };
  new MutationObserver(() => { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  revisar();
}
