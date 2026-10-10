/* ==========================================================
   i18n.js - Idioma (español / inglés) y tema (oscuro / claro)
   Se carga SIN defer en el <head>, después de i18n-en.js, para aplicar
   el tema y el idioma antes de pintar la página (sin parpadeos).

   Cómo traduce:
   1. Recorre los textos y atributos (placeholder, aria-label, title, alt)
      y los busca en el diccionario window.TC_EN (español -> inglés).
   2. Los números se normalizan como "#": "Vence en 3 días" usa la clave
      "Vence en # días" -> "Due in # days" y se vuelve a poner el 3.
   3. Un MutationObserver traduce también lo que el JS pinta después
      (tarjetas, toasts, modales...).
   4. Para frases con nombres se usa TCi18n.t("¡Hola, {nombre}!", { nombre }).
   El contenido escrito por personas (respuestas, mensajes del chat) se marca
   con data-no-traducir y nunca se toca.
   ========================================================== */
(() => {
  const raiz = document.documentElement;
  // Con JavaScript activo, los efectos de revelado pueden ocultar contenido para mostrarlo al hacer scroll (efectos.css)
  raiz.classList.add("js");
  // Transición entre páginas (efectos.css): si el navegador la omite (pestaña oculta, carga lenta) no es un error
  for (const evento of ["pageswap", "pagereveal"]) addEventListener(evento, (e) => e.viewTransition?.ready.catch(() => {}));
  const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

  /* ---------- Tema ---------- */
  const temaGuardado = leer("tc_tema");
  const tema = temaGuardado || (matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro");
  raiz.dataset.tema = tema;
  raiz.style.colorScheme = tema === "claro" ? "light" : "dark";

  /* ---------- Idioma ---------- */
  const idioma = leer("tc_idioma") === "en" ? "en" : "es";
  raiz.lang = idioma;
  const EN = window.TC_EN || {};
  const locale = idioma === "en" ? "en-US" : "es-CO";

  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const NUM = /\d+(?:[.,]\d+)?/g;
  function traducir(texto) {
    if (idioma !== "en" || !texto) return texto;
    const limpio = norm(texto);
    if (!limpio || !/[a-záéíóúñ¡¿]/i.test(limpio)) return texto;
    let fuera = EN[limpio];
    if (fuera === undefined) {
      const numeros = limpio.match(NUM);
      if (numeros) {
        const plantilla = EN[limpio.replace(NUM, "#")];
        if (plantilla !== undefined) { let i = 0; fuera = plantilla.replace(/#/g, () => numeros[i++] ?? "#"); }
      }
    }
    if (fuera === undefined) {
      for (const [re, rep] of (window.TC_EN_PATRONES || [])) {
        const m = limpio.match(re); if (!m) continue;
        const r = typeof rep === "function" ? rep(...m) : limpio.replace(re, rep);
        if (r) { fuera = r; break; }
      }
    }
    if (fuera === undefined && /[.!?:]\s/.test(limpio) && !traducir.dentro) {
      // Respaldo: texto compuesto por varias frases (p. ej. "Completa tus datos. correo@x.co")
      traducir.dentro = true;
      // Corta después de . ! ? : (sin "lookbehind", que Safari anterior a iOS 16.4 no entiende)
      const partes = limpio.replace(/([.!?:])\s+/g, "$1\u0000").split("\u0000");
      const nuevas = partes.map((p) => traducir(p));
      traducir.dentro = false;
      if (nuevas.some((n, i) => n !== partes[i])) fuera = nuevas.join(" ");
    }
    if (fuera === undefined) return texto;
    // Conserva los espacios de los extremos (importan entre etiquetas en línea)
    const inicio = texto.match(/^\s*/)[0], fin = texto.match(/\s*$/)[0];
    return inicio + fuera + fin;
  }
  /* t(): para textos con variables. t("¡Hola, {nombre}!", { nombre: "Sofía" }) */
  function t(es, vars = {}) {
    const base = idioma === "en" ? (EN[norm(es)] ?? es) : es;
    return base.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  }

  /* ---------- Logos según el tema (las versiones claras son para fondo oscuro) ---------- */
  const LOGOS = [["logo-talento-caribe-claro.png", "logo-talento-caribe.png"], ["logo-talento-caribe-claro-sm.png", "logo-talento-caribe-sm.png"], ["logo-emblema.png", "logo-emblema-color.png"], ["logo-emblema-hd.png", "logo-emblema-hd-color.png"]];
  function logo(img) {
    const src = img.getAttribute("src") || "";
    if (img.hasAttribute("data-logo-fijo")) return;
    for (const [oscuro, claro] of LOGOS) {
      if (raiz.dataset.tema === "claro" && src.endsWith(oscuro)) { img.setAttribute("src", src.slice(0, -oscuro.length) + claro); return; }
      if (raiz.dataset.tema !== "claro" && src.endsWith(claro)) { img.setAttribute("src", src.slice(0, -claro.length) + oscuro); return; }
    }
  }

  /* Palabras que cambian según dónde aparecen: window.TC_EN_CONTEXTO = [[selector, { "Dirección": "Steering" }], ...]
     (en los temas de un curso «Dirección» es la del robot, no una dirección postal) */
  function enContexto(el, texto) {
    const k = norm(texto);
    for (const [selector, dic] of window.TC_EN_CONTEXTO || []) if (dic[k] !== undefined && el.matches(selector)) return texto.replace(k, dic[k]);
    return null;
  }

  /* ---------- Recorrido del DOM ---------- */
  const ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];
  const omitir = (el) => el.closest?.("[data-no-traducir], script, style, textarea, code, pre");
  function procesar(nodo) {
    if (nodo.nodeType === 3) {
      if (idioma === "en" && nodo.parentElement && !omitir(nodo.parentElement)) {
        const nuevo = enContexto(nodo.parentElement, nodo.nodeValue) ?? traducir(nodo.nodeValue); if (nuevo !== nodo.nodeValue) nodo.nodeValue = nuevo;
      }
      return;
    }
    if (nodo.nodeType !== 1) return;
    const lista = [nodo, ...nodo.querySelectorAll("*")];
    for (const el of lista) {
      if (el.tagName === "IMG") logo(el);
      if (idioma !== "en" || el.closest("[data-no-traducir]")) continue;
      for (const a of ATRIBUTOS) { const v = el.getAttribute(a); if (v) { const n = traducir(v); if (n !== v) el.setAttribute(a, n); } }
    }
    if (idioma !== "en") return;
    const caminante = document.createTreeWalker(nodo, NodeFilter.SHOW_TEXT);
    let tx; while ((tx = caminante.nextNode())) procesar(tx);
  }

  if (idioma === "en") {
    // Oculta el cuerpo hasta traducir el contenido inicial (evita ver el español un instante)
    const estilo = document.createElement("style");
    estilo.textContent = "html.i18n-pendiente body{visibility:hidden}";
    document.head.append(estilo);
    raiz.classList.add("i18n-pendiente");
    setTimeout(() => raiz.classList.remove("i18n-pendiente"), 2000);
  }
  const observador = new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === "characterData") procesar(c.target);
      else if (c.type === "attributes") { if (c.target.tagName === "IMG" && c.attributeName === "src") logo(c.target); else if (idioma === "en" && !omitir(c.target)) { const v = c.target.getAttribute(c.attributeName); const n = v && traducir(v); if (n && n !== v) c.target.setAttribute(c.attributeName, n); } }
      else c.addedNodes.forEach(procesar);
    }
  });
  observador.observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATRIBUTOS, "src"] });
  document.addEventListener("DOMContentLoaded", () => {
    if (idioma === "en") document.title = traducir(document.title);
    const meta = document.querySelector('meta[name="description"]'); if (meta && idioma === "en") meta.content = traducir(meta.content);
    procesar(document.body);
    raiz.classList.remove("i18n-pendiente");
    montarControles();
  });

  /* ---------- Controles: cambiar tema e idioma ---------- */
  const SOL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const LUNA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  function botonTema(btn) {
    const claro = raiz.dataset.tema === "claro";
    btn.innerHTML = claro ? LUNA : SOL;
    const etiqueta = claro ? t("Cambiar a modo oscuro") : t("Cambiar a modo claro");
    btn.setAttribute("aria-label", etiqueta); btn.title = etiqueta;
  }
  function cambiarTema(e) {
    const nuevo = raiz.dataset.tema === "claro" ? "oscuro" : "claro";
    const aplicar = () => {
      raiz.dataset.tema = nuevo; raiz.style.colorScheme = nuevo === "claro" ? "light" : "dark";
      guardar("tc_tema", nuevo);
      document.querySelectorAll("img").forEach(logo);
      document.querySelectorAll("[data-pref=tema]").forEach(botonTema);
      dispatchEvent(new CustomEvent("tc:tema", { detail: nuevo }));
    };
    // Transición circular desde el botón (si el navegador la soporta)
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) { aplicar(); return; }
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    raiz.classList.add("vt-tema");
    const transicion = document.startViewTransition(aplicar);
    transicion.ready.then(() => {
      raiz.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] }, { duration: 600, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
    }).catch(() => {}); // si se cambia de tema dos veces seguidas, la primera transición se omite
    transicion.finished.finally(() => raiz.classList.remove("vt-tema"));
  }
  function montarControles() {
    if (document.querySelector(".prefs")) return;
    const caja = document.createElement("div");
    caja.className = "prefs";
    caja.innerHTML = `<button type="button" class="pref-btn" data-pref="tema"></button><button type="button" class="pref-btn pref-idioma" data-pref="idioma" lang="${idioma === "en" ? "es" : "en"}" aria-label="${idioma === "en" ? "Ver en español" : "View in English"}" title="${idioma === "en" ? "Ver en español" : "View in English"}" data-no-traducir><span class="pref-idioma-actual">${idioma.toUpperCase()}</span><span class="pref-idioma-otro">${idioma === "en" ? "ES" : "EN"}</span></button>`;
    botonTema(caja.querySelector("[data-pref=tema]"));
    caja.querySelector("[data-pref=tema]").addEventListener("click", cambiarTema);
    caja.querySelector("[data-pref=idioma]").addEventListener("click", () => { guardar("tc_idioma", idioma === "en" ? "es" : "en"); location.reload(); });
    const nav = document.querySelector(".nav-links"), app = document.querySelector(".app-header-acciones");
    if (app) app.prepend(caja);
    else if (nav) { const li = document.createElement("li"); li.className = "prefs-li"; li.append(caja); nav.insertBefore(li, nav.lastElementChild); }
    else { caja.classList.add("prefs-flotante"); document.body.append(caja); }
  }

  window.TCi18n = { idioma, locale, t, traducir, tema: () => raiz.dataset.tema, fecha: (d, op) => new Date(d).toLocaleDateString(locale, op) };
  /* Interfaz que usan asistente-ia.js, portal.js y panel.js */
  window.TCIdioma = { actual: idioma, locale, t: traducir, plantilla: t };
})();
