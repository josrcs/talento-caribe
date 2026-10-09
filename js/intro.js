/* ==========================================================
   intro.js - Animación de entrada de la plataforma
   Se carga en el <head> (sin defer) de inicio, portal y panel.
   Se muestra la primera vez de cada sesión del navegador:
     1. Cielo y sol que sale detrás del emblema     (0 – 0.9 s)
     2. Olas del mar que suben y se mecen           (0.1 – 1.5 s)
     3. Emblema con anillos que se dibujan          (0.3 – 1.4 s)
     4. "TALENTO CARIBE" letra por letra + destello (0.9 – 2.3 s)
     5. Lema y barra de carga                       (1.6 – 2.9 s)
     6. Salida: la escena sube como una ola         (3.0 – 4.0 s)
   Se puede saltar con clic, Enter o Esc. Respeta "reducir movimiento".
   ========================================================== */
(() => {
  const raiz = document.documentElement;
  let mostrar = false;
  try {
    mostrar = !matchMedia("(prefers-reduced-motion: reduce)").matches && !sessionStorage.getItem("tc-intro");
    if (mostrar) sessionStorage.setItem("tc-intro", "1");
  } catch { mostrar = false; }
  if (!mostrar) return;

  // Cubre la página desde el primer cuadro (ver html.intro-cubre en efectos.css)
  raiz.classList.add("con-intro", "intro-cubre");
  const base = (document.currentScript?.src || "").replace(/js\/intro\.js.*$/, "");
  const t = (x) => window.TCi18n?.t(x) || x;
  const letras = (palabra, desde) => [...palabra].map((l, i) => `<span style="--i:${desde + i}">${l}</span>`).join("");
  // Ola: una curva que se repite dos veces para poder moverla en bucle sin cortes
  const ola = (alto) => `<svg viewBox="0 0 2880 ${alto}" preserveAspectRatio="none" aria-hidden="true"><path d="M0 ${alto * .45} C 360 ${alto * .05}, 720 ${alto * .85}, 1440 ${alto * .45} S 2520 ${alto * .05}, 2880 ${alto * .45} V ${alto} H 0 Z"/></svg>`;
  const burbujas = Array.from({ length: 16 }, (_, i) => {
    const x = (i * 61) % 100, d = 3.5 + ((i * 7) % 5) * .6, r = 3 + (i % 4) * 2, delay = .4 + ((i * 3) % 10) * .18;
    return `<i style="--x:${x}%;--d:${d}s;--r:${r}px;--delay:${delay}s"></i>`;
  }).join("");

  document.addEventListener("DOMContentLoaded", () => {
    const intro = document.createElement("div");
    intro.className = "intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
      <div class="intro-escena">
        <div class="intro-cielo"></div>
        <div class="intro-burbujas">${burbujas}</div>
        <div class="intro-mar">
          <div class="intro-ola intro-ola-3">${ola(140)}</div>
          <div class="intro-ola intro-ola-2">${ola(120)}</div>
          <div class="intro-ola intro-ola-1">${ola(100)}</div>
        </div>
        <div class="intro-centro">
          <div class="intro-emblema">
            <div class="intro-sol"></div>
            <svg class="intro-anillo" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" pathLength="1"/><circle class="intro-anillo-2" cx="100" cy="100" r="82" pathLength="1"/></svg>
            <span class="intro-orbita"><span></span></span>
            <img src="${base}assets/img/logo-emblema.png" alt="" width="256" height="192">
          </div>
          <div class="intro-marca" data-no-traducir>
            <span class="intro-talento">${letras("TALENTO", 0)}</span>
            <span class="intro-caribe">${letras("CARIBE", 7)}</span>
          </div>
          <p class="intro-lema">${t("Tu talento no tiene fronteras")}</p>
          <div class="intro-barra"><span></span></div>
        </div>
      </div>
      <div class="intro-borde">${ola(120)}</div>
      <button type="button" class="intro-saltar">${t("Saltar animación")} <kbd>Esc</kbd></button>`;
    document.body.prepend(intro);
    raiz.classList.remove("intro-cubre");

    let terminado = false;
    const salir = () => {
      if (terminado) return; terminado = true;
      intro.classList.add("intro-sale");
      raiz.classList.add("intro-hecha"); // el hero empieza a animarse mientras sube la ola
      setTimeout(() => intro.remove(), 1150);
      document.removeEventListener("keydown", tecla);
    };
    const tecla = (e) => { if (["Escape", "Enter", " "].includes(e.key)) salir(); };
    setTimeout(salir, 3000);
    intro.addEventListener("click", salir);
    document.addEventListener("keydown", tecla);
  });
})();
