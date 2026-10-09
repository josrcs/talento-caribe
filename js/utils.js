/* utils.js - Utilidades compartidas por contacto, chat, login y panel */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const sesion = () => leer("tc_sesion_demo", null);

  function toast(msg, tipo = "ok") {
    const caja = $("#toasts"); if (!caja) return;
    const t = Object.assign(document.createElement("div"), { className: `toast toast-${tipo}`, textContent: msg });
    caja.append(t); setTimeout(() => t.remove(), 4000);
  }
  /* reglas = { campo: (valor, form) => "mensaje de error" o "" }. Pinta los errores y devuelve true si todo es válido. */
  function validar(form, reglas) {
    let ok = true;
    for (const [campo, regla] of Object.entries(reglas)) {
      const el = form.elements[campo];
      const msg = regla(el.type === "checkbox" ? el.checked : el.value.trim(), form);
      const salida = $(`[data-error-for="${campo}"]`, form);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (salida) { salida.textContent = msg; salida.hidden = !msg; }
      if (msg && ok) el.focus();
      ok = ok && !msg;
    }
    return ok;
  }
  /* Botón con estado de carga (necesita .btn-texto y .spinner dentro) */
  function cargando(btn, on) { btn.disabled = on; $(".btn-texto", btn).hidden = on; $(".spinner", btn).hidden = !on; }

  window.CURSOS = window.TALENTO_CARIBE_CURSOS || [];
  window.TCUtil = { $, $$, esc, EMAIL, espera, leer, guardar, sesion, toast, validar, cargando };
})();
