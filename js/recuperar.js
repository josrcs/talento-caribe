/* ==========================================================
   recuperar.js - Recuperar la contraseña (recuperar.html)
   1. Sin token: se pide el correo y el servidor envía un enlace
      (POST /api/auth/recuperar). La respuesta es la misma exista o no
      la cuenta, para no revelar qué correos están registrados.
   2. Con ?token= (el enlace del correo): se crea la contraseña nueva
      (POST /api/auth/restablecer).
   En modo demostración no hay servidor que envíe correos: se explica.
   ========================================================== */
(() => {
  const { $, EMAIL, validar, cargando } = TCUtil;
  const token = new URLSearchParams(location.search).get("token") || "";
  const estado = $("#rc-estado");
  const mostrar = (texto, error = false) => { estado.textContent = texto; estado.className = "form-estado" + (error ? " estado-error" : ""); estado.hidden = false; };

  async function enviar(ruta, cuerpo) {
    let res;
    try { res = await fetch(TC.API_URL + ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) }); }
    catch { throw new Error("No hay conexión con el servidor. Inténtalo de nuevo en unos minutos."); }
    const datos = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(datos.error || "No se pudo completar la solicitud.");
    return datos;
  }

  if (TC.MODO_DEMO) {
    $("#rc-demo").hidden = false;
    $("#form-pedir").querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    return;
  }

  if (token) {
    $("#form-pedir").hidden = true;
    $("#form-nueva").hidden = false;
    $("#recuperar-titulo").textContent = "Crea tu contraseña nueva";
    $("#recuperar-intro").textContent = "Escríbela dos veces. Después podrás entrar con ella.";
    $("#rc-clave").focus();
  }

  $("#form-pedir").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget, boton = $("#rc-pedir");
    if (!validar(form, { correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com.") })) return;
    cargando(boton, true); estado.hidden = true;
    try {
      await enviar("/auth/recuperar", { correo: form.elements.correo.value.trim() });
      form.hidden = true;
      mostrar("Si el correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.");
    } catch (error) { mostrar(error.message, true); }
    cargando(boton, false);
  });

  $("#form-nueva").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget, boton = $("#rc-guardar");
    const ok = validar(form, {
      clave: (v) => (v.length < 8 ? "Usa al menos 8 caracteres." : ""),
      confirmar: (v, f) => (v !== f.elements.clave.value.trim() ? "Las contraseñas no coinciden." : ""),
    });
    if (!ok) return;
    cargando(boton, true); estado.hidden = true;
    try {
      await enviar("/auth/restablecer", { token, clave: form.elements.clave.value });
      form.hidden = true;
      history.replaceState(null, "", location.pathname); // el enlace ya se usó: se quita de la barra de direcciones
      mostrar("¡Listo! Tu contraseña cambió. Ya puedes ingresar con ella.");
      $("#rc-volver").textContent = "Ingresar ahora →";
    } catch (error) {
      mostrar(error.message, true);
      cargando(boton, false);
    }
  });
})();
