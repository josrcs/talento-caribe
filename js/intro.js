/* ==========================================================
   intro.js - Animación de entrada: amanecer en el Caribe
   Se carga en el <head> (sin defer) de inicio, portal y panel.
   Se muestra la primera vez de cada sesión del navegador; para
   verla otra vez (por ejemplo al presentar el proyecto): index.html?intro
     1. El cielo aclara y el horizonte se dibuja desde el centro (0 – 1 s)
     2. El sol sale del mar y su luz se refleja en el agua      (0.3 – 1.8 s)
     3. El emblema aparece desde su propio sol y lo cruza un brillo (0.75 – 2.4 s)
     4. "TALENTO" sube letra por letra y "CARIBE" se cierra     (1.2 – 2.5 s)
     5. Lema y barra de carga, que espera a que la página cargue
     6. Salida: el telón sube como una ola y el emblema vuela hasta el
        logo del hero (o hasta el de la barra superior en portal y panel)
   Se salta con clic, rueda del mouse, Enter, Espacio o Esc.
   Respeta "reducir movimiento" (no se muestra).
   ========================================================== */
(() => {
  const raiz = document.documentElement;
  let mostrar = false;
  try {
    const pedida = new URLSearchParams(location.search).has("intro");
    mostrar = !matchMedia("(prefers-reduced-motion: reduce)").matches && (pedida || !sessionStorage.getItem("tc-intro"));
    if (mostrar) sessionStorage.setItem("tc-intro", "1");
  } catch { mostrar = false; }
  if (!mostrar) return;

  // Cubre la página desde el primer cuadro (ver html.intro-cubre en efectos.css)
  raiz.classList.add("con-intro", "intro-cubre");
  const base = (document.currentScript?.src || "").replace(/js\/intro\.js.*$/, "");
  const emblema = `${base}assets/img/${raiz.dataset.tema === "claro" ? "logo-emblema-hd-color.png" : "logo-emblema-hd.png"}`;
  const precarga = new Image(); precarga.src = emblema; // empieza a descargar antes de que exista el <body>
  const t = (x) => window.TCi18n?.t(x) || x;
  const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const DURACION_MINIMA = 2600;

  // Cada letra va dentro de una "ventana" (overflow: hidden) para que suba desde abajo
  const letras = (palabra) => [...palabra].map((l, i) => `<span class="intro-letra"><span style="--i:${i}">${l}</span></span>`).join("");
  // Ola: una curva que se repite dos veces para poder moverla en bucle sin cortes
  const ola = (alto) => `<svg viewBox="0 0 2880 ${alto}" preserveAspectRatio="none" aria-hidden="true"><path d="M0 ${alto * .45} C 360 ${alto * .05}, 720 ${alto * .85}, 1440 ${alto * .45} S 2520 ${alto * .05}, 2880 ${alto * .45} V ${alto} H 0 Z"/></svg>`;
  // Posiciones "aleatorias" pero fijas: la animación se ve igual en cada visita
  const estrellas = Array.from({ length: 34 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--y:${(i * 53) % 78}%;--d:${((i * 7) % 10) / 4}s;--t:${1 + (i % 3) * .5}px"></i>`).join("");
  // Destellos del sol en el agua: angostos junto al horizonte y más anchos hacia quien mira
  const reflejos = Array.from({ length: 10 }, (_, i) => `<i style="--i:${i};--w:${8 + i * 4.5 + ((i * 29) % 7)}%;--x:${((i * 17) % 9) - 4}%"></i>`).join("");

  document.addEventListener("DOMContentLoaded", () => {
    const intro = document.createElement("div");
    intro.className = "intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
      <div class="intro-telon">
        <div class="intro-cielo"><div class="intro-estrellas">${estrellas}</div><div class="intro-sol"></div></div>
        <div class="intro-mar"><div class="intro-reflejo">${reflejos}</div></div>
        <div class="intro-horizonte"></div>
        <div class="intro-textos">
          <div class="intro-marca" data-no-traducir>
            <span class="intro-talento">${letras("TALENTO")}</span>
            <span class="intro-caribe">CARIBE</span>
          </div>
          <p class="intro-lema">${t("Tu talento no tiene fronteras")}</p>
          <div class="intro-progreso"><span></span></div>
        </div>
        <div class="intro-grano"></div>
        <div class="intro-borde">${ola(120)}</div>
      </div>
      <div class="intro-emblema"><img src="${emblema}" alt="" width="672" height="504"><span class="intro-brillo"></span></div>
      <button type="button" class="intro-saltar">${t("Saltar animación")} <kbd>Esc</kbd></button>`;
    document.body.prepend(intro);
    raiz.classList.remove("intro-cubre");

    const img = intro.querySelector(".intro-emblema img");
    // Arranca cuando el emblema está listo para pintarse (máximo 0.9 s de espera)
    const activa = Promise.race([img.decode().catch(() => {}), espera(900)]).then(() => intro.classList.add("intro-activa"));

    let terminado = false;
    function salir() {
      if (terminado) return; terminado = true;
      document.removeEventListener("keydown", tecla);
      removeEventListener("wheel", rueda);
      intro.classList.add("intro-sale");
      raiz.classList.add("intro-hecha"); // el hero empieza a animarse mientras sube el telón
      dispatchEvent(new Event("tc:intro-sale")); // efectos.js revela lo que queda a la vista
      volar(intro.querySelector(".intro-emblema")).then(() => {
        raiz.classList.add("intro-aterrizo");
        setTimeout(() => intro.remove(), 450);
      });
    }

    /* El emblema vuela hasta el logo de destino (técnica FLIP: se mide dónde está y
       dónde debe quedar, y se anima solo con transform). Si el destino no se ve en
       pantalla, el emblema simplemente se desvanece hacia arriba. */
    function volar(caja) {
      const destino = [document.querySelector("[data-intro-destino]"), document.querySelector(".brand img")]
        .find((el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight - 30 && r.bottom > 30; });
      const curva = "cubic-bezier(.7, 0, .2, 1)";
      if (!destino) return caja.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-6vh) scale(.85)" }], { duration: 700, easing: curva, fill: "forwards" }).finished;
      // data-intro-region: qué parte del logo de destino ocupa el emblema (x, y, ancho y alto en fracciones)
      const [rx, ry, rw] = (destino.dataset.introRegion || "0 0 1 1").split(" ").map(Number);
      const desde = caja.getBoundingClientRect(), hasta = destino.getBoundingClientRect();
      const x = hasta.left + hasta.width * rx - desde.left, y = hasta.top + hasta.height * ry - desde.top, escala = (hasta.width * rw) / desde.width;
      destino.classList.add("intro-espera");
      return caja.animate([{ transform: "none" }, { transform: `translate(${x}px, ${y}px) scale(${escala})` }], { duration: 1050, delay: 120, easing: curva, fill: "forwards" }).finished.then(() => {
        destino.classList.remove("intro-espera");
        destino.classList.add("intro-llega");
        caja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-out", fill: "forwards" });
        setTimeout(() => destino.classList.remove("intro-llega"), 700);
      });
    }

    // La barra se completa cuando la página terminó de cargar y la escena alcanzó a verse
    // completa (DURACION_MINIMA desde que arrancó). Si la carga tarda, se sale a los 5.6 s.
    const cargada = document.readyState === "complete" ? Promise.resolve() : new Promise((ok) => addEventListener("load", ok, { once: true }));
    Promise.race([Promise.all([cargada, activa.then(() => espera(DURACION_MINIMA))]), espera(5600)]).then(async () => {
      if (terminado) return;
      intro.classList.add("intro-lista");
      await espera(320);
      salir();
    });

    const tecla = (e) => { if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); salir(); } };
    const rueda = (e) => { e.preventDefault(); salir(); };
    intro.addEventListener("click", salir);
    intro.addEventListener("touchmove", (e) => { e.preventDefault(); salir(); }, { passive: false });
    document.addEventListener("keydown", tecla);
    addEventListener("wheel", rueda, { passive: false });
  });
})();
