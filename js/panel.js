/* Panel administrativo de demostración: cada cargo ve su área y sus funciones. */
/* Con servidor espera a que lleguen los datos de PostgreSQL (window.TCListo) antes de pintar. */
(window.TCListo || Promise.resolve()).then(() => {
  const { $, $$, esc, leer, guardar, sesion, toast } = TCUtil;
  const API = Boolean(window.TCApi?.activa);
  /* Ejecuta una escritura (navegador o servidor) y avisa si falla */
  async function intentar(accion, boton) {
    if (boton) boton.disabled = true;
    try { await accion(); return true; }
    catch (error) { toast(error.message || "No se pudo guardar. Inténtalo de nuevo.", "error"); return false; }
    finally { if (boton) boton.disabled = false; }
  }
  const s = sesion();
  if (!s || s.rol !== "administrativo") { location.replace("login.html"); return; }

  const perfiles = {
    "Gerente": { area: "Gerencia", start: "resumen", sections: ["resumen", "area", "cursos", "inscripciones", "mensajes", "ia", "encuestas"], courseArea: "", title: "Gerencia · todas las áreas", intro: "Supervisas el trabajo de toda la organización y puedes corregirlo cuando haga falta: oferta académica, actividades y notas de los docentes, admisiones, comunicaciones, finanzas y el asistente.", tasks: [["Indicadores ejecutivos", "Consulta cifras de actividad y demanda de todas las áreas.", "resumen"], ["Oferta de formación", "Crea y edita cursos y fichas de cualquier área.", "cursos"], ["Admisiones", "Revisa y cambia el estado de las solicitudes de inscripción.", "inscripciones"], ["Comunicaciones", "Lee y responde los mensajes de contacto.", "mensajes"], ["Finanzas", "Revisa, registra, corrige o elimina los gastos del proyecto.", "area"], ["Pulso institucional", "Consulta encuestas organizadas por departamento.", "encuestas"], ["Experiencia de la comunidad", "Define el tono y la información del asistente.", "ia"]] },
    "Director(a) general": { area: "Dirección general", start: "resumen", sections: ["resumen", "cursos", "encuestas"], courseArea: "", title: "Dirección general · seguimiento", intro: "Supervisa los indicadores generales y la oferta publicada. El acceso a mensajes personales y documentos de inscripción se mantiene en las áreas responsables.", tasks: [["Indicadores", "Revisa actividad general sin acceder a expedientes personales.", "resumen"], ["Catálogo institucional", "Consulta los cursos disponibles en todas las áreas.", "cursos"], ["Encuestas por departamento", "Consulta la retroalimentación de toda la comunidad.", "encuestas"]] },
    "Director(a) académico(a)": { area: "Dirección académica", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Software", title: "Dirección académica", intro: "Define la oferta de aprendizaje y mantiene la calidad de los programas de software.", tasks: [["Programas académicos", "Revisa y crea cursos del área de software.", "cursos"], ["Voz de estudiantes", "Consulta encuestas por departamento.", "encuestas"]] },
    "Director(a) de tecnología": { area: "Dirección de tecnología", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Hardware", title: "Dirección de tecnología", intro: "Orienta el catálogo de hardware, laboratorios y experiencias prácticas.", tasks: [["Programas de tecnología", "Revisa los cursos del área de hardware.", "cursos"], ["Experiencia de laboratorio", "Consulta encuestas de todos los departamentos.", "encuestas"]] },
    "Director(a) de admisiones": { area: "Dirección de admisiones", start: "area", sections: ["area", "inscripciones", "mensajes", "encuestas"], courseArea: "", title: "Dirección de admisiones", intro: "Supervisa el proceso de ingreso y el acompañamiento a candidatos y estudiantes.", tasks: [["Solicitudes de ingreso", "Revisa y actualiza solicitudes de inscripción.", "inscripciones"], ["Consultas de aspirantes", "Atiende los mensajes relacionados con admisiones.", "mensajes"], ["Encuestas por departamento", "Consulta los resultados de las encuestas por departamento.", "encuestas"]] },
    "Director(a) de comunicaciones": { area: "Dirección de comunicaciones", start: "area", sections: ["area", "mensajes", "encuestas"], courseArea: "", title: "Dirección de comunicaciones", intro: "Cuida la información pública y las relaciones con la comunidad y aliados.", tasks: [["Bandeja de comunicaciones", "Da seguimiento a los mensajes de contacto.", "mensajes"], ["Claridad de la información", "Consulta encuestas de todos los departamentos.", "encuestas"]] },
    "Director(a) administrativo(a)": { area: "Dirección administrativa", start: "area", sections: ["area", "encuestas"], courseArea: "", title: "Dirección administrativa", intro: "Lleva el control operativo y financiero de la organización.", tasks: [["Control de gastos", "Registra y consulta movimientos administrativos del proyecto.", "area"], ["Encuestas institucionales", "Consulta retroalimentación de todos los departamentos.", "encuestas"]] },
    "Coordinador(a) académico(a)": { area: "Coordinación académica", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Software", title: "Coordinación académica", intro: "Organiza el catálogo de software y cuida la experiencia de aprendizaje.", tasks: [["Cursos de software", "Consulta la programación de cursos de tu área.", "cursos"], ["Encuestas por departamento", "Consulta la escucha comunitaria.", "encuestas"]] },
    "Coordinador(a) de tecnología": { area: "Coordinación de tecnología", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Hardware", title: "Coordinación de tecnología", intro: "Organiza las prácticas de tecnología y los recursos para laboratorios.", tasks: [["Cursos de hardware", "Consulta la programación de cursos de tu área.", "cursos"], ["Encuestas por departamento", "Consulta la escucha comunitaria.", "encuestas"]] },
    "Coordinador(a) de admisiones": { area: "Coordinación de admisiones", start: "area", sections: ["area", "inscripciones", "encuestas"], courseArea: "", title: "Coordinación de admisiones", intro: "Da seguimiento a solicitudes de ingreso sin acceso a mensajes de otras áreas.", tasks: [["Solicitudes de inscripción", "Filtra y actualiza las solicitudes de los cursos.", "inscripciones"], ["Encuestas por departamento", "Consulta la experiencia de ingreso y otros temas.", "encuestas"]] },
    "Coordinador(a) de comunicaciones": { area: "Coordinación de comunicaciones", start: "area", sections: ["area", "mensajes", "encuestas"], courseArea: "", title: "Coordinación de comunicaciones", intro: "Gestiona los mensajes públicos y el trabajo cotidiano de comunicación.", tasks: [["Bandeja de contacto", "Lee los mensajes recibidos desde la página pública.", "mensajes"], ["Encuestas por departamento", "Consulta las preguntas de toda la organización.", "encuestas"]] },
    "Admisiones y registro": { area: "Admisiones y registro", start: "area", sections: ["area", "inscripciones", "mensajes", "encuestas"], courseArea: "", title: "Admisiones y registro", intro: "Administra datos de aspirantes y da respuesta a las consultas de ingreso.", tasks: [["Solicitudes", "Revisa y actualiza inscripciones de cursos.", "inscripciones"], ["Consultas", "Responde mensajes sobre ingreso y registro.", "mensajes"], ["Encuestas", "Consulta la experiencia del proceso de inscripción.", "encuestas"]] },
    "Administración y finanzas": { area: "Administración y finanzas", start: "area", sections: ["area", "encuestas"], courseArea: "", title: "Administración y finanzas", intro: "Controla movimientos financieros y consulta las opiniones de la comunidad.", tasks: [["Control de gastos", "Registra movimientos y consulta totales del proyecto.", "area"], ["Encuestas financieras", "Consulta retroalimentación por departamento.", "encuestas"]] },
    "Comunicaciones y alianzas": { area: "Comunicaciones", start: "area", sections: ["area", "mensajes", "encuestas"], courseArea: "", title: "Comunicaciones y alianzas", intro: "Gestiona consultas, difusión y vínculos con la comunidad y aliados.", tasks: [["Bandeja de contacto", "Lee los mensajes recibidos desde la página pública.", "mensajes"], ["Encuestas de comunicación", "Consulta la claridad de los mensajes y canales.", "encuestas"]] },
    "Otro cargo administrativo": { area: "Administración", start: "area", sections: ["area", "encuestas"], courseArea: "", title: "Espacio administrativo", intro: "Consulta las encuestas por departamento y revisa las funciones asignadas a tu cargo.", tasks: [["Encuestas", "Los resultados están organizados por departamento.", "encuestas"]] }
  };
  const perfil = perfiles[s.puesto] || perfiles["Otro cargo administrativo"];
  const ACADEMICOS = ["Gerente", "Director(a) general", "Director(a) académico(a)", "Director(a) de tecnología", "Coordinador(a) académico(a)", "Coordinador(a) de tecnología"];
  perfil.sections = ["resumen", ...perfil.sections.filter((x) => x !== "resumen"), "asistente"];
  if (ACADEMICOS.includes(s.puesto)) { perfil.sections.splice(1, 0, "academico"); perfil.tasks.push(["Actividad académica", "Mira qué actividades publican los docentes y cómo van las entregas.", "academico"]); }
  // Registro de seguridad: los mismos cargos que permite el servidor (PERMISOS.seguridad en backend/src/seguridad.js)
  const SEGURIDAD = ["Gerente", "Director(a) general", "Director(a) de tecnología"];
  if (SEGURIDAD.includes(s.puesto)) { perfil.sections.splice(perfil.sections.length - 1, 0, "seguridad"); perfil.tasks.push(["Seguridad", "Revisa ingresos, intentos fallidos y bloqueos de cuentas.", "seguridad"]); }
  // Cuentas: los mismos cargos que permite el servidor (PERMISOS.cuentasEquipo y PERMISOS.bloquearEstudiantes)
  const gestionaEquipo = ["Gerente"].includes(s.puesto), gestionaEstudiantes = ["Gerente", "Coordinador(a) de admisiones"].includes(s.puesto);
  if (gestionaEquipo || gestionaEstudiantes) {
    perfil.sections.splice(perfil.sections.length - 1, 0, "cuentas");
    perfil.tasks.push(["Cuentas", gestionaEquipo ? "Crea o elimina cuentas del equipo y bloquea estudiantes inactivos." : "Bloquea las cuentas de estudiantes inactivos y desbloquéalas cuando lo pidan.", "cuentas"]);
  }
  perfil.tasks.push(["Asistente de gestión", "Pregúntale por cifras, pendientes y funciones de tu cargo.", "asistente"]);
  perfil.start = "resumen";
  window.TCPanelPerfil = perfil;
  const D = window.TCDatos;
  const iniciales = (n) => String(n || "?").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  const ICONO_SECCION = { cuentas: "usuarios", resumen: "casa", area: "maletin", academico: "birrete", cursos: "libro", inscripciones: "portapapeles", mensajes: "sobre", encuestas: "chat", ia: "engranaje", asistente: "destello", seguridad: "escudo" };
  $("#admin-nombre").textContent = s.nombre || "Administrador";
  $("#admin-puesto").textContent = s.puesto || "Administrativo";
  $("#admin-avatar").textContent = iniciales(s.nombre);
  $("#nav-area").textContent = perfil.area;
  const hora = new Date().getHours();
  $("#t-resumen").textContent = `${hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"}, ${(s.nombre || "").split(" ")[0]} 👋`;
  $("#saludo-area").textContent = (s.puesto || "Administrativo") + " · " + perfil.area;
  $("#saludo-texto").textContent = perfil.intro;
  $$("[data-icono]").forEach((el) => (el.innerHTML = TCIcono(el.dataset.icono, 18)));

  function abrirSeccion(nombre) {
    $$(".panel-link").forEach((button) => {
      const selected = button.dataset.seccion === nombre;
      button.classList.toggle("activo", selected);
      if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    $$(".panel-seccion").forEach((section) => { section.hidden = section.id !== "sec-" + nombre; });
    $("#sec-" + nombre)?.classList.remove("cambia"); void $("#sec-" + nombre)?.offsetWidth; $("#sec-" + nombre)?.classList.add("cambia");
    $("#panel-menu-btn").setAttribute("aria-expanded", "false"); $("#panel-nav").classList.remove("is-abierto");
    if (nombre === "asistente" && !$("#chat-panel").classList.contains("ia-chat")) TCChatUI.montar($("#chat-panel"), { modo: "completo" });
    if (nombre === "academico") pintarAcademico();
    if (nombre === "seguridad") pintarSeguridad();
    if (nombre === "cuentas") pintarCuentas();
    history.replaceState(null, "", "#" + nombre);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.TCNavegar = (nombre) => { if (!allowed.has(nombre)) return false; abrirSeccion(nombre); return true; };
  $("#panel-menu-btn").addEventListener("click", (e) => { const on = e.currentTarget.getAttribute("aria-expanded") !== "true"; e.currentTarget.setAttribute("aria-expanded", on); $("#panel-nav").classList.toggle("is-abierto", on); });
  const allowed = new Set(perfil.sections.concat("encuestas"));
  $$(".panel-link").forEach((button) => {
    button.hidden = !allowed.has(button.dataset.seccion);
    button.addEventListener("click", () => abrirSeccion(button.dataset.seccion));
  });
  const sections = new Set(["resumen", "area", "academico", "cursos", "inscripciones", "mensajes", "ia", "encuestas", "asistente", "seguridad", "cuentas"]);
  sections.forEach((name) => { const section = $("#sec-" + name); if (section) section.hidden = !allowed.has(name); });
  $("#area-departamento").textContent = perfil.area;
  $("#area-titulo").textContent = perfil.title;
  $("#area-intro").textContent = perfil.intro;
  const tarjetaTarea = (task) => '<article class="department-card acceso-card-mini"><span class="acceso-icono">' + TCIcono(ICONO_SECCION[task[2]] || "maletin", 22) + '</span><h2>' + esc(task[0]) + '</h2><p>' + esc(task[1]) + '</p><button class="btn btn-outline btn-sm" type="button" data-open-section="' + esc(task[2]) + '">Abrir ' + TCIcono("flecha", 14) + '</button></article>';
  $("#area-tareas").innerHTML = perfil.tasks.map(tarjetaTarea).join("");
  $("#accesos-rapidos").innerHTML = perfil.tasks.filter((t) => t[2] !== "resumen").map(tarjetaTarea).join("");
  $("#accesos-rapidos").addEventListener("click", (event) => { const button = event.target.closest("[data-open-section]"); if (button && allowed.has(button.dataset.openSection)) abrirSeccion(button.dataset.openSection); });
  const finanzasActivo = ["Gerente", "Administración y finanzas", "Director(a) administrativo(a)"].includes(s.puesto); // = PERMISOS.finanzas del servidor
  $("#finanzas-panel").hidden = !finanzasActivo;
  if (API) $("#finanzas-nota").textContent = "Movimientos guardados en la base de datos. Cada persona de finanzas y la gerencia puede corregirlos.";
  function fecha(item) { return new Date(item.creado_en || item.creado).toLocaleDateString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short" }); }
  function fila(cols, text) { return '<tr><td colspan="' + cols + '">' + text + "</td></tr>"; }
  const formatoPesos = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
  function pintarGastos() {
    const gastos = D.gastos();
    $("#finanzas-total").textContent = formatoPesos(gastos.reduce((total, item) => total + Number(item.valor || 0), 0));
    $("#finanzas-cantidad").textContent = gastos.length;
    $("#tb-gastos").innerHTML = gastos.slice().reverse().map((item) => "<tr><td>" + esc(item.concepto) + "</td><td>" + esc(item.categoria) + "</td><td>" + formatoPesos(item.valor) + "</td><td>" + fecha({ creado: item.creado }) + '</td><td><div class="portal-actions"><button type="button" class="btn btn-outline btn-sm" data-editar-gasto="' + esc(item.id) + '">Editar</button><button type="button" class="btn btn-outline btn-sm btn-peligro" data-eliminar-gasto="' + esc(item.id) + '">Eliminar</button></div></td></tr>').join("") || fila(5, "Aún no hay movimientos registrados.");
  }
  /* Valor en pesos: se aceptan cifras cerradas o exactas, con o sin puntos de miles ("50.000", "1.250.000", "12345").
     Mientras se escribe se agregan los puntos para leer la cifra fácil. */
  const pesosDe = (texto) => Number(String(texto).replace(/\D/g, "")) || 0;
  const conPuntos = (n) => (n ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n) : "");
  const campoValor = $("#gasto-valor");
  campoValor.addEventListener("input", () => {
    const digitosAntes = campoValor.value.slice(0, campoValor.selectionStart).replace(/\D/g, "").length;
    campoValor.value = conPuntos(pesosDe(campoValor.value.slice(0, 17)));
    let pos = 0, vistos = 0; // deja el cursor después del mismo dígito
    while (pos < campoValor.value.length && vistos < digitosAntes) { if (/\d/.test(campoValor.value[pos])) vistos++; pos++; }
    campoValor.setSelectionRange(pos, pos);
    campoValor.setCustomValidity("");
  });
  function editarGasto(gasto) {
    const form = $("#form-gasto");
    form.elements.id.value = gasto ? gasto.id : "";
    form.elements.concepto.value = gasto?.concepto || ""; form.elements.categoria.value = gasto?.categoria || "Materiales";
    campoValor.value = gasto ? conPuntos(Number(gasto.valor)) : "";
    $("#gasto-guardar").textContent = gasto ? "Guardar cambios" : "Registrar gasto";
    $("#gasto-cancelar").hidden = !gasto;
    if (gasto) form.elements.concepto.focus();
  }
  $("#gasto-cancelar").addEventListener("click", () => editarGasto(null));
  $("#tb-gastos").addEventListener("click", async (event) => {
    const editar = event.target.closest("[data-editar-gasto]"), borrar = event.target.closest("[data-eliminar-gasto]");
    if (editar) { editarGasto(D.gastos().find((g) => g.id === editar.dataset.editarGasto)); return; }
    if (!borrar) return;
    const gasto = D.gastos().find((g) => g.id === borrar.dataset.eliminarGasto); if (!gasto) return;
    if (!confirm("¿Eliminar el gasto «" + gasto.concepto + "» por " + formatoPesos(gasto.valor) + "? Esta acción no se puede deshacer.")) return;
    if (!(await intentar(() => D.eliminarGasto(gasto.id), borrar))) return;
    if ($("#form-gasto").elements.id.value === gasto.id) editarGasto(null);
    pintarGastos(); toast("Gasto eliminado");
  });
  $("#form-gasto").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget, valor = pesosDe(campoValor.value);
    campoValor.setCustomValidity(campoValor.value && !(valor > 0 && valor <= 1000000000) ? "Escribe un valor entre $1 y $1.000.000.000." : "");
    if (!form.reportValidity()) return;
    const id = form.elements.id.value;
    const gasto = { concepto: form.elements.concepto.value.trim(), categoria: form.elements.categoria.value, valor };
    if (!(await intentar(() => (id ? D.actualizarGasto(id, gasto) : D.registrarGasto(gasto)), form.querySelector("[type=submit]")))) return;
    form.reset(); editarGasto(null); pintarGastos();
    toast(id ? "Gasto actualizado" : API ? "Gasto registrado" : "Gasto registrado en esta demostración");
  });
  pintarGastos();
  $("#area-tareas").addEventListener("click", (event) => { const button = event.target.closest("[data-open-section]"); if (button && allowed.has(button.dataset.openSection)) abrirSeccion(button.dataset.openSection); });
  $$(".panel-link").forEach((button) => { if (button.dataset.seccion === "area") button.querySelector(".lbl").textContent = perfil.area; });
  $("#btn-salir").addEventListener("click", () => { localStorage.removeItem("tc_sesion_demo"); location.href = "login.html"; });
  $$("[data-cerrar]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  $("#btn-nuevo-curso").hidden = !["Gerente", "Director(a) académico(a)", "Director(a) de tecnología"].includes(s.puesto);
  const puedeEditarCursos = ["Gerente", "Director(a) académico(a)", "Director(a) de tecnología"].includes(s.puesto);
  function abrirFormularioCurso(course = null) {
    if (!puedeEditarCursos) return;
    const form = $("#form-curso"); form.reset();
    form.elements.area.disabled = Boolean(perfil.courseArea);
    form.elements.id.value = course?.id || "";
    form.elements.titulo.value = course?.titulo || "";
    form.elements.area.value = course?.area || (perfil.courseArea || "Software");
    form.elements.nivel.value = course?.nivel || "Básico";
    form.elements.duracion.value = course?.duracion || "";
    form.elements.modalidad.value = course?.modalidad || "Virtual";
    form.elements.fase.value = course?.fase || "Próximamente";
    form.elements.instructor.value = course?.instructor || "";
    form.elements.edad_minima.value = course?.edadMinima ?? 14;
    form.elements.descripcion.value = course?.descripcion || "";
    form.elements.objetivo.value = course?.objetivo || "";
    // Si los módulos salen del temario se muestran tal cual; si se escribieron aparte, como "Nombre: tema, tema"
    const mods = course ? D.modulos(course) : [], derivados = mods.every((m, i) => m.titulo === (course?.temario || [])[i]);
    form.elements.temario.value = derivados ? (course?.temario || []).join("\n") : mods.map((m) => m.titulo + (m.temas.length ? ": " + (m.temasTexto || m.temas.join(", ")) : "")).join("\n");
    form.elements.proyecto.value = course?.proyecto || "";
    $("#mcf-titulo").textContent = course ? "Editar curso" : "Crear curso";
    $("#modal-curso-form").showModal();
  }
  $("#btn-nuevo-curso").addEventListener("click", () => abrirFormularioCurso());
  $("#form-curso").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!puedeEditarCursos) { toast("Tu cargo no tiene permiso para editar cursos.", "error"); return; }
    const form = event.currentTarget; if (!form.reportValidity()) return;
    const guardados = leer("tc_cursos_demo", []), id = Number(form.elements.id.value) || Math.max(0, ...CURSOS.map((course) => Number(course.id)), ...guardados.map((course) => Number(course.id))) + 1;
    const course = { id, titulo: form.elements.titulo.value.trim(), area: form.elements.area.value, nivel: form.elements.nivel.value, duracion: Number(form.elements.duracion.value), modalidad: form.elements.modalidad.value, fase: form.elements.fase.value, instructor: form.elements.instructor.value.trim(), edadMinima: Number(form.elements.edad_minima.value), descripcion: form.elements.descripcion.value.trim(), objetivo: form.elements.objetivo.value.trim(), temario: form.elements.temario.value.split("\n").map((line) => line.trim()).filter(Boolean), proyecto: form.elements.proyecto.value.trim() };
    // Cada línea es un módulo; se conservan las actividades del plan que ya tenía cada módulo
    const anteriores = D.modulos(CURSOS.find((c) => Number(c.id) === id));
    // Si el módulo conserva su título, también conserva la actividad y la evidencia del plan
    course.modulos = window.TCModulos({ temario: course.temario }).map((m, i) => { const a = anteriores[i]?.titulo === m.titulo ? anteriores[i] : null; return { titulo: m.titulo, temas: m.temas, temasTexto: m.temasTexto, actividades: a?.actividades || [], evidencia: a?.evidencia || "" }; });
    const previo = CURSOS.find((c) => Number(c.id) === id); if (previo?.guia) course.guia = previo.guia;
    if (!(await intentar(() => D.guardarCurso(course), form.querySelector("[type=submit]")))) return;
    if (!API) { toast("Curso guardado en el catálogo de demostración."); location.reload(); return; }
    $("#modal-curso-form").close(); refrescarCursos(); pintar(); toast("Curso guardado en la base de datos");
  });

  let cursosVisibles = [];
  function refrescarCursos() {
    cursosVisibles = CURSOS.filter((course) => !perfil.courseArea || course.area === perfil.courseArea);
    const elegido = $("#fi-curso").value;
    $("#fi-curso").innerHTML = '<option value="">Todos</option>' + cursosVisibles.map((course) => '<option value="' + course.id + '">' + esc(course.titulo) + "</option>").join("");
    $("#fi-curso").value = elegido;
  }
  const cursoTitulo = (id) => CURSOS.find((course) => course.id === Number(id))?.titulo || "Curso";
  const cursoEnArea = (id) => !perfil.courseArea || CURSOS.find((course) => course.id === Number(id))?.area === perfil.courseArea;
  const pill = (state) => '<span class="pill ' + (state === "aprobada" ? "pill-ok" : state === "rechazada" ? "pill-no" : "pill-pendiente") + '">' + esc(state) + "</span>";
  function pintar() {
    const insAll = leer("tc_inscripciones", []);
    const ins = insAll.map((item, index) => ({ ...item, n: index })).filter((item) => cursoEnArea(item.curso_id));
    const mensajes = leer("tc_mensajes", []);
    const sinLeer = mensajes.filter((message) => !message.leido).length;
    const pendientes = insAll.filter((item) => item.estado === "pendiente").length;
    const acts = D.actividades(), ents = D.entregas();
    $("#r-cursos").textContent = CURSOS.length;
    $("#r-cursos-sub").textContent = CURSOS.filter((c) => c.fase === "Lanzamiento").length + " con inscripciones abiertas";
    $("#r-estudiantes").textContent = new Set(insAll.filter((i) => i.estado === "aprobada").map((item) => item.correo)).size;
    $("#r-estudiantes-sub").textContent = new Set(insAll.map((i) => i.correo)).size + " personas han solicitado cupo";
    $("#r-pendientes").textContent = pendientes;
    $("#r-actividades").textContent = acts.length;
    $("#r-actividades-sub").textContent = ents.length + " entregas recibidas";
    $("#r-mensajes").textContent = sinLeer;
    $("#badge-mensajes").textContent = sinLeer; $("#badge-mensajes").hidden = !sinLeer || !allowed.has("mensajes");
    $("#badge-inscripciones").textContent = pendientes; $("#badge-inscripciones").hidden = !pendientes || !allowed.has("inscripciones");
    $("#resumen-cargando").hidden = true; $("#resumen-tarjetas").hidden = false;
    // Gráfica de barras de una sola serie: el valor siempre va escrito (no depende del color)
    const conteo = CURSOS.map((c) => ({ c, n: insAll.filter((i) => Number(i.curso_id) === Number(c.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
    const max = Math.max(1, ...conteo.map((x) => x.n));
    $("#grafica-cursos").innerHTML = conteo.map((x) => '<div class="barra-fila" title="' + esc(x.c.titulo) + ': ' + x.n + ' solicitudes"><span class="barra-etiqueta">' + esc(x.c.titulo) + '</span><span class="barra-pista"><span class="barra-relleno" style="--v:' + (x.n / max) + '"></span></span><span class="barra-valor">' + x.n + '</span></div>').join("") || '<p class="seccion-texto">Aún no hay solicitudes.</p>';
    $("#tabla-grafica").innerHTML = conteo.map((x) => "<tr><td>" + esc(x.c.titulo) + "</td><td>" + x.n + "</td></tr>").join("");
    const estados = [["aprobada", "Aprobadas", "check"], ["pendiente", "Pendientes", "reloj"], ["rechazada", "Rechazadas", "salir"]].map(([k, t, i]) => ({ k, t, i, n: insAll.filter((x) => x.estado === k).length }));
    const total = Math.max(1, insAll.length);
    $("#grafica-estados").innerHTML = '<div class="barra-apilada" role="img" aria-label="' + estados.map((e) => e.t + ": " + e.n).join(", ") + '">' + estados.filter((e) => e.n).map((e) => '<span class="seg seg-' + e.k + '" style="flex:' + e.n + '" title="' + e.t + ': ' + e.n + '"></span>').join("") + '</div><ul class="leyenda">' + estados.map((e) => '<li><span class="leyenda-marca seg-' + e.k + '"></span>' + TCIcono(e.i, 14) + " " + e.t + " <strong>" + e.n + "</strong> <small>(" + Math.round((e.n / total) * 100) + "%)</small></li>").join("") + "</ul>";
    const verNombres = allowed.has("inscripciones");
    $("#tb-ultimas").innerHTML = insAll.slice(-4).reverse().map((item) => '<li><span class="avatar avatar-sm">' + (verNombres ? esc(iniciales(item.nombre)) : "•") + "</span><span><strong>" + (verNombres ? esc(item.nombre) : "Estudiante") + "</strong><small>" + esc(cursoTitulo(item.curso_id)) + " · " + fecha(item) + "</small></span>" + pill(item.estado) + "</li>").join("") || "<li>Aún no hay solicitudes de inscripción.</li>";
    $("#tb-cursos").innerHTML = cursosVisibles.map((course) => '<tr><td>' + esc(course.titulo) + '<br><small>' + D.modulos(course).length + ' módulos</small></td><td>' + esc(course.area) + '</td><td>' + esc(course.nivel) + '</td><td>' + esc(course.modalidad) + '</td><td>' + esc(course.instructor) + '</td><td><span class="fichas-celda">' + (D.fichasDeCurso(course.id).map((f) => '<span class="ficha-chip" title="' + esc(f.jornada + " · " + f.estado) + '">' + esc(f.numero) + '</span>').join("") || "—") + '</span></td><td><span class="pill ' + (course.fase === "Lanzamiento" ? "pill-ok" : "") + '">' + esc(course.fase) + '</span></td><td><div class="portal-actions"><button type="button" class="btn btn-outline btn-sm" data-curso-detalle="' + course.id + '">Ver información</button>' + (puedeEditarCursos ? '<button type="button" class="btn btn-outline btn-sm" data-editar-curso="' + course.id + '">Editar</button>' : "") + '</div></td></tr>').join("") || fila(8, "No hay cursos para este departamento.");
    pintarFichas();
    const filter = Object.fromEntries(new FormData($("#filtros-inscripciones"))), query = (filter.q || "").toLowerCase();
    const visible = ins.filter((item) => (!filter.curso || item.curso_id == filter.curso) && (!filter.estado || item.estado === filter.estado) && (!query || (item.nombre + " " + item.correo + " " + D.fichaDeInscripcion(item)).toLowerCase().includes(query)));
    $("#tb-inscripciones").innerHTML = visible.map((item) => '<tr><td>' + esc(item.nombre) + '</td><td>' + esc(item.correo) + '</td><td>' + esc(cursoTitulo(item.curso_id)) + '</td><td>' + fecha(item) + '</td><td><span class="ficha-chip">' + esc(D.fichaDeInscripcion(item) || "—") + '</span></td><td><select data-n="' + item.n + '" aria-label="Estado de ' + esc(item.nombre) + '">' + ["pendiente", "aprobada", "rechazada"].map((state) => '<option ' + (state === item.estado ? "selected" : "") + ">" + state + "</option>").join("") + "</select></td><td><button type=\"button\" class=\"btn btn-outline btn-sm\" data-ficha=\"" + esc(item.correo) + "\">Ver datos</button></td></tr>").join("") || fila(7, "No hay solicitudes con esos filtros.");
    $("#tb-mensajes").innerHTML = mensajes.map((message, index) => '<tr><td>' + esc(message.nombre) + '</td><td>' + esc(message.correo) + '</td><td>' + esc(message.interes) + '</td><td>' + esc(message.asunto) + '</td><td>' + fecha(message) + '</td><td><span class="pill ' + (message.leido ? "" : "pill-pendiente") + '">' + (message.leido ? "leído" : "nuevo") + '</span></td><td><button class="btn btn-outline btn-sm" data-ver="' + index + '">Ver</button></td></tr>').reverse().join("") || fila(7, "Aún no hay mensajes.");
  }
  refrescarCursos();
  $("#filtros-inscripciones").addEventListener("input", pintar);
  $("#tb-inscripciones").addEventListener("change", async (event) => {
    const n = event.target.dataset.n; if (n === undefined) return;
    const ok = await intentar(() => D.cambiarEstadoInscripcion(Number(n), event.target.value), event.target);
    pintar(); if (ok) toast("Estado actualizado");
  });
  $("#tb-inscripciones").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-ficha]"); if (!button) return;
    let account = null;
    if (!(await intentar(async () => { account = await D.fichaEstudiante(button.dataset.ficha); }, button))) return;
    const set = (id, value) => { $(id).textContent = value || "No informado"; };
    if (!account) { toast("Este perfil de demostración no tiene datos registrados.", "error"); return; }
    set("#mf-nombre", account.nombre); set("#mf-correo", account.correo);
    set("#mf-documento", [account.tipo_documento, account.numero_documento].filter(Boolean).join(" · "));
    set("#mf-nacimiento", account.fecha_nacimiento); set("#mf-telefono", account.telefono);
    set("#mf-direccion", account.direccion); set("#mf-ciudad", [account.ciudad, account.region, account.pais].filter(Boolean).join(", "));
    set("#mf-estudios", account.ultimo_estudio); set("#mf-soportes", (account.documentos_disponibles || []).join(", "));
    set("#mf-acudiente", [account.acudiente_nombre, account.acudiente_telefono, account.acudiente_correo].filter(Boolean).join(" · "));
    $("#modal-ficha-estudiante").showModal();
  });
  $("#tb-cursos").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-editar-curso]");
    if (editButton) { const course = CURSOS.find((item) => Number(item.id) === Number(editButton.dataset.editarCurso)); if (course) abrirFormularioCurso(course); return; }
    const button = event.target.closest("[data-curso-detalle]"); if (!button) return;
    const course = CURSOS.find((item) => item.id === Number(button.dataset.cursoDetalle)); if (!course) return;
    $("#mcd-area").textContent = course.area; $("#mcd-titulo").textContent = course.titulo;
    $("#mcd-descripcion").textContent = course.descripcion; $("#mcd-nivel").textContent = course.nivel;
    $("#mcd-duracion").textContent = course.duracion + " semanas"; $("#mcd-modalidad").textContent = course.modalidad;
    $("#mcd-instructor").textContent = course.instructor; $("#mcd-objetivo").textContent = course.objetivo || "Por definir";
    $("#mcd-edad").textContent = Number(course.edadMinima ?? 14) > 0 ? Number(course.edadMinima ?? 14) + " años" : "Sin mínimo específico";
    $("#mcd-modulos").innerHTML = D.modulos(course).map((m) => '<details class="modulo"><summary><span class="modulo-num">' + m.numero + '</span><span class="modulo-titulo"><small>Módulo ' + m.numero + "</small>" + esc(m.titulo) + '</span><span class="modulo-cuenta">' + m.temas.length + ' temas</span></summary><div class="modulo-cuerpo"><ul class="modulo-temas">' + m.temas.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" + (m.actividades.length ? '<p class="modulo-sub">Actividad</p><ul class="modulo-acts">' + m.actividades.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : "") + (m.evidencia ? '<p class="modulo-evidencia"><strong>Evidencia:</strong> ' + esc(m.evidencia) + "</p>" : "") + "</div></details>").join("") || "<p>Sin módulos definidos.</p>";
    $("#mcd-fichas").innerHTML = D.fichasDeCurso(course.id).map((f) => '<div class="ficha-opcion"><span class="ficha-numero"><small>Ficha</small>' + esc(f.numero) + '</span><span class="ficha-datos"><strong>' + esc(f.jornada) + "</strong><small>Inicia " + esc(f.inicio || "por definir") + " · " + D.estudiantesDeCurso(course.id, f.numero).length + "/" + (Number(f.cupos) || "—") + ' inscritos</small></span><span class="tag">' + esc(f.estado) + "</span></div>").join("") || '<p class="modal-sub">Este curso aún no tiene fichas.</p>';
    $("#mcd-proyecto").textContent = course.proyecto || "Por definir"; $("#modal-curso-detalle").showModal();
  });
  /* ---------- Fichas (grupos) ---------- */
  function pintarFichas() {
    const q = ($("#ff-buscar")?.value || "").replace(/\D/g, ""), estado = $("#ff-estado")?.value || "";
    const lista = D.fichas().filter((f) => cursoEnArea(f.curso_id) && (!q || f.numero.includes(q)) && (!estado || f.estado === estado)).sort((a, b) => a.numero.localeCompare(b.numero));
    const clase = { "Inscripciones abiertas": "pill-ok", "En formación": "", "Próximamente": "pill-pendiente", "Finalizada": "pill-gris" };
    $("#tb-fichas").innerHTML = lista.map((f) => { const n = D.estudiantesDeCurso(f.curso_id, f.numero).length, pend = D.inscripciones().filter((i) => Number(i.curso_id) === Number(f.curso_id) && D.fichaDeInscripcion(i) === f.numero && i.estado === "pendiente").length; return '<tr><td><span class="ficha-chip">' + esc(f.numero) + "</span></td><td>" + esc(cursoTitulo(f.curso_id)) + "<br><small>" + esc(CURSOS.find((c) => Number(c.id) === Number(f.curso_id))?.instructor || "") + "</small></td><td>" + esc(f.jornada) + "</td><td>" + esc(f.inicio || "—") + "</td><td>" + n + "/" + (Number(f.cupos) || "—") + (pend ? "<br><small>" + pend + " en revisión</small>" : "") + '</td><td><span class="pill ' + (clase[f.estado] || "") + '">' + esc(f.estado) + "</span></td><td>" + (puedeEditarCursos ? '<button type="button" class="btn btn-outline btn-sm" data-editar-ficha="' + esc(f.numero) + '">Editar</button>' : "—") + "</td></tr>"; }).join("") || fila(7, q ? "No hay fichas con ese número." : "No hay fichas para tu área.");
  }
  $("#btn-nueva-ficha").hidden = !puedeEditarCursos;
  $("#ff-buscar").addEventListener("input", pintarFichas);
  $("#ff-estado").addEventListener("change", pintarFichas);
  function abrirFormularioFicha(f = null) {
    if (!puedeEditarCursos) return;
    const form = $("#form-ficha"); form.reset();
    form.elements.curso_id.innerHTML = cursosVisibles.map((c) => '<option value="' + c.id + '">' + esc(c.titulo) + "</option>").join("");
    form.elements.existente.value = f ? "1" : "";
    form.elements.numero.value = f?.numero || D.siguienteFicha(); form.elements.numero.readOnly = Boolean(f);
    form.elements.curso_id.value = f?.curso_id || cursosVisibles[0]?.id || "";
    form.elements.jornada.value = f?.jornada || "Mañana"; form.elements.inicio.value = f?.inicio || "";
    form.elements.cupos.value = f?.cupos || 25; form.elements.estado.value = f?.estado || "Inscripciones abiertas";
    $("#mff-titulo").textContent = f ? "Editar ficha " + f.numero : "Nueva ficha";
    $("#modal-ficha-form").showModal();
  }
  $("#btn-nueva-ficha").addEventListener("click", () => abrirFormularioFicha());
  $("#tb-fichas").addEventListener("click", (e) => { const b = e.target.closest("[data-editar-ficha]"); if (b) abrirFormularioFicha(D.ficha(b.dataset.editarFicha)); });
  $("#form-ficha").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const existente = Boolean(form.elements.existente.value), numero = form.elements.numero.value.trim();
    if (!existente && D.ficha(numero)) { toast("Ya existe una ficha con el número " + numero + ".", "error"); return; }
    const f = { numero, curso_id: Number(form.elements.curso_id.value), jornada: form.elements.jornada.value, inicio: form.elements.inicio.value, cupos: Number(form.elements.cupos.value), estado: form.elements.estado.value, existente };
    if (!(await intentar(() => D.guardarFicha(f), form.querySelector("[type=submit]")))) return;
    $("#modal-ficha-form").close(); pintar(); toast("Ficha " + numero + " guardada");
  });
  $("#tb-mensajes").addEventListener("click", (event) => {
    const n = event.target.dataset.ver; if (n === undefined) return;
    const message = leer("tc_mensajes", [])[n]; if (!message) return;
    if (!message.leido) Promise.resolve(D.marcarLeido(Number(n))).then(pintar, (error) => toast(error.message, "error"));
    $("#mm-asunto").textContent = message.asunto; $("#mm-remitente").textContent = message.nombre + " (" + message.correo + ")" + (message.telefono ? ", " + message.telefono : "");
    $("#mm-texto").textContent = message.mensaje; $("#mm-responder").href = "mailto:" + message.correo + "?subject=" + encodeURIComponent("Re: " + message.asunto);
    $("#modal-mensaje").showModal(); pintar();
  });
  /* Encuestas: resultados agrupados de lo que responden los estudiantes (js/encuestas-data.js), sin nombres */
  const encuestas = D.encuestas();
  function barrasResultado(etiquetas, conteo) {
    const mayor = Math.max(1, ...conteo);
    return '<div class="barras">' + etiquetas.map((t, i) => '<div class="barra-fila"><span class="barra-etiqueta" title="' + esc(t) + '">' + esc(t) + '</span><span class="barra-pista"><span class="barra-relleno" style="--v:' + (conteo[i] / mayor).toFixed(3) + '"></span></span><span class="barra-valor">' + conteo[i] + "</span></div>").join("") + "</div>";
  }
  function tarjetaEncuesta(e) {
    const r = D.resultadosEncuesta(e);
    const resultado = (p) => {
      if (p.tipo === "escala") return '<p class="resultado-promedio"><strong>' + (p.promedio == null ? "—" : p.promedio.toFixed(1)) + "</strong> / 5 <small>promedio</small></p>" + barrasResultado(["1", "2", "3", "4", "5"], p.conteo);
      if (p.tipo === "opciones") return barrasResultado(p.opciones, p.conteo);
      if (!p.textos.length) return '<p class="form-ayuda">Sin comentarios todavía.</p>';
      return '<ul class="resultado-textos" data-no-traducir>' + p.textos.slice(0, 3).map((t) => "<li>«" + esc(t) + "»</li>").join("") + "</ul>" + (p.textos.length > 3 ? '<p class="form-ayuda">Y ' + (p.textos.length - 3) + (p.textos.length === 4 ? " comentario más." : " comentarios más.") + "</p>" : "");
    };
    return '<article class="department-card encuesta-resultados"><div class="encuesta-cabecera"><span class="tag">' + esc(e.dept) + '</span><span class="pill ' + (r.total ? "pill-ok" : "") + '">' + r.total + (r.total === 1 ? " respuesta" : " respuestas") + "</span></div><h3>" + esc(e.titulo) + "</h3>" +
      r.preguntas.map((p, i) => '<div class="resultado"><p class="resultado-pregunta"><span class="pregunta-num">' + (i + 1) + ".</span> " + esc(p.texto) + "</p>" + (r.total ? resultado(p) : "") + "</div>").join("") +
      (r.total ? "" : '<p class="form-ayuda">Aún no hay respuestas. Los estudiantes encuentran esta encuesta en su portal.</p>') + "</article>";
  }
  function pintarEncuestas() {
    const dept = $("#filtro-encuestas").value;
    const grupos = [...new Set(encuestas.map((e) => e.dept))].filter((nombre) => !dept || nombre === dept);
    $("#encuestas-lista").innerHTML = grupos.map((nombre) => '<section class="survey-department"><h2>' + esc(nombre) + '</h2><div class="survey-grid">' + encuestas.filter((e) => e.dept === nombre).map(tarjetaEncuesta).join("") + "</div></section>").join("");
  }
  $("#filtro-encuestas").addEventListener("change", pintarEncuestas);
  const ia = leer("tc_ia", { tono: "Cercano, motivador y en español sencillo, con orgullo caribeño.", contexto: "" });
  $("#ia-tono").value = ia.tono; $("#ia-contexto").value = ia.contexto;
  $("#form-ia").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (await intentar(() => D.guardarIA({ tono: $("#ia-tono").value, contexto: $("#ia-contexto").value }), event.currentTarget.querySelector("[type=submit]"))) toast("Configuración del asistente guardada");
  });
  /* Actividad académica: lo que publican los docentes por curso (solo lectura para el equipo) */
  function pintarAcademico() {
    const lista = cursosVisibles.map((c) => {
      const est = D.estudiantesDeCurso(c.id), acts = D.actividadesDeCurso(c.id), ents = acts.flatMap((a) => D.entregasDeActividad(a.id));
      const notas = ents.map((e) => e.nota).filter((n) => typeof n === "number");
      return { c, est: est.length, acts: acts.length, ents: ents.length, esperadas: est.length * acts.length, prom: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null };
    });
    const totalActs = lista.reduce((a, x) => a + x.acts, 0), totalEnts = lista.reduce((a, x) => a + x.ents, 0), totalEsp = lista.reduce((a, x) => a + x.esperadas, 0);
    const docentesActivos = new Set(D.actividades().filter((a) => cursosVisibles.some((c) => c.id === Number(a.curso_id))).map((a) => a.docente)).size;
    $("#academico-kpis").innerHTML = [["portapapeles", "Actividades publicadas", totalActs], ["check", "Entregas recibidas", totalEnts], ["grafica", "Cumplimiento", (totalEsp ? Math.round((totalEnts / totalEsp) * 100) : 0) + "%"], ["pizarra", "Docentes activos", docentesActivos]].map(([i, t, v]) => '<div class="kpi"><dt>' + TCIcono(i, 18) + " " + t + "</dt><dd>" + v + "</dd></div>").join("");
    $("#tb-academico").innerHTML = lista.map((x) => { const pct = x.esperadas ? Math.round((x.ents / x.esperadas) * 100) : 0; return "<tr><td>" + esc(x.c.titulo) + "<br><small>" + esc(x.c.area) + " · " + esc(x.c.fase) + "</small></td><td>" + esc(x.c.instructor) + "</td><td>" + x.est + "</td><td>" + x.acts + '</td><td><div class="celda-progreso"><div class="progreso" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Entregas recibidas"><span style="width:' + pct + '%"></span></div><small>' + x.ents + "/" + x.esperadas + "</small></div></td><td>" + (x.prom == null ? "—" : '<span class="nota-chip ' + (x.prom >= 4 ? "nota-alta" : x.prom >= 3 ? "nota-media" : "nota-baja") + '">' + x.prom.toFixed(1) + "</span>") + "</td></tr>"; }).join("") || fila(6, "No hay cursos para tu área.");
    const recientes = D.actividades().filter((a) => cursosVisibles.some((c) => c.id === Number(a.curso_id))).sort((a, b) => (b.creado || "").localeCompare(a.creado || "")).slice(0, 5);
    $("#academico-recientes").innerHTML = recientes.map((a) => '<article class="tarjeta act-docente"><span class="tipo-icono" style="--tipo:' + (D.TIPOS[a.tipo]?.color || "#1ab0d6") + '">' + TCIcono(D.TIPOS[a.tipo]?.icono || "lapiz", 18) + '</span><div class="act-docente-info"><span class="act-curso">' + esc(cursoTitulo(a.curso_id)) + " · " + esc(a.tipo) + "</span><h3>" + esc(a.titulo) + '</h3><p class="act-vence">' + TCIcono("pizarra", 14) + " " + esc(a.docente) + " · " + esc(D.textoVence(a.fecha_limite)) + "</p></div></article>").join("") || '<p class="seccion-texto">Los docentes aún no han publicado actividades.</p>';
    if (SUPERVISA) pintarSupervision();
  }

  /* ---------- Supervisión de gerencia ----------
     El Gerente ve las actividades de todos los docentes y puede editarlas, retirarlas o corregir una nota
     (el servidor lo permite con PERMISOS.supervisarAcademico). La actividad sigue siendo del docente que la publicó. */
  const SUPERVISA = s.puesto === "Gerente";
  $("#supervision-academica").hidden = !SUPERVISA;
  const fechaCorta = (f) => (f ? new Date(String(f).slice(0, 10) + "T00:00:00").toLocaleDateString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—");
  function pintarSupervision() {
    const elegido = $("#sup-docente").value, q = $("#sup-buscar").value.trim().toLowerCase();
    const todas = D.actividades();
    $("#sup-docente").innerHTML = '<option value="">Todos</option>' + [...new Set(todas.map((a) => a.docente).filter(Boolean))].sort().map((d) => '<option' + (d === elegido ? " selected" : "") + ">" + esc(d) + "</option>").join("");
    const lista = todas.filter((a) => (!elegido || a.docente === elegido) && (!q || (a.titulo + " " + cursoTitulo(a.curso_id)).toLowerCase().includes(q)));
    $("#tb-supervision").innerHTML = lista.map((a) => {
      const ents = D.entregasDeActividad(a.id), revisadas = ents.filter((e) => e.estado === "revisada").length;
      return "<tr><td><strong>" + esc(a.titulo) + "</strong><br><small>" + esc(a.tipo) + (a.modulo ? " · Módulo " + Number(a.modulo) : "") + (a.ficha ? " · Ficha " + esc(a.ficha) : "") + "</small></td><td>" + esc(cursoTitulo(a.curso_id)) + "</td><td>" + esc(a.docente || "—") + "</td><td>" + fechaCorta(a.fecha_limite) + "</td><td>" + ents.length + (ents.length ? "<br><small>" + revisadas + " calificadas</small>" : "") + '</td><td><div class="portal-actions"><button type="button" class="btn btn-outline btn-sm" data-sup-entregas="' + esc(a.id) + '">Entregas</button><button type="button" class="btn btn-outline btn-sm" data-sup-editar="' + esc(a.id) + '">Editar</button><button type="button" class="btn btn-outline btn-sm btn-peligro" data-sup-eliminar="' + esc(a.id) + '">Retirar</button></div></td></tr>';
    }).join("") || fila(6, todas.length ? "No hay actividades con esos filtros." : "Los docentes aún no han publicado actividades.");
  }
  $("#sup-docente").addEventListener("change", pintarSupervision);
  $("#sup-buscar").addEventListener("input", pintarSupervision);
  const actividadPorId = (id) => D.actividades().find((a) => String(a.id) === String(id));
  $("#tb-supervision").addEventListener("click", async (event) => {
    const editar = event.target.closest("[data-sup-editar]"), borrar = event.target.closest("[data-sup-eliminar]"), ver = event.target.closest("[data-sup-entregas]");
    if (editar) {
      const a = actividadPorId(editar.dataset.supEditar); if (!a) return;
      const form = $("#form-actividad-sup"); form.reset();
      form.elements.id.value = a.id; form.elements.tipo.value = a.tipo; form.elements.fecha_limite.value = String(a.fecha_limite || "").slice(0, 10);
      form.elements.titulo.value = a.titulo; form.elements.objetivo.value = a.objetivo || ""; form.elements.descripcion.value = a.descripcion || ""; form.elements.recurso.value = a.recurso || "";
      $("#mas-origen").textContent = "Publicada por " + (a.docente || "un docente") + " en " + cursoTitulo(a.curso_id) + ". Los estudiantes verán los cambios de inmediato.";
      $("#modal-actividad-sup").showModal(); return;
    }
    if (borrar) {
      const a = actividadPorId(borrar.dataset.supEliminar); if (!a) return;
      const n = D.entregasDeActividad(a.id).length;
      if (!confirm("¿Retirar la actividad «" + a.titulo + "» de " + (a.docente || "este docente") + "?" + (n ? " También se borrarán sus " + n + " entregas." : "") + " Esta acción no se puede deshacer.")) return;
      if (await intentar(() => D.eliminarActividad(a.id), borrar)) { pintarAcademico(); pintar(); toast("Actividad retirada"); }
      return;
    }
    if (ver) abrirEntregasSup(ver.dataset.supEntregas);
  });
  $("#form-actividad-sup").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const a = actividadPorId(form.elements.id.value); if (!a) return;
    const cambios = { curso_id: Number(a.curso_id), modulo: Number(a.modulo) || 1, ficha: a.ficha || "", tipo: form.elements.tipo.value, titulo: form.elements.titulo.value.trim(), objetivo: form.elements.objetivo.value.trim(), descripcion: form.elements.descripcion.value.trim(), fecha_limite: form.elements.fecha_limite.value, recurso: form.elements.recurso.value.trim() };
    if (!(await intentar(() => D.actualizarActividad(a.id, cambios), form.querySelector("[type=submit]")))) return;
    $("#modal-actividad-sup").close(); pintarAcademico(); toast("Actividad actualizada");
  });
  function abrirEntregasSup(id) {
    const a = actividadPorId(id); if (!a) return;
    const ents = D.entregasDeActividad(a.id);
    $("#mes-titulo").textContent = a.titulo;
    $("#mes-sub").textContent = cursoTitulo(a.curso_id) + " · " + (a.docente || "Docente") + " · " + ents.length + (ents.length === 1 ? " entrega" : " entregas");
    $("#mes-lista").innerHTML = ents.map((e) => '<form class="tarjeta entrega-sup form" data-entrega="' + esc(e.id) + '" novalidate><div class="entrega-sup-cabecera"><strong>' + esc(e.nombre || "Estudiante") + "</strong><small>Entregada el " + fechaCorta(e.creado) + "</small></div>" +
      (e.respuesta ? '<p class="mensaje-texto" data-no-traducir>' + esc(e.respuesta) + "</p>" : "") + (e.enlace ? '<p><a href="' + esc(e.enlace) + '" target="_blank" rel="noopener noreferrer">Abrir el enlace de la entrega</a></p>' : "") +
      '<div class="fila-campos"><div class="campo"><label for="nota-' + esc(e.id) + '">Nota (1.0 a 5.0)</label><input id="nota-' + esc(e.id) + '" name="nota" type="number" min="1" max="5" step="0.1" required value="' + (typeof e.nota === "number" ? e.nota.toFixed(1) : "") + '"></div>' +
      '<div class="campo"><label for="com-' + esc(e.id) + '">Retroalimentación</label><textarea id="com-' + esc(e.id) + '" name="comentario" rows="2" required minlength="5" maxlength="800" data-no-traducir>' + esc(e.comentario || "") + "</textarea></div></div>" +
      '<button type="submit" class="btn btn-primary btn-sm">' + (e.estado === "revisada" ? "Corregir nota" : "Calificar") + "</button></form>").join("") || '<p class="seccion-texto">Todavía nadie ha entregado esta actividad.</p>';
    $("#mes-lista").dataset.actividad = a.id;
    $("#modal-entregas-sup").showModal();
  }
  $("#mes-lista").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.target.closest("[data-entrega]"); if (!form || !form.reportValidity()) return;
    const nota = Math.round(Number(form.elements.nota.value) * 10) / 10;
    if (!(await intentar(() => D.calificar(form.dataset.entrega, nota, form.elements.comentario.value.trim()), form.querySelector("[type=submit]")))) return;
    toast("Nota guardada"); pintarAcademico(); abrirEntregasSup($("#mes-lista").dataset.actividad);
  });

  /* ---------- Registro de seguridad ----------
     Lo arma el servidor (tabla eventos_seguridad). Las IP con 5 o más fallos en 24 horas se
     destacan arriba como posibles ataques de fuerza bruta. */
  const EVENTOS = {
    ingreso: ["Ingreso", "pill-ok"], ingreso_fallido: ["Intento fallido", "pill-pendiente"], bloqueo: ["Bloqueo", "pill-no"],
    clave_cambiada: ["Contraseña cambiada", ""], recuperacion_pedida: ["Pidió recuperar la contraseña", ""], clave_restablecida: ["Contraseña restablecida", ""],
    sesiones_cerradas: ["Cerró todas sus sesiones", ""], registro: ["Cuenta nueva", "pill-ok"],
    cuenta_creada: ["Cuenta creada", "pill-ok"], cuenta_eliminada: ["Cuenta eliminada", "pill-no"], cuenta_bloqueada: ["Cuenta bloqueada", "pill-pendiente"], cuenta_desbloqueada: ["Cuenta desbloqueada", "pill-ok"],
  };
  const fechaHora = (iso) => new Date(iso).toLocaleString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  async function pintarSeguridad() {
    const tabla = $("#tb-seguridad");
    if (!API) {
      $("#seguridad-kpis").innerHTML = "";
      tabla.innerHTML = fila(5, "El registro de seguridad lo guarda el servidor y esta es la versión de demostración, sin servidor conectado.");
      return;
    }
    tabla.innerHTML = fila(5, "Cargando…");
    try {
      const { eventos, resumen, sospechosas } = await TCApi.pedir("GET", "/seguridad/eventos?tipo=" + encodeURIComponent($("#seguridad-tipo").value));
      const n = (tipo) => resumen[tipo] || 0;
      $("#seguridad-kpis").innerHTML = [["check", "Ingresos (24 h)", n("ingreso")], ["reloj", "Intentos fallidos (24 h)", n("ingreso_fallido") + n("bloqueo")], ["escudo", "Bloqueos (24 h)", n("bloqueo")], ["usuarios", "Cuentas nuevas (24 h)", n("registro")]]
        .map(([i, t, v]) => '<div class="kpi"><dt>' + TCIcono(i, 18) + " " + t + "</dt><dd>" + v + "</dd></div>").join("");
      $("#seguridad-sospechosas").innerHTML = sospechosas.length
        ? '<div class="seguridad-aviso" role="status">' + TCIcono("escudo", 20) + "<div><strong>Conexiones con muchos intentos fallidos en las últimas 24 horas</strong><ul>" +
          sospechosas.map((x) => "<li>" + esc(x.ip) + ": " + x.fallos + " fallos contra " + x.cuentas + " cuenta(s), el último " + fechaHora(x.ultimo) + "</li>").join("") +
          "</ul><small>El servidor ya las frena: tras 10 fallos una conexión queda bloqueada 15 minutos, y tras 8 fallos también la cuenta atacada.</small></div></div>"
        : "";
      const badge = $("#badge-seguridad"); badge.textContent = sospechosas.length; badge.hidden = !sospechosas.length;
      tabla.innerHTML = eventos.map((e) => {
        const [texto, clase] = EVENTOS[e.tipo] || [e.tipo, ""];
        return "<tr><td>" + fechaHora(e.creado) + '</td><td><span class="pill ' + clase + '">' + esc(texto) + "</span></td><td>" + (e.nombre ? esc(e.nombre) + "<br>" : "") + "<small>" + esc(e.correo || "—") +
          "</small></td><td>" + esc(e.ip || "—") + '<div class="celda-agente" title="' + esc(e.agente || "") + '">' + esc(e.agente || "") + "</div></td><td>" + esc(e.detalle || "") + "</td></tr>";
      }).join("") || fila(5, "Todavía no hay eventos de este tipo.");
    } catch (error) {
      tabla.innerHTML = fila(5, esc(error.message));
    }
  }
  $("#seguridad-tipo").addEventListener("change", pintarSeguridad);
  $("#seguridad-actualizar").addEventListener("click", pintarSeguridad);

  /* ---------- Cuentas ----------
     Gerente: crea cuentas administrativas (contraseña temporal que se muestra una vez) y las elimina.
     Gerente y Coordinación de admisiones: bloquean estudiantes inactivos y los desbloquean cuando quieran.
     Todo lo valida el servidor (backend/src/rutas/cuentas.js). */
  let equipo = [], estudiantesCuentas = [], diasMinimos = 30;
  const fechaLarga = (iso) => new Date(iso).toLocaleDateString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short", year: "numeric" });
  $("#ce-cargo").innerHTML = Object.keys(perfiles).map((cargo) => "<option>" + esc(cargo) + "</option>").join("");
  async function pintarCuentas() {
    $("#cuentas-intro").textContent = gestionaEquipo
      ? "Crea y elimina las cuentas del equipo administrativo, y bloquea o desbloquea las cuentas de estudiantes inactivos."
      : "Bloquea las cuentas de estudiantes que llevan tiempo sin ingresar y desbloquéalas cuando lo necesiten.";
    $("#cuentas-demo").hidden = API;
    $("#cuentas-equipo").hidden = !API || !gestionaEquipo;
    $("#cuentas-estudiantes").hidden = !API || !gestionaEstudiantes;
    $("#cuenta-creada").hidden = true; $("#cuenta-creada-clave").textContent = ""; // la contraseña temporal no se vuelve a mostrar
    if (!API) return;
    await Promise.all([gestionaEquipo && cargarEquipo(), gestionaEstudiantes && cargarEstudiantesCuentas()]);
  }

  async function cargarEquipo() {
    const tabla = $("#tb-equipo"); tabla.innerHTML = fila(5, "Cargando…");
    try { equipo = await TCApi.pedir("GET", "/cuentas/equipo"); }
    catch (error) { tabla.innerHTML = fila(5, esc(error.message)); return; }
    tabla.innerHTML = equipo.map((u) => "<tr><td><strong>" + esc(u.nombre) + "</strong>" + (u.yo ? ' <span class="tag">Tú</span>' : "") + "<br><small>" + esc(u.correo) + "</small></td><td>" +
      (u.puesto ? esc(u.puesto) : '<span class="form-ayuda">Cuenta de prueba: elige el cargo al ingresar</span>') + "</td><td>" + (u.ultimo_ingreso ? fechaLarga(u.ultimo_ingreso) : "Nunca") + '</td><td><span class="pill ' + (u.activo ? "pill-ok" : "pill-no") + '">' + (u.activo ? "Activa" : "Desactivada") + "</span></td><td>" +
      (u.yo ? "" : '<button type="button" class="btn btn-outline btn-sm btn-peligro" data-eliminar-cuenta="' + u.id + '">Eliminar</button>') + "</td></tr>").join("") || fila(5, "No hay cuentas administrativas.");
  }
  $("#form-cuenta-equipo").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget; if (!form.reportValidity()) return;
    const datos = { nombre: form.elements.nombre.value.trim(), correo: form.elements.correo.value.trim().toLowerCase(), puesto: form.elements.puesto.value };
    let creada = null;
    if (!(await intentar(async () => { creada = await TCApi.pedir("POST", "/cuentas/equipo", datos); }, form.querySelector("[type=submit]")))) return;
    form.reset();
    $("#cuenta-creada-titulo").textContent = "Cuenta creada para " + creada.cuenta.nombre;
    $("#cuenta-creada-clave").textContent = creada.clave;
    $("#cuenta-creada-ayuda").textContent = "Para entrar: " + creada.cuenta.correo + ", cuenta «Administrativo» y cargo «" + creada.cuenta.puesto + "». Compártela en privado y pide que la cambie en «Mi cuenta».";
    $("#cuenta-creada").hidden = false;
    toast("Cuenta creada"); cargarEquipo();
  });
  $("#cuenta-creada-copiar").addEventListener("click", () => {
    navigator.clipboard?.writeText($("#cuenta-creada-clave").textContent).then(() => toast("Contraseña copiada"), () => toast("No se pudo copiar: selecciónala y cópiala a mano.", "error"));
  });
  $("#tb-equipo").addEventListener("click", async (event) => {
    const boton = event.target.closest("[data-eliminar-cuenta]"); if (!boton) return;
    const u = equipo.find((x) => String(x.id) === boton.dataset.eliminarCuenta); if (!u) return;
    if (!confirm("¿Eliminar la cuenta de " + u.nombre + " (" + (u.puesto || "cuenta de prueba") + ")? Ya no podrá ingresar al panel. Esta acción no se puede deshacer.")) return;
    if (await intentar(() => TCApi.pedir("DELETE", "/cuentas/equipo/" + u.id), boton)) { toast("Cuenta eliminada"); cargarEquipo(); }
  });

  async function cargarEstudiantesCuentas() {
    $("#tb-estudiantes-cuentas").innerHTML = fila(5, "Cargando…");
    try { const r = await TCApi.pedir("GET", "/cuentas/estudiantes"); estudiantesCuentas = r.estudiantes; diasMinimos = r.diasMinimos; }
    catch (error) { $("#tb-estudiantes-cuentas").innerHTML = fila(5, esc(error.message)); return; }
    pintarEstudiantesCuentas();
  }
  // La inactividad se cuenta desde lo más reciente: el último ingreso, la creación de la cuenta o el último desbloqueo
  const tiempoSinUso = (u) => {
    const n = u.dias_sin_uso, cuando = n <= 0 ? "hoy" : "hace " + n + (n === 1 ? " día" : " días");
    return u.desde === "desbloqueo" ? "Desbloqueada " + cuando : u.desde === "creacion" ? "Creada " + cuando + ", sin ingresar" : n <= 0 ? "Usada hoy" : "Sin uso desde " + cuando;
  };
  function pintarEstudiantesCuentas() {
    const dias = Number($("#ce-dias").value), mostrar = $("#ce-mostrar").value, q = $("#ce-buscar").value.trim().toLowerCase();
    const inactiva = (u) => u.activo && u.dias_sin_uso >= dias;
    const inactivas = estudiantesCuentas.filter(inactiva), bloqueadas = estudiantesCuentas.filter((u) => !u.activo);
    $("#estudiantes-kpis").innerHTML = [["usuarios", "Estudiantes", estudiantesCuentas.length], ["reloj", "Inactivas (" + dias + "+ días)", inactivas.length], ["escudo", "Bloqueadas", bloqueadas.length]]
      .map(([i, t, v]) => '<div class="kpi"><dt>' + TCIcono(i, 18) + " " + t + "</dt><dd>" + v + "</dd></div>").join("");
    const todas = $("#ce-bloquear-todas");
    todas.disabled = !inactivas.length;
    todas.textContent = inactivas.length ? "Bloquear " + inactivas.length + (inactivas.length === 1 ? " cuenta inactiva" : " cuentas inactivas") : "Sin cuentas inactivas";
    const lista = estudiantesCuentas.filter((u) => (mostrar === "inactivas" ? inactiva(u) : mostrar === "bloqueadas" ? !u.activo : mostrar === "activas" ? u.activo : true) && (!q || (u.nombre + " " + u.correo).toLowerCase().includes(q)));
    $("#tb-estudiantes-cuentas").innerHTML = lista.map((u) => {
      const estado = !u.activo ? '<span class="pill pill-no">Bloqueada</span>' + (u.bloqueado_en ? "<br><small>" + esc(fechaLarga(u.bloqueado_en)) + (u.bloqueado_por ? " · " + esc(u.bloqueado_por) : "") + "</small>" : "")
        : inactiva(u) ? '<span class="pill pill-pendiente">Inactiva</span>' : '<span class="pill pill-ok">Activa</span>';
      const accion = !u.activo ? '<button type="button" class="btn btn-primary btn-sm" data-desbloquear="' + u.id + '">Desbloquear</button>'
        : u.dias_sin_uso >= diasMinimos ? '<button type="button" class="btn btn-outline btn-sm btn-peligro" data-bloquear="' + u.id + '">Bloquear</button>' : "";
      return "<tr><td><strong>" + esc(u.nombre) + "</strong><br><small>" + esc(u.correo) + "</small></td><td>" + (u.ultimo_ingreso ? fechaLarga(u.ultimo_ingreso) : "Nunca ha ingresado") +
        "<br><small>" + tiempoSinUso(u) + "</small></td><td>" + u.cursos + "</td><td>" + estado + "</td><td>" + accion + "</td></tr>";
    }).join("") || fila(5, mostrar === "inactivas" ? "No hay cuentas sin ingresar hace " + dias + " días o más." : mostrar === "bloqueadas" ? "No hay cuentas bloqueadas." : "No hay estudiantes con esos filtros.");
  }
  ["#ce-mostrar", "#ce-dias"].forEach((id) => $(id).addEventListener("change", pintarEstudiantesCuentas));
  $("#ce-buscar").addEventListener("input", pintarEstudiantesCuentas);
  $("#tb-estudiantes-cuentas").addEventListener("click", async (event) => {
    const bloquearBtn = event.target.closest("[data-bloquear]"), desbloquearBtn = event.target.closest("[data-desbloquear]");
    const u = estudiantesCuentas.find((x) => String(x.id) === (bloquearBtn?.dataset.bloquear || desbloquearBtn?.dataset.desbloquear)); if (!u) return;
    if (bloquearBtn) {
      if (!confirm("¿Bloquear la cuenta de " + u.nombre + "? No podrá ingresar hasta que la desbloquees; sus cursos y entregas se conservan.")) return;
      if (await intentar(() => TCApi.pedir("POST", "/cuentas/estudiantes/" + u.id + "/bloquear"), bloquearBtn)) { toast("Cuenta bloqueada"); cargarEstudiantesCuentas(); }
    } else if (await intentar(() => TCApi.pedir("POST", "/cuentas/estudiantes/" + u.id + "/desbloquear"), desbloquearBtn)) { toast("Cuenta desbloqueada"); cargarEstudiantesCuentas(); }
  });
  $("#ce-bloquear-todas").addEventListener("click", async (event) => {
    const dias = Number($("#ce-dias").value), n = estudiantesCuentas.filter((u) => u.activo && u.dias_sin_uso >= dias).length;
    if (!n || !confirm("¿Bloquear " + n + (n === 1 ? " cuenta que no ingresa" : " cuentas que no ingresan") + " hace " + dias + " días o más? Cada estudiante recibirá un correo y podrás desbloquearlas cuando quieras.")) return;
    let r = null;
    if (await intentar(async () => { r = await TCApi.pedir("POST", "/cuentas/estudiantes/bloquear-inactivas", { dias }); }, event.currentTarget)) {
      toast(r.bloqueadas === 1 ? "1 cuenta bloqueada" : r.bloqueadas + " cuentas bloqueadas"); cargarEstudiantesCuentas();
    }
  });

  /* Guía de bienvenida del panel */
  const GUIA = [
    { sel: "#panel-nav", titulo: "Tu menú por cargo", texto: "Solo ves las secciones que corresponden a tu cargo. El número rojo indica pendientes." },
    { sel: "[data-guia=kpis]", titulo: "Indicadores", texto: "Cifras agregadas de la plataforma: cursos, estudiantes, solicitudes y actividad docente." },
    { sel: "[data-guia=accesos]", titulo: "Accesos rápidos", texto: "Las tareas principales de tu cargo, a un clic." },
    { sel: "[data-guia=grafica]", titulo: "Demanda de cursos", texto: "Qué cursos piden más. Puedes verlo también como tabla." },
    { sel: ".tc-chat-launch", titulo: "Asistente de gestión", texto: "Pregúntale “Resumen de la plataforma” o “¿Qué hace mi cargo?”." },
  ];
  $("#btn-guia").addEventListener("click", () => { abrirSeccion("resumen"); setTimeout(() => TCGuia.iniciar(GUIA, null, true), 300); });
  pintar(); pintarEncuestas();
  if (API && allowed.has("seguridad")) pintarSeguridad(); // para mostrar en el menú si hay conexiones sospechosas
  const hash = location.hash.slice(1);
  abrirSeccion(allowed.has(hash) ? hash : perfil.start);
  setTimeout(() => TCGuia.iniciar(GUIA, "tc_guia_admin"), 900);
});
