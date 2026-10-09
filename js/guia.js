/* guia.js - Tour de bienvenida paso a paso (didáctico).
   TCGuia.iniciar(pasos, claveLocalStorage, forzar)
   pasos: [{ sel: "selector CSS", titulo, texto }]. Se muestra una vez por clave. */
(() => {
  function iniciar(pasos, clave, forzar = false) {
    // Si la animación de entrada sigue en pantalla, espera a que termine
    if (document.querySelector(".intro")) { setTimeout(() => iniciar(pasos, clave, forzar), 400); return; }
    try { if (!forzar && clave && localStorage.getItem(clave)) return; } catch { /* sin almacenamiento */ }
    const visibles = pasos.filter((p) => { const el = document.querySelector(p.sel); return el && el.getClientRects().length; });
    if (!visibles.length || document.querySelector(".guia-capa")) return;
    let i = 0;
    const capa = document.createElement("div");
    capa.className = "guia-capa";
    capa.innerHTML = '<div class="guia-foco" aria-hidden="true"></div><div class="guia-globo" role="dialog" aria-modal="true" aria-labelledby="guia-titulo"><span class="guia-paso"></span><h2 id="guia-titulo"></h2><p></p><div class="guia-puntos" aria-hidden="true"></div><div class="guia-botones"><button type="button" class="btn-texto-plano" data-g="saltar">Saltar guía</button><span><button type="button" class="btn btn-outline btn-sm" data-g="atras">Atrás</button> <button type="button" class="btn btn-primary btn-sm" data-g="siguiente">Siguiente</button></span></div></div>';
    document.body.append(capa);
    const foco = capa.querySelector(".guia-foco"), globo = capa.querySelector(".guia-globo");

    function mostrar() {
      const p = visibles[i], el = document.querySelector(p.sel);
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => {
        const r = el.getBoundingClientRect(), m = 8;
        Object.assign(foco.style, { top: r.top - m + "px", left: r.left - m + "px", width: r.width + m * 2 + "px", height: r.height + m * 2 + "px" });
        globo.querySelector(".guia-paso").textContent = `Paso ${i + 1} de ${visibles.length}`;
        globo.querySelector("h2").textContent = p.titulo;
        globo.querySelector("p").textContent = p.texto;
        globo.querySelector(".guia-puntos").innerHTML = visibles.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("");
        globo.querySelector("[data-g=atras]").disabled = i === 0;
        globo.querySelector("[data-g=siguiente]").textContent = i === visibles.length - 1 ? "¡Listo!" : "Siguiente";
        const gw = Math.min(340, innerWidth - 32), gh = globo.offsetHeight || 200;
        let top = r.bottom + 16; if (top + gh > innerHeight - 12) top = Math.max(12, r.top - gh - 16);
        const left = Math.min(Math.max(16, r.left), innerWidth - gw - 16);
        Object.assign(globo.style, { top: top + "px", left: left + "px", width: gw + "px" });
        globo.classList.remove("cambia"); void globo.offsetWidth; globo.classList.add("cambia");
        globo.querySelector("[data-g=siguiente]").focus();
      }, 320);
    }
    function cerrar() { capa.remove(); try { if (clave) localStorage.setItem(clave, "1"); } catch { /* */ } document.removeEventListener("keydown", tecla); }
    function tecla(e) { if (e.key === "Escape") cerrar(); if (e.key === "ArrowRight" && i < visibles.length - 1) { i++; mostrar(); } if (e.key === "ArrowLeft" && i > 0) { i--; mostrar(); } }
    capa.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]"); if (!b) return;
      if (b.dataset.g === "saltar") cerrar();
      if (b.dataset.g === "atras" && i > 0) { i--; mostrar(); }
      if (b.dataset.g === "siguiente") { if (i < visibles.length - 1) { i++; mostrar(); } else cerrar(); }
    });
    document.addEventListener("keydown", tecla);
    addEventListener("resize", () => capa.isConnected && mostrar(), { passive: true });
    mostrar();
  }
  window.TCGuia = { iniciar };
})();
