/* ==========================================================
   cuenta.js - "Seguridad de tu cuenta" (portal y panel)
   - Cambiar la contraseña pidiendo la actual (PUT /api/auth/clave).
     El servidor cierra las sesiones de los demás equipos y devuelve
     un token nuevo para este navegador.
   - Cerrar la sesión en todos los equipos (POST /api/auth/cerrar-sesiones),
     por ejemplo después de usar un computador público.
   Se abre con cualquier botón [data-cuenta]. En modo demostración
   (sin servidor) explica que la función necesita el servidor.
   ========================================================== */
(() => {
  const { $, toast, validar, cargando, problemaClave } = TCUtil;
  const API = Boolean(window.TCApi?.activa);
  const enAdmin = location.pathname.includes("/admin/");

  const dialogo = document.createElement("dialog");
  dialogo.className = "modal";
  dialogo.id = "modal-cuenta";
  dialogo.setAttribute("aria-labelledby", "cuenta-titulo");
  dialogo.innerHTML = `
    <form class="modal-contenido form" id="form-clave" novalidate>
      <button type="button" class="modal-cerrar" data-cerrar-cuenta aria-label="Cerrar">&times;</button>
      <span class="eyebrow">TU CUENTA</span>
      <h2 id="cuenta-titulo">Seguridad de tu cuenta</h2>
      <p class="modal-sub" id="cuenta-demo" hidden>En el modo demostración las cuentas viven en este navegador. Cambiar la contraseña y cerrar sesiones en otros equipos funciona cuando la página usa el servidor (npm start).</p>
      <fieldset id="cuenta-campos">
        <legend class="subtitulo">Cambiar la contraseña</legend>
        <div class="campo"><label for="cc-actual">Contraseña actual</label><input id="cc-actual" name="actual" type="password" autocomplete="current-password" required maxlength="72"><small class="error" data-error-for="actual" hidden></small></div>
        <div class="campo"><label for="cc-nueva">Contraseña nueva</label><input id="cc-nueva" name="nueva" type="password" autocomplete="new-password" required minlength="8" maxlength="72"><small class="form-ayuda">Mínimo 8 caracteres, con letras y números.</small><small class="error" data-error-for="nueva" hidden></small></div>
        <div class="campo"><label for="cc-confirmar">Confirma la contraseña nueva</label><input id="cc-confirmar" name="confirmar" type="password" autocomplete="new-password" required maxlength="72"><small class="error" data-error-for="confirmar" hidden></small></div>
        <p class="error" id="cuenta-error" role="alert" hidden></p>
        <div class="modal-acciones">
          <button type="submit" class="btn btn-primary"><span class="btn-texto">Cambiar contraseña</span><span class="spinner" aria-hidden="true" hidden></span></button>
        </div>
        <p class="form-ayuda">Al cambiarla se cierra tu sesión en los demás equipos y te enviamos un correo de aviso.</p>
      </fieldset>
      <hr class="separador">
      <h3 class="subtitulo">¿Usaste un computador público?</h3>
      <p class="form-ayuda">Cierra tu sesión en todos los equipos, incluido este. Tendrás que volver a ingresar.</p>
      <div class="modal-acciones"><button type="button" class="btn btn-outline" id="cuenta-cerrar-todo">Cerrar sesión en todos los equipos</button></div>
    </form>`;
  document.body.append(dialogo);
  const form = $("#form-clave"), error = $("#cuenta-error");
  const salir = () => { localStorage.removeItem("tc_sesion_demo"); location.href = enAdmin ? "login.html" : "admin/login.html"; };

  function abrir() {
    form.reset(); error.hidden = true;
    form.querySelectorAll("[data-error-for]").forEach((e) => { e.hidden = true; });
    $("#cuenta-demo").hidden = API;
    $("#cuenta-campos").disabled = !API;
    $("#cuenta-cerrar-todo").disabled = !API;
    dialogo.showModal();
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cuenta]")) abrir();
    if (e.target.closest("[data-cerrar-cuenta]")) dialogo.close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); error.hidden = true;
    const sesion = TCUtil.sesion() || {};
    const ok = validar(form, {
      actual: (v) => (v ? "" : "Escribe tu contraseña actual."),
      nueva: (v, f) => problemaClave(f.elements.nueva.value, sesion.correo) || (f.elements.nueva.value === f.elements.actual.value ? "Debe ser distinta de la actual." : ""),
      confirmar: (v, f) => (f.elements.confirmar.value !== f.elements.nueva.value ? "Las contraseñas no coinciden." : ""),
    });
    if (!ok) return;
    const boton = form.querySelector("[type=submit]");
    cargando(boton, true);
    try {
      const { token, usuario } = await TCApi.pedir("PUT", "/auth/clave", { actual: form.elements.actual.value, nueva: form.elements.nueva.value });
      // Este navegador sigue con sesión: se guarda el token nuevo (el anterior ya no sirve)
      localStorage.setItem("tc_sesion_demo", JSON.stringify({ ...sesion, ...usuario, puesto: sesion.puesto || usuario.puesto, token }));
      dialogo.close();
      toast("Contraseña actualizada. Cerramos tu sesión en los demás equipos.");
    } catch (problema) {
      error.textContent = problema.message; error.hidden = false;
    } finally { cargando(boton, false); }
  });

  $("#cuenta-cerrar-todo").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (!b.dataset.confirmar) { b.dataset.confirmar = "1"; b.textContent = "¿Seguro? Toca de nuevo para cerrar todo"; setTimeout(() => { delete b.dataset.confirmar; b.textContent = "Cerrar sesión en todos los equipos"; }, 4000); return; }
    b.disabled = true;
    try { await TCApi.pedir("POST", "/auth/cerrar-sesiones"); salir(); }
    catch (problema) { toast(problema.message, "error"); b.disabled = false; }
  });
})();
