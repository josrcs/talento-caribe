/* ==========================================================
   idioma.js - Idioma (español / inglés) y tema (oscuro / claro)
   Se importa PRIMERO en cada página (src/paginas/*.jsx), antes de montar React.

   Cómo traduce:
   1. Los componentes de React escriben en español.
   2. Un MutationObserver revisa lo que React pinta (textos y atributos
      placeholder, aria-label, title, alt) y lo busca en el diccionario
      window.TC_EN (español -> inglés). React compara con sus propios datos,
      no con la página, así que el texto traducido no se pierde al volver a pintar.
   3. Los números se normalizan como "#": "Vence en 3 días" usa la clave
      "Vence en # días" -> "Due in # days" y se vuelve a poner el 3.
   4. Para frases con nombres se usa t("¡Hola, {nombre}!", { nombre }).
   El contenido escrito por personas (respuestas, mensajes del chat) se marca
   con data-no-traducir y nunca se toca.
   ========================================================== */
import "./diccionario-en.js";
import "./diccionario-en-cursos.js";

const raiz = document.documentElement;
// Con JavaScript activo, los efectos de revelado pueden ocultar contenido para mostrarlo al hacer scroll (efectos.css)
raiz.classList.add("js");
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

/* ---------- Tema ---------- */
const temaGuardado = leer("tc_tema");
raiz.dataset.tema = temaGuardado || (matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro");
raiz.style.colorScheme = raiz.dataset.tema === "claro" ? "light" : "dark";

/* ---------- Idioma ---------- */
export const idioma = leer("tc_idioma") === "en" ? "en" : "es";
export const locale = idioma === "en" ? "en-US" : "es-CO";
raiz.lang = idioma;
const EN = window.TC_EN || {};

const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const NUM = /\d+(?:[.,]\d+)?/g;
let dentro = false;
export function traducir(texto) {
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
    for (const [re, rep] of window.TC_EN_PATRONES || []) {
      const m = limpio.match(re); if (!m) continue;
      const r = typeof rep === "function" ? rep(...m) : limpio.replace(re, rep);
      if (r) { fuera = r; break; }
    }
  }
  if (fuera === undefined && /[.!?:]\s/.test(limpio) && !dentro) {
    // Respaldo: texto compuesto por varias frases (p. ej. "Completa tus datos. correo@x.co")
    dentro = true;
    const partes = limpio.replace(/([.!?:])\s+/g, "$1\u0000").split("\u0000");
    const nuevas = partes.map((p) => traducir(p));
    dentro = false;
    if (nuevas.some((n, i) => n !== partes[i])) fuera = nuevas.join(" ");
  }
  if (fuera === undefined) return texto;
  // Conserva los espacios de los extremos (importan entre etiquetas en línea)
  const inicio = texto.match(/^\s*/)[0], fin = texto.match(/\s*$/)[0];
  return inicio + fuera + fin;
}
/* t(): para textos con variables. t("¡Hola, {nombre}!", { nombre: "Sofía" }) */
export function t(es, vars = {}) {
  const base = idioma === "en" ? (EN[norm(es)] ?? es) : es;
  return base.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
export const fecha = (d, opciones) => new Date(d).toLocaleDateString(locale, opciones);

/* Palabras que cambian según dónde aparecen: window.TC_EN_CONTEXTO = [[selector, { "Dirección": "Steering" }], ...] */
function enContexto(el, texto) {
  const k = norm(texto);
  for (const [selector, dic] of window.TC_EN_CONTEXTO || []) if (dic[k] !== undefined && el.matches(selector)) return texto.replace(k, dic[k]);
  return null;
}

/* ---------- Traducción de lo que pinta React ---------- */
const ATRIBUTOS = ["placeholder", "aria-label", "title", "alt"];
const omitir = (el) => el.closest?.("[data-no-traducir], script, style, textarea, code, pre");
function procesar(nodo) {
  if (nodo.nodeType === 3) {
    if (nodo.parentElement && !omitir(nodo.parentElement)) {
      const nuevo = enContexto(nodo.parentElement, nodo.nodeValue) ?? traducir(nodo.nodeValue);
      if (nuevo !== nodo.nodeValue) nodo.nodeValue = nuevo;
    }
    return;
  }
  if (nodo.nodeType !== 1 || omitir(nodo)) return;
  for (const el of [nodo, ...nodo.querySelectorAll("*")]) {
    if (el.closest("[data-no-traducir]")) continue;
    for (const a of ATRIBUTOS) { const v = el.getAttribute(a); if (v) { const n = traducir(v); if (n !== v) el.setAttribute(a, n); } }
  }
  const caminante = document.createTreeWalker(nodo, NodeFilter.SHOW_TEXT);
  let tx; while ((tx = caminante.nextNode())) procesar(tx);
}
if (idioma === "en") {
  // Oculta la página hasta traducir lo primero que pinta React (evita ver el español un instante)
  raiz.classList.add("i18n-pendiente");
  const estilo = document.createElement("style");
  estilo.textContent = "html.i18n-pendiente body{visibility:hidden}";
  document.head.append(estilo);
  setTimeout(() => raiz.classList.remove("i18n-pendiente"), 1500);
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === "characterData") procesar(c.target);
      else if (c.type === "attributes") { if (!omitir(c.target)) { const v = c.target.getAttribute(c.attributeName); const n = v && traducir(v); if (n && n !== v) c.target.setAttribute(c.attributeName, n); } }
      else c.addedNodes.forEach(procesar);
    }
    raiz.classList.remove("i18n-pendiente");
  }).observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  document.title = traducir(document.title);
  const meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = traducir(meta.content);
}

/* ---------- Cambiar tema e idioma (los usa el componente Preferencias) ---------- */
export const temaActual = () => raiz.dataset.tema;
export function cambiarTema(boton) {
  const nuevo = raiz.dataset.tema === "claro" ? "oscuro" : "claro";
  const aplicar = () => {
    raiz.dataset.tema = nuevo; raiz.style.colorScheme = nuevo === "claro" ? "light" : "dark";
    guardar("tc_tema", nuevo);
    dispatchEvent(new CustomEvent("tc:tema", { detail: nuevo }));
  };
  // Transición circular desde el botón (si el navegador la soporta)
  if (!document.startViewTransition || !boton || matchMedia("(prefers-reduced-motion: reduce)").matches) { aplicar(); return; }
  const r = boton.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  raiz.classList.add("vt-tema");
  const transicion = document.startViewTransition(aplicar);
  transicion.ready.then(() => {
    raiz.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] }, { duration: 600, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {}); // si se cambia de tema dos veces seguidas, la primera transición se omite
  transicion.finished.finally(() => raiz.classList.remove("vt-tema"));
}
export function cambiarIdioma() { guardar("tc_idioma", idioma === "en" ? "es" : "en"); location.reload(); }

// Los diccionarios usan window.TCi18n.traducir en algunas frases con partes variables
window.TCi18n = { idioma, locale, t, traducir, fecha };
