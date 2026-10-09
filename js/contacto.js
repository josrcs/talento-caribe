/* contacto.js - Formulario de contacto con validación y estado de carga */
(() => {
  const { $, EMAIL, leer, guardar, toast, validar, cargando, espera } = TCUtil;
  const form = $("#form-contacto"); if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#contacto-enviar"), out = $("#contacto-estado");
    if (form.elements.sitio_web.value) return; // campo trampa: solo un bot lo llena
    const ok = validar(form, {
      nombre: (v) => (v.length < 3 ? "Escribe tu nombre completo." : ""),
      correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com."),
      interes: (v) => (v ? "" : "Elige una opción."),
      asunto: (v) => (v ? "" : "Escribe el asunto del mensaje."),
      mensaje: (v) => (v.length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : ""),
      acepto: (v) => (v ? "" : "Debes aceptar el uso de tus datos para poder responderte."),
    });
    if (!ok) return;
    cargando(btn, true); out.hidden = true;
    const datos = { nombre: form.elements.nombre.value.trim(), correo: form.elements.correo.value.trim(), telefono: form.elements.telefono.value.trim(), interes: form.elements.interes.value, asunto: form.elements.asunto.value.trim(), mensaje: form.elements.mensaje.value.trim(), leido: false, creado_en: new Date().toISOString() };
    try {
      if (TC.MODO_DEMO && !TC.API_CONTACTO) { await espera(800); guardar("tc_mensajes", [...leer("tc_mensajes", []), { id: Date.now(), ...datos }]); }
      else { const r = await fetch(`${TC.API_URL}/contacto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }); if (!r.ok) throw new Error(); }
      form.reset(); out.textContent = "¡Mensaje enviado! Te responderemos en un máximo de 3 días hábiles."; out.className = "form-estado"; toast("Mensaje enviado");
    } catch { out.textContent = "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos."; out.className = "form-estado estado-error"; }
    out.hidden = false; cargando(btn, false);
  });
})();
