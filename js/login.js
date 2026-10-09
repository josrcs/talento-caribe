/* login.js - Acceso único: estudiante, docente y administrativo.
   Modo demostración: las cuentas se validan aquí; con el backend se reemplaza por POST /api/auth/login. */
(() => {
  const { $, $$, esc, EMAIL, validar, cargando, espera } = TCUtil;
  const form = $("#form-login"); if (!form) return;
  const DOCENTES = window.TCDatos?.DOCENTES || [];

  const CUENTAS = {
    estudiante: { correo: "estudiante@talentocaribe.co", clave: "Estudiante123", nombre: "Sofía Pérez", destino: "../portal.html", boton: "Entrar a mi portal", texto: "Consulta tus cursos, entrega actividades y mira tu progreso." },
    docente: { correo: DOCENTES[0]?.correo || "docente@talentocaribe.co", clave: "Docente123", destino: "../portal.html", boton: "Entrar a mi espacio docente", texto: "Deja actividades a tus cursos y revisa las entregas." },
    administrativo: { correo: "admin@talentocaribe.co", clave: "Admin123", nombre: "José Rodríguez", destino: "panel.html", boton: "Entrar al panel", texto: "Elige tu cargo: cada uno ve las herramientas de su área." },
  };

  /* Historia del lado izquierdo por rol (didáctica: qué podrá hacer cada persona) */
  const HISTORIA = {
    estudiante: { eyebrow: "Para estudiantes", titulo: "Aprende haciendo, a tu ritmo.", lista: [["portapapeles", "Actividades de tus docentes", "Entrega tus tareas y recibe retroalimentación."], ["grafica", "Tu progreso en un vistazo", "Barras de avance, notas y logros."], ["chat", "Tutor con IA", "Te explica conceptos y arma tu plan de estudio."]] },
    docente: { eyebrow: "Para docentes", titulo: "Acompaña a tus estudiantes sin complicarte.", lista: [["lapiz", "Crea actividades en minutos", "Usa plantillas didácticas para cada curso."], ["check", "Revisa y califica", "Nota de 1.0 a 5.0 con comentario."], ["usuarios", "Alertas de apoyo", "Detecta quién necesita una mano."]] },
    administrativo: { eyebrow: "Para el equipo", titulo: "Cada cargo, su espacio de trabajo.", lista: [["grafica", "Indicadores claros", "Inscripciones, cursos y actividad académica."], ["escudo", "Permisos por cargo", "Cada área ve solo lo que necesita."], ["destello", "Asistente de gestión", "Pregúntale por cifras y pendientes."]] },
  };

  /* Cargos agrupados para el selector visual */
  const CARGOS = [
    { grupo: "Directivos", items: [
      ["Gerente", "estrella", "Visión global y decisiones"],
      ["Director(a) general", "brujula", "Seguimiento institucional"],
      ["Director(a) académico(a)", "birrete", "Programas de software"],
      ["Director(a) de tecnología", "chip", "Programas de hardware"],
      ["Director(a) de admisiones", "portapapeles", "Ingreso de estudiantes"],
      ["Director(a) de comunicaciones", "megafono", "Información y aliados"],
      ["Director(a) administrativo(a)", "billetera", "Operación y finanzas"],
    ] },
    { grupo: "Coordinación", items: [
      ["Coordinador(a) académico(a)", "libro", "Catálogo de software"],
      ["Coordinador(a) de tecnología", "engranaje", "Laboratorios y prácticas"],
      ["Coordinador(a) de admisiones", "check", "Solicitudes de inscripción"],
      ["Coordinador(a) de comunicaciones", "sobre", "Bandeja de contacto"],
    ] },
    { grupo: "Áreas de apoyo", items: [
      ["Admisiones y registro", "usuarios", "Datos de aspirantes"],
      ["Administración y finanzas", "grafica", "Control de gastos"],
      ["Comunicaciones y alianzas", "chat", "Difusión y vínculos"],
      ["Otro cargo administrativo", "maletin", "Encuestas y funciones"],
    ] },
  ];
  const iconoDe = (cargo) => CARGOS.flatMap((g) => g.items).find((i) => i[0] === cargo)?.[1] || "maletin";

  const params = new URLSearchParams(location.search);
  const cursoPendiente = Number(params.get("curso"));
  const rolInput = $("#l-rol"), error = $("#login-error"), puesto = $("#l-puesto");
  const pintarIconos = (raiz = document) => $$("[data-icono]", raiz).forEach((el) => { el.innerHTML = TCIcono(el.dataset.icono, el.classList.contains("rol-tab-icono") ? 24 : 18); });

  /* ---------- Selector de cargo ---------- */
  function pintarCargos(filtro = "") {
    const f = filtro.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const coincide = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(f);
    const html = CARGOS.map((g) => {
      const items = g.items.filter((i) => !f || coincide(i[0]) || coincide(i[2]));
      if (!items.length) return "";
      return `<div class="cargo-grupo"><span class="cargo-grupo-titulo">${esc(g.grupo)}</span><div class="cargo-grid">${items.map(([nombre, icono, desc]) => `<button type="button" class="cargo-opcion ${puesto.value === nombre ? "is-selected" : ""}" role="radio" aria-checked="${puesto.value === nombre}" data-cargo="${esc(nombre)}"><span class="cargo-icono">${TCIcono(icono, 18)}</span><span class="cargo-texto"><strong>${esc(nombre)}</strong><small>${esc(desc)}</small></span><span class="cargo-check">${TCIcono("check", 14)}</span></button>`).join("")}</div></div>`;
    }).join("");
    $("#cargo-grupos").innerHTML = html || '<p class="cargo-vacio">No encontramos ese cargo. Prueba con “Otro cargo administrativo”.</p>';
  }
  function elegirCargo(nombre) {
    puesto.value = nombre;
    const elegido = !!nombre;
    $("#cargo-selector").hidden = elegido;
    $("#cargo-elegido").hidden = !elegido;
    $("#acceso-credenciales").hidden = !elegido;
    $("#paso-1").classList.toggle("is-activo", !elegido); $("#paso-1").classList.toggle("is-hecho", elegido);
    $("#paso-2").classList.toggle("is-activo", elegido);
    if (elegido) {
      $("#cargo-elegido-nombre").textContent = nombre;
      $("#cargo-elegido-icono").innerHTML = TCIcono(iconoDe(nombre), 20);
      $("[data-error-for='puesto']").hidden = true;
      $("#cargo-elegido").classList.remove("cambia"); void $("#cargo-elegido").offsetWidth; $("#cargo-elegido").classList.add("cambia");
      $("#l-correo").focus();
    } else { pintarCargos($("#cargo-buscar").value); }
  }
  $("#cargo-grupos").addEventListener("click", (e) => { const b = e.target.closest("[data-cargo]"); if (b) elegirCargo(b.dataset.cargo); });
  $("#cargo-buscar").addEventListener("input", (e) => pintarCargos(e.target.value));
  $("#cargo-cambiar").addEventListener("click", () => { elegirCargo(""); $("#cargo-buscar").focus(); });

  /* ---------- Docentes ---------- */
  $("#l-docentes").innerHTML = DOCENTES.map((d) => `<button type="button" class="docente-chip" data-docente="${esc(d.correo)}"><span class="avatar avatar-sm" aria-hidden="true">${esc(d.iniciales)}</span><span><strong>${esc(d.nombre)}</strong><small>${esc(d.especialidad)}</small></span></button>`).join("");
  $("#l-docentes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-docente]"); if (!b) return;
    $$(".docente-chip").forEach((x) => x.classList.toggle("is-selected", x === b));
    $("#l-correo").value = b.dataset.docente; $("#l-clave").focus();
  });

  /* ---------- Cambio de rol ---------- */
  function elegir(rol) {
    $$("[data-role]").forEach((o, i) => { const on = o.dataset.role === rol; o.classList.toggle("is-selected", on); o.setAttribute("aria-checked", on); if (on) $(".rol-tabs").style.setProperty("--i", i); });
    rolInput.value = rol;
    const admin = rol === "administrativo";
    $("#l-puesto-campo").hidden = !admin;
    $("#l-docentes-campo").hidden = rol !== "docente";
    $("#registro-estudiante-link").hidden = rol !== "estudiante";
    if (admin) elegirCargo(puesto.value); else $("#acceso-credenciales").hidden = false;
    $("#login-enviar .btn-texto").textContent = CUENTAS[rol].boton;
    $("#login-subtitulo").textContent = CUENTAS[rol].texto;
    $("#registro-estudiante-href").href = "../registro.html" + (cursoPendiente > 0 ? "?curso=" + cursoPendiente : "");
    $("#demo-datos").textContent = `${CUENTAS[rol].correo} / ${CUENTAS[rol].clave}${admin ? " (con cualquier cargo)" : rol === "docente" ? " (todos los docentes usan esta clave)" : ""}`;
    error.hidden = true; $$("[aria-invalid]", form).forEach((i) => i.removeAttribute("aria-invalid")); $$(".error", form).forEach((e) => (e.hidden = true));
    const h = HISTORIA[rol];
    $("#historia-eyebrow").textContent = h.eyebrow; $("#historia-titulo").textContent = h.titulo;
    $("#historia-lista").innerHTML = h.lista.map(([icono, t, d]) => `<li><span class="beneficio-icono">${TCIcono(icono, 20)}</span><span><strong>${esc(t)}</strong><small>${esc(d)}</small></span></li>`).join("");
    const caja = $("#acceso-dinamico"); caja.classList.remove("cambia"); void caja.offsetWidth; caja.classList.add("cambia");
    const historia = $("#acceso-historia"); historia.classList.remove("cambia"); void historia.offsetWidth; historia.classList.add("cambia");
  }
  $$("[data-role]").forEach((o) => o.addEventListener("click", () => elegir(o.dataset.role)));
  $("#l-ver").addEventListener("click", (e) => { const v = $("#l-clave").type === "password"; $("#l-clave").type = v ? "text" : "password"; e.currentTarget.textContent = v ? "Ocultar" : "Mostrar"; e.currentTarget.setAttribute("aria-pressed", v); });
  $("#demo-usar").addEventListener("click", () => {
    const rol = rolInput.value, c = CUENTAS[rol];
    if (rol === "administrativo" && !puesto.value) elegirCargo("Gerente");
    $("#l-correo").value = c.correo; $("#l-clave").value = c.clave;
    if (rol === "docente") $$(".docente-chip").forEach((x) => x.classList.toggle("is-selected", x.dataset.docente === c.correo));
  });

  /* ---------- Envío ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rol = rolInput.value, btn = $("#login-enviar"), cuenta = CUENTAS[rol];
    const reglas = {};
    if (rol === "administrativo") reglas.puesto = (v) => (v ? "" : "Elige el cargo con el que ingresarás.");
    reglas.correo = (v) => (EMAIL.test(v) ? "" : "Escribe tu correo, por ejemplo nombre@correo.com.");
    reglas.clave = (v) => (v.length < 8 ? "La contraseña tiene mínimo 8 caracteres." : "");
    if (!validar(form, reglas)) return;
    cargando(btn, true); error.hidden = true; await espera(650);
    const correo = form.elements.correo.value.trim().toLowerCase(), clave = form.elements.clave.value;
    let session = null;
    if (TCAuth.api) {
      try { session = await TCAuth.autenticar(correo, clave, rol, rol === "administrativo" ? puesto.value : undefined); }
      catch (problem) { error.textContent = problem.message; error.hidden = false; cargando(btn, false); return; }
    } else if (rol === "docente") {
      const d = DOCENTES.find((x) => x.correo === correo && x.clave === clave);
      if (d) session = { rol, correo: d.correo, nombre: d.nombre, especialidad: d.especialidad };
    } else if (correo === cuenta.correo && clave === cuenta.clave) session = { rol, correo: cuenta.correo, nombre: cuenta.nombre };
    if (!session && rol === "estudiante" && !TCAuth.api) {
      try { session = await TCAuth.autenticar(correo, clave); }
      catch (problem) { error.textContent = problem.message; error.hidden = false; cargando(btn, false); return; }
    }
    if (session) {
      if (rol === "administrativo" && !session.puesto) session.puesto = puesto.value;
      localStorage.setItem("tc_sesion_demo", JSON.stringify(session));
      location.href = rol === "estudiante" && cursoPendiente > 0 ? "../cursos.html?continuar=" + cursoPendiente : cuenta.destino;
      return;
    }
    error.textContent = "Correo o contraseña incorrectos para este tipo de cuenta."; error.hidden = false;
    form.classList.remove("sacude"); void form.offsetWidth; form.classList.add("sacude"); cargando(btn, false);
  });

  pintarIconos(); pintarCargos();
  const inicial = ["estudiante", "docente", "administrativo"].includes(params.get("rol")) ? params.get("rol") : "estudiante";
  elegir(inicial);
})();
