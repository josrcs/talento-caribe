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
    caja.append(t);
    setTimeout(() => t.classList.add("sale"), 3600); // se desliza hacia afuera antes de quitarlo
    setTimeout(() => t.remove(), 4000);
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
  // Mismas reglas que el servidor (backend/src/validar.js)
  const COMUNES = ["12345678", "123456789", "password", "password1", "password123", "contraseña", "contrasena", "qwerty123", "abc12345", "abcd1234", "admin123", "talento123", "talentocaribe", "colombia123"];
  function problemaClave(clave, correo = "") {
    if (clave.length < 8) return "Usa al menos 8 caracteres.";
    if (new TextEncoder().encode(clave).length > 72) return "La contraseña es demasiado larga.";
    if (!/\p{L}/u.test(clave) || !/\d/.test(clave)) return "Combina letras y números.";
    if (COMUNES.includes(clave.toLowerCase())) return "Esa contraseña es muy común. Elige otra.";
    const usuario = correo.toLowerCase().split("@")[0];
    if (usuario.length >= 4 && clave.toLowerCase().includes(usuario)) return "No uses tu correo dentro de la contraseña.";
    return "";
  }
  /* Confirmación con el estilo de la plataforma (en vez de la ventana gris de confirm()).
     const ok = await confirmar({ titulo, mensaje, aceptar: "Eliminar", peligro: true }) -> true / false.
     En acciones peligrosas el foco empieza en "Cancelar"; Esc o clic fuera también cancelan. */
  let responderConfirmacion = null; // la respuesta pendiente del diálogo abierto
  function confirmar({ titulo = "¿Confirmas?", mensaje = "", aceptar = "Confirmar", peligro = false } = {}) {
    let d = $("#tc-confirmar");
    if (!d) {
      d = Object.assign(document.createElement("dialog"), { id: "tc-confirmar", className: "modal modal-confirmar" });
      d.setAttribute("aria-labelledby", "tc-confirmar-titulo"); d.setAttribute("aria-describedby", "tc-confirmar-texto");
      d.innerHTML = '<div class="modal-contenido"><h2 id="tc-confirmar-titulo"></h2><p id="tc-confirmar-texto" class="modal-sub"></p>' +
        '<div class="modal-acciones"><button type="button" class="btn btn-primary" id="tc-confirmar-si"></button><button type="button" class="btn btn-outline" id="tc-confirmar-no">Cancelar</button></div></div>';
      // Se responde en el mismo clic (no con el evento "close", que el navegador puede retrasar en una pestaña oculta)
      const terminar = (valor) => { const r = responderConfirmacion; responderConfirmacion = null; if (d.open) d.close(); r?.(valor); };
      $("#tc-confirmar-si", d).addEventListener("click", () => terminar(true));
      $("#tc-confirmar-no", d).addEventListener("click", () => terminar(false));
      d.addEventListener("cancel", (e) => { e.preventDefault(); terminar(false); }); // tecla Esc
      d.addEventListener("click", (e) => { if (e.target === d) terminar(false); }); // clic en el fondo
      document.body.append(d);
    }
    responderConfirmacion?.(false); // si había otra pregunta abierta, cuenta como cancelada
    $("#tc-confirmar-titulo", d).textContent = titulo;
    $("#tc-confirmar-texto", d).textContent = mensaje;
    const si = $("#tc-confirmar-si", d);
    si.textContent = aceptar; si.classList.toggle("btn-peligro-solido", peligro);
    return new Promise((resolver) => {
      responderConfirmacion = resolver;
      if (!d.open) d.showModal();
      (peligro ? $("#tc-confirmar-no", d) : si).focus();
    });
  }
  /* Botón con estado de carga (necesita .btn-texto y .spinner dentro) */
  function cargando(btn, on) { btn.disabled = on; $(".btn-texto", btn).hidden = on; $(".spinner", btn).hidden = !on; }

  window.CURSOS = window.TALENTO_CARIBE_CURSOS || [];
  window.TCUtil = { $, $$, esc, EMAIL, espera, leer, guardar, sesion, toast, validar, cargando, problemaClave, confirmar };
})();
