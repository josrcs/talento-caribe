/* ==========================================================
   portal.js - Espacio de estudiantes y docentes
   Estudiante: inicio didáctico, mis cursos, actividades (entregar),
               logros y tutor IA.
   Docente:    inicio, mis cursos, actividades (crear/editar),
               entregas (calificar), estudiantes y copiloto IA.
   Los datos vienen de TCDatos (datos.js).
   ========================================================== */
(() => {
  const { $, $$, esc, validar, toast, sesion } = TCUtil;
  const D = TCDatos;
  const s = sesion();
  if (!s) { location.href = "admin/login.html"; return; }
  if (s.rol === "administrativo") { location.replace("admin/panel.html"); return; }
  const rol = s.rol === "docente" ? "docente" : "estudiante";
  const main = $("#app-main"), nav = $("#app-nav");
  const ico = (n, t) => TCIcono(n, t);
  const iniciales = (n) => String(n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const fecha = (iso) => iso ? new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(window.TCIdioma?.locale || "es-CO", { day: "numeric", month: "short" }) : "—";
  const nota = (n) => (typeof n === "number" ? n.toFixed(1) : "—");
  const colorNota = (n) => (n == null ? "" : n >= 4 ? "nota-alta" : n >= 3 ? "nota-media" : "nota-baja");
  const ESTADOS = { pendiente: ["Pendiente", "pill-pendiente"], vencida: ["Vencida", "pill-no"], entregada: ["Entregada", ""], revisada: ["Calificada", "pill-ok"] };
  const pill = (estado) => `<span class="pill ${ESTADOS[estado]?.[1] || ""}">${ESTADOS[estado]?.[0] || estado}</span>`;
  const tipoIcono = (tipo) => `<span class="tipo-icono" style="--tipo:${D.TIPOS[tipo]?.color || "#1ab0d6"}" title="${esc(tipo)}">${ico(D.TIPOS[tipo]?.icono || "lapiz", 18)}</span>`;
  const barra = (pct, etiqueta) => `<div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(etiqueta || "Progreso")}"><span style="width:${pct}%"></span></div>`;
  const vacio = (icono, titulo, texto, accion = "") => `<div class="vacio">${ico(icono, 30)}<h3>${titulo}</h3><p>${texto}</p>${accion}</div>`;
  /* Fichas y módulos */
  const textoFicha = (n) => (n ? `Ficha ${esc(n)}` : "Todas las fichas");
  const ESTADO_MODULO = { completo: ["Completo", "pill-ok"], "en-curso": ["En curso", ""], "sin-iniciar": ["Sin iniciar", "pill-pendiente"], "sin-actividades": ["Sin actividades", "pill-gris"] };
  const pillModulo = (estado) => `<span class="pill ${ESTADO_MODULO[estado][1]}">${ESTADO_MODULO[estado][0]}</span>`;
  const etiquetaModulo = (a) => (a.modulo ? ` · Módulo ${Number(a.modulo)}` : "");
  /* Guía de clase del módulo (docentes): dos sesiones de 90 minutos del plan de cursos */
  function guiaClase(c, m) {
    if (!window.TCSesiones) return "";
    const g = c.guia || {};
    return `<details class="guia-clase"><summary>${ico("pizarra", 16)} Guía de clase · 2 sesiones de 90 min</summary>
      <div class="guia-clase-cuerpo">
        ${window.TCSesiones(c, m).map((ses) => `<div class="sesion"><h4>${esc(ses.nombre)}</h4><ol class="sesion-pasos">${ses.pasos.map(([n, min, t]) => `<li><span class="sesion-min">${min}′</span><div><strong>${esc(n)}</strong><p>${esc(t)}</p></div></li>`).join("")}</ol></div>`).join("")}
        ${g.modalidad ? `<p class="guia-nota">${ico("brujula", 15)} <span>${esc(g.modalidad)}</span></p>` : ""}
        ${g.nota ? `<p class="guia-nota guia-nota-alerta">${ico("escudo", 15)} <span>${esc(g.nota)}</span></p>` : ""}
        <button type="button" class="btn btn-primary btn-sm" data-plan-actividad="${c.id}" data-modulo="${m.numero}">${ico("mas", 15)} Publicar la actividad de este módulo</button>
      </div>
    </details>`;
  }
  /* Actividad lista para publicar a partir del plan del módulo */
  function actividadDelPlan(c, m) {
    const g = c.guia || {}, acto = m.actividades[0] || "";
    return {
      tipo: m.numero === D.modulos(c).length ? "Proyecto" : "Práctica",
      titulo: `Módulo ${m.numero}: ${m.titulo}`.slice(0, 90),
      objetivo: `Comprender y aplicar ${(m.temasTexto || m.temas.join(", ")).replace(/^./, (x) => x.toLowerCase())}.`.slice(0, 160),
      descripcion: [`1. ${acto}`, g.reto ? `2. Reto: ${g.reto}` : "", m.evidencia ? `${g.reto ? 3 : 2}. Entrega: ${m.evidencia}` : ""].filter(Boolean).join("\n").slice(0, 2000),
    };
  }

  /* Avance por módulo de un estudiante (lo usan el estudiante y el docente) */
  function listaModulos(correo, cursoId, { docente = false } = {}) {
    return `<div class="modulos-avance">${D.progresoModulos(correo, cursoId).map((m) => `<details class="mod-av mod-${m.estado}">
      <summary><span class="mod-av-num" style="--pct:${m.porcentaje}"><span>${m.numero}</span></span><span class="mod-av-info"><strong>${esc(m.titulo)}</strong><small>${m.total ? `${m.hechas}/${m.total} ${m.total === 1 ? "actividad" : "actividades"}${m.promedio != null ? ` · promedio <b class="${colorNota(m.promedio)}">${m.promedio.toFixed(1)}</b>` : ""}${m.vencidas ? ` · <b class="nota-baja">${m.vencidas} sin entregar</b>` : ""}` : "Aún sin actividades publicadas"}</small>${m.total ? barra(m.porcentaje, "Avance del módulo " + m.numero) : ""}</span>${pillModulo(m.estado)}</summary>
      <div class="mod-av-cuerpo">
        ${m.temas.length ? `<p class="mod-av-sub">Temas</p><ul class="temas-chips">${m.temas.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${m.actividades.length ? `<p class="mod-av-sub">Lo que harás en este módulo</p><ul class="modulo-acts">${m.actividades.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${m.evidencia ? `<p class="modulo-evidencia"><strong>Evidencia del módulo:</strong> ${esc(m.evidencia)}</p>` : ""}
        <p class="mod-av-sub">Actividades publicadas</p>
        ${m.actividades_publicadas.length ? `<ul class="lista-filas mod-av-acts">${m.actividades_publicadas.map((a) => { const e = D.entregaDe(a.id, correo), est = D.estadoPara(a, correo); return `<li>${tipoIcono(a.tipo)}<span><strong>${esc(a.titulo)}</strong><small>${fecha(a.fecha_limite)} · ${e ? "entregada el " + fecha(e.creado) : D.textoVence(a.fecha_limite)}</small></span>${e?.nota != null ? `<span class="nota-chip ${colorNota(e.nota)}">${nota(e.nota)}</span>` : ""}${pill(est)}${docente ? (e && e.estado === "entregada" ? `<button type="button" class="btn btn-primary btn-sm" data-calificar="${esc(e.id)}">Calificar</button>` : e ? `<button type="button" class="btn btn-outline btn-sm" data-calificar="${esc(e.id)}">Ver</button>` : "") : `<button type="button" class="btn btn-outline btn-sm" data-abrir-actividad="${esc(a.id)}">Abrir</button>`}</li>`; }).join("")}</ul>` : `<p class="form-ayuda">${docente ? "Todavía no has publicado actividades en este módulo." : "Tu docente aún no ha publicado actividades en este módulo."}</p>`}
      </div>
    </details>`).join("") || "<p>Este curso todavía no tiene módulos.</p>"}</div>`;
  }

  /* ---------- Cabecera y sesión ---------- */
  $("#portal-usuario").textContent = s.nombre || "Mi espacio";
  $("#usuario-rol").textContent = rol === "docente" ? "Docente · " + (s.especialidad || "") : "Estudiante";
  $("#usuario-avatar").textContent = iniciales(s.nombre);
  $$("[data-icono]").forEach((el) => (el.innerHTML = ico(el.dataset.icono, 16)));
  $("#portal-salir").addEventListener("click", () => { localStorage.removeItem("tc_sesion_demo"); location.href = "admin/login.html"; });
  $("#app-menu-btn").addEventListener("click", (e) => { const on = e.currentTarget.getAttribute("aria-expanded") !== "true"; e.currentTarget.setAttribute("aria-expanded", on); nav.classList.toggle("is-abierto", on); });
  $$("[data-cerrar]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  /* ---------- Navegación por secciones ---------- */
  const SECCIONES = rol === "estudiante"
    ? [["inicio", "casa", "Inicio"], ["cursos", "libro", "Mis cursos"], ["actividades", "portapapeles", "Actividades"], ["logros", "trofeo", "Logros"], ["asistente", "chat", "Tutor IA"]]
    : [["inicio", "casa", "Inicio"], ["cursos", "libro", "Mis cursos"], ["actividades", "lapiz", "Actividades"], ["entregas", "check", "Entregas"], ["estudiantes", "usuarios", "Seguimiento"], ["asistente", "chat", "Copiloto IA"]];
  const RENDER = {};
  let actual = "inicio", filtroCurso = "", filtroFicha = "";

  function pintarNav() {
    const badge = (id) => {
      if (rol === "estudiante" && id === "actividades") return pendientesEstudiante().length;
      if (rol === "docente" && id === "entregas") return porRevisar().length;
      return 0;
    };
    nav.innerHTML = `<div class="app-nav-rol"><span class="eyebrow">${rol === "docente" ? "Espacio docente" : "Espacio estudiante"}</span></div>` +
      SECCIONES.map(([id, icono, texto]) => { const n = badge(id); return `<button type="button" class="app-link ${id === actual ? "activo" : ""}" data-seccion="${id}" ${id === actual ? 'aria-current="page"' : ""}>${ico(icono, 19)}<span>${texto}</span>${n ? `<span class="badge">${n}</span>` : ""}</button>`; }).join("") +
      `<div class="app-nav-tip">${ico("foco", 18)}<p>${rol === "docente" ? "Tip: las actividades con objetivo claro reciben mejores entregas." : "Tip: entregar a tiempo suma a tus logros."}</p></div>`;
  }
  nav.addEventListener("click", (e) => { const b = e.target.closest("[data-seccion]"); if (b) navegar(b.dataset.seccion); });
  function navegar(id, opciones = {}) {
    if (!RENDER[id]) return false;
    actual = id; if (opciones.curso !== undefined) filtroCurso = String(opciones.curso);
    if (opciones.ficha !== undefined) filtroFicha = String(opciones.ficha);
    pintarNav();
    main.innerHTML = `<section class="app-seccion cambia" id="sec-${id}" aria-label="${esc(SECCIONES.find((x) => x[0] === id)?.[2] || "")}"></section>`;
    RENDER[id]($("#sec-" + id));
    nav.classList.remove("is-abierto"); $("#app-menu-btn").setAttribute("aria-expanded", "false");
    history.replaceState(null, "", "#" + id);
    if (!opciones.sinFoco) main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }
  window.TCNavegar = navegar;
  main.addEventListener("click", (e) => {
    const ir = e.target.closest("[data-ir]"); if (ir) { navegar(ir.dataset.ir, { curso: ir.dataset.curso ?? undefined, ficha: ir.dataset.ficha ?? undefined }); return; }
    const pregunta = e.target.closest("[data-preguntar-ia]"); if (pregunta) window.TCAbrirAsistente?.(pregunta.dataset.preguntarIa);
  });

  const encabezado = (eyebrow, titulo, texto, extra = "") => `<div class="seccion-cabecera"><div><span class="eyebrow">${eyebrow}</span><h1>${titulo}</h1>${texto ? `<p class="seccion-texto">${texto}</p>` : ""}</div>${extra}</div>`;

  /* ==========================================================
     ESTUDIANTE
     ========================================================== */
  const misActividades = () => D.actividadesDeEstudiante(s.correo).map((a) => ({ ...a, estado: D.estadoPara(a, s.correo), entrega: D.entregaDe(a.id, s.correo), curso: D.curso(a.curso_id) }));
  const pendientesEstudiante = () => misActividades().filter((a) => a.estado === "pendiente" || a.estado === "vencida");

  function tarjetaActividad(a) {
    const vence = D.diasRestantes(a.fecha_limite);
    const urgente = a.estado === "pendiente" && vence <= 2;
    return `<article class="act-card ${a.estado === "revisada" ? "is-complete" : ""}">
      <div class="act-top">${tipoIcono(a.tipo)}<div><span class="act-curso">${esc(a.curso?.titulo || "")}${etiquetaModulo(a)}</span><h3>${esc(a.titulo)}</h3></div></div>
      <p>${esc(a.objetivo || a.descripcion.split("\n")[0])}</p>
      <div class="act-meta">${pill(a.estado)}<span class="act-vence ${urgente ? "is-urgente" : ""}">${ico("reloj", 14)} ${a.estado === "revisada" || a.estado === "entregada" ? "Entregada el " + fecha(a.entrega.creado) : D.textoVence(a.fecha_limite)}</span>${a.entrega?.nota != null ? `<span class="nota-chip ${colorNota(a.entrega.nota)}">${nota(a.entrega.nota)}</span>` : ""}</div>
      <button type="button" class="btn ${a.estado === "pendiente" || a.estado === "vencida" ? "btn-primary" : "btn-outline"} btn-sm" data-abrir-actividad="${esc(a.id)}">${a.estado === "revisada" ? "Ver retroalimentación" : a.estado === "entregada" ? "Ver o editar entrega" : "Abrir y entregar"}</button>
    </article>`;
  }

  RENDER.inicio = rol === "estudiante" ? (el) => {
    const acts = misActividades(), pend = pendientesEstudiante(), cursos = D.cursosDeEstudiante(s.correo);
    const notas = acts.map((a) => a.entrega?.nota).filter((n) => typeof n === "number");
    const prom = notas.length ? notas.reduce((x, y) => x + y, 0) / notas.length : null;
    const siguiente = pend.filter((a) => a.estado === "pendiente")[0] || pend[0];
    const hoy = new Date(), reto = TCAsistente.quizVista(TCAsistente.QUIZ[(hoy.getDate() + hoy.getMonth()) % TCAsistente.QUIZ.length]);
    const tipG = TCAsistente.GLOSARIO[hoy.getDate() % TCAsistente.GLOSARIO.length], L = TCAsistente.L, tip = { termino: L(tipG.termino[0], tipG.termino[1]), def: L(tipG.def[0], tipG.def[1]) };
    const solicitudes = D.matriculas(s.correo).filter((m) => m.estado === "pendiente");
    const sugeridos = D.cursos().filter((c) => c.fase === "Lanzamiento" && !D.matriculas(s.correo).some((m) => Number(m.curso_id) === c.id)).slice(0, 2);
    el.innerHTML = `
      <div class="bienvenida" data-guia="bienvenida">
        <div><span class="eyebrow">Estudiante</span><h1>¡Hola, ${esc((s.nombre || "").split(" ")[0])}! 🌴</h1><p>${pend.length ? `Tienes <strong>${pend.length}</strong> ${pend.length === 1 ? "actividad pendiente" : "actividades pendientes"}. ¡Vamos paso a paso!` : "Estás al día con tus actividades. ¡Sigue así!"}</p></div>
        <img src="assets/img/logo-emblema.png" alt="" width="150" height="112" class="bienvenida-arte">
      </div>
      <dl class="kpis" data-guia="kpis">
        <div class="kpi"><dt>${ico("libro", 18)} Cursos activos</dt><dd>${cursos.length}</dd></div>
        <div class="kpi"><dt>${ico("reloj", 18)} Pendientes</dt><dd>${pend.length}</dd></div>
        <div class="kpi"><dt>${ico("check", 18)} Entregadas</dt><dd>${acts.filter((a) => a.entrega).length}</dd></div>
        <div class="kpi"><dt>${ico("estrella", 18)} Promedio</dt><dd>${prom == null ? "—" : prom.toFixed(1)}</dd></div>
      </dl>
      <div class="grid-2">
        <article class="tarjeta" data-guia="siguiente">
          <h2 class="tarjeta-titulo">${ico("flecha", 18)} Tu siguiente paso</h2>
          ${siguiente ? `<div class="siguiente-paso">${tipoIcono(siguiente.tipo)}<div><span class="act-curso">${esc(siguiente.curso?.titulo)}</span><h3>${esc(siguiente.titulo)}</h3><p class="act-vence ${D.diasRestantes(siguiente.fecha_limite) <= 2 ? "is-urgente" : ""}">${ico("reloj", 14)} ${D.textoVence(siguiente.fecha_limite)}</p></div></div><div class="fila-botones"><button type="button" class="btn btn-primary btn-sm" data-abrir-actividad="${esc(siguiente.id)}">Empezar ahora</button><button type="button" class="btn btn-outline btn-sm" data-preguntar-ia="Ayúdame con &quot;${esc(siguiente.titulo)}&quot;">Pedir ayuda al tutor</button></div>`
          : cursos.length ? vacio("check", "¡Todo al día!", "No tienes actividades pendientes.") : vacio("libro", "Aún no tienes cursos", solicitudes.length ? `Tienes ${solicitudes.length} solicitud(es) en revisión. Te avisaremos al aprobarla.` : "Inscríbete a un curso para recibir actividades.", '<a class="btn btn-primary btn-sm" href="cursos.html">Explorar cursos</a>')}
        </article>
        <article class="tarjeta reto" id="reto-dia" data-guia="reto">
          <h2 class="tarjeta-titulo">${ico("pregunta", 18)} Reto del día</h2>
          <p class="reto-pregunta">${esc(reto.p)}</p>
          <div class="reto-opciones">${reto.o.map((o, i) => `<button type="button" class="reto-opcion" data-reto="${i}"><span>${"ABC"[i]}</span>${esc(o)}</button>`).join("")}</div>
          <p class="reto-feedback" role="status" hidden></p>
        </article>
      </div>
      <article class="tarjeta" data-guia="ruta">
        <h2 class="tarjeta-titulo">${ico("mapa", 18)} Tu ruta de aprendizaje</h2>
        <p class="seccion-texto">Cada curso es una parada. Completa sus actividades para avanzar a la siguiente.</p>
        <ol class="ruta">
          ${cursos.map((c) => { const p = D.progreso(s.correo, c.id); return `<li class="ruta-parada ${p.porcentaje === 100 ? "is-completa" : "is-activa"}"><span class="ruta-punto" style="--pct:${p.porcentaje}"><span>${p.porcentaje}%</span></span><strong>${esc(c.titulo)}</strong><small>${p.hechas}/${p.total} actividades</small></li>`; }).join("")}
          ${solicitudes.map((m) => `<li class="ruta-parada is-espera"><span class="ruta-punto">${ico("reloj", 18)}</span><strong>${esc(D.curso(m.curso_id)?.titulo || "Curso")}</strong><small>Solicitud en revisión</small></li>`).join("")}
          ${sugeridos.map((c) => `<li class="ruta-parada is-sugerida"><span class="ruta-punto">${ico("mas", 18)}</span><strong>${esc(c.titulo)}</strong><small><a href="cursos.html">Siguiente sugerido</a></small></li>`).join("")}
        </ol>
      </article>
      <div class="grid-2">
        <article class="tarjeta sabias" data-guia="sabias">
          <h2 class="tarjeta-titulo">${ico("foco", 18)} ¿Sabías que…?</h2>
          <h3>${esc(tip.termino)}</h3><p>${esc(tip.def.replace(/\*\*/g, ""))}</p>
          <button type="button" class="btn btn-outline btn-sm" data-preguntar-ia="${esc(L("¿Qué es " + tip.termino.toLowerCase() + "?", "What is " + tip.termino + "?"))}">Explícamelo con un ejemplo</button>
        </article>
        <article class="tarjeta">
          <h2 class="tarjeta-titulo">${ico("usuarios", 18)} Tus datos de inscripción</h2>
          <p>${s.numero_documento ? `Documento ${esc(s.tipo_documento || "")} terminado en ${esc(String(s.numero_documento).slice(-4))}.` : "Completa tus datos de identidad para solicitar cupos."} ${esc([s.correo, s.telefono].filter(Boolean).join(" · "))}</p>
          <a class="btn btn-outline btn-sm" href="registro.html?completar=1">Revisar mis datos</a>
        </article>
      </div>`;
    el.querySelector("#reto-dia").addEventListener("click", (e) => {
      const b = e.target.closest("[data-reto]"); if (!b) return;
      const i = Number(b.dataset.reto), ok = i === reto.c, fb = el.querySelector(".reto-feedback");
      el.querySelectorAll("[data-reto]").forEach((x, j) => { x.disabled = true; x.classList.toggle("is-correcta", j === reto.c); x.classList.toggle("is-incorrecta", j === i && !ok); });
      fb.hidden = false; fb.innerHTML = (ok ? `🎉 <strong>${L("¡Correcto!", "Correct!")}</strong> ` : `💪 <strong>${L("Casi.", "Almost.")}</strong> `) + TCChatUI.formato(reto.e).replace(/<\/?p>/g, "");
      TCUtil.guardar("tc_retos_" + s.correo, (TCUtil.leer("tc_retos_" + s.correo, 0) || 0) + (ok ? 1 : 0));
    });
  } : (el) => {
    const cursos = D.cursosDeDocente(s.nombre), acts = D.actividadesDeDocente(s.nombre), pr = porRevisar();
    const estudiantes = new Set(cursos.flatMap((c) => D.estudiantesDeCurso(c.id).map((e) => e.correo))).size;
    el.innerHTML = `
      <div class="bienvenida" data-guia="bienvenida">
        <div><span class="eyebrow">Docente · ${esc(s.especialidad || "")}</span><h1>¡Hola, profe ${esc((s.nombre || "").split(" ")[0])}! 👋</h1><p>${pr.length ? `Tienes <strong>${pr.length}</strong> ${pr.length === 1 ? "entrega" : "entregas"} esperando tu retroalimentación.` : "No hay entregas pendientes por revisar."}</p></div>
        <img src="assets/img/logo-emblema.png" alt="" width="150" height="112" class="bienvenida-arte">
      </div>
      <dl class="kpis" data-guia="kpis">
        <div class="kpi"><dt>${ico("libro", 18)} Cursos que dictas</dt><dd>${cursos.length}</dd></div>
        <div class="kpi"><dt>${ico("usuarios", 18)} Estudiantes</dt><dd>${estudiantes}</dd></div>
        <div class="kpi"><dt>${ico("portapapeles", 18)} Actividades</dt><dd>${acts.length}</dd></div>
        <div class="kpi"><dt>${ico("check", 18)} Por revisar</dt><dd>${pr.length}</dd></div>
      </dl>
      <div class="grid-2">
        <article class="tarjeta" data-guia="revisar">
          <h2 class="tarjeta-titulo">${ico("check", 18)} Por revisar</h2>
          ${pr.length ? `<ul class="lista-filas">${pr.slice(0, 5).map((e) => `<li><span class="avatar avatar-sm">${esc(iniciales(e.nombre))}</span><span><strong>${esc(e.nombre)}</strong><small>${esc(e.actividad.titulo)} · ${fecha(e.creado)}</small></span><button type="button" class="btn btn-outline btn-sm" data-calificar="${esc(e.id)}">Revisar</button></li>`).join("")}</ul>${pr.length > 5 ? `<button type="button" class="btn-texto-plano" data-ir="entregas">Ver las ${pr.length}</button>` : ""}` : vacio("check", "¡Todo revisado!", "Cuando tus estudiantes entreguen, aparecerán aquí.")}
        </article>
        <article class="tarjeta guia-didactica" data-guia="guia">
          <h2 class="tarjeta-titulo">${ico("foco", 18)} Cómo crear una buena actividad</h2>
          <ol class="pasos-mini">
            <li><strong>Un objetivo claro.</strong> Empieza con “Al terminar, podrás…”.</li>
            <li><strong>Instrucciones numeradas.</strong> Un verbo por paso: escribe, crea, explica.</li>
            <li><strong>Conexión con su realidad.</strong> Ejemplos del Caribe y de su barrio.</li>
            <li><strong>Retroalimentación útil.</strong> Qué hizo bien, qué mejorar y un siguiente paso.</li>
          </ol>
          <button type="button" class="btn btn-primary btn-sm" data-nueva-actividad>${ico("mas", 16)} Crear actividad</button>
        </article>
      </div>
      <article class="tarjeta" data-guia="cursos-resumen">
        <h2 class="tarjeta-titulo">${ico("libro", 18)} Tus cursos de un vistazo</h2>
        <div class="grid-cursos-mini">${cursos.map((c) => { const st = statsCurso(c); return `<button type="button" class="curso-mini" data-ir="cursos"><span class="tag">${esc(c.area)}</span><strong>${esc(c.titulo)}</strong><small>${st.estudiantes} estudiantes · ${st.actividades} actividades</small>${barra(st.cumplimiento, "Cumplimiento de entregas")}<small>${st.cumplimiento}% de entregas recibidas</small></button>`; }).join("") || "<p>No tienes cursos asignados.</p>"}</div>
      </article>`;
  };

  RENDER.cursos = rol === "estudiante" ? (el) => {
    const cursos = D.cursosDeEstudiante(s.correo), solicitudes = D.matriculas(s.correo).filter((m) => m.estado !== "aprobada");
    el.innerHTML = encabezado("Aprende haciendo", "Mis cursos", "Tu avance en cada curso, módulo por módulo. Abre un módulo para ver sus temas y actividades.", '<a class="btn btn-outline" href="cursos.html">Explorar catálogo</a>') +
      (cursos.length ? `<div class="lista-cursos-portal">${cursos.map((c) => { const p = D.progreso(s.correo, c.id), f = D.ficha(D.fichaDe(s.correo, c.id)); return `<article class="tarjeta curso-portal curso-portal-ancho">
        <div class="curso-portal-top"><span class="tag">${esc(c.area)}</span><span class="tag">${esc(c.modalidad)}</span>${f ? `<span class="ficha-chip" title="${esc(f.jornada)}">Ficha ${esc(f.numero)}</span>` : ""}</div>
        <h2>${esc(c.titulo)}</h2>
        <p class="docente-linea"><span class="avatar avatar-sm">${esc(iniciales(c.instructor))}</span> ${esc(c.instructor)}${f ? ` · Jornada ${esc(f.jornada.toLowerCase())}` : ""}</p>
        ${barra(p.porcentaje, "Avance del curso")}
        <div class="curso-portal-datos"><span>${p.hechas}/${p.total} actividades · ${D.modulos(c).length} módulos</span><span>Promedio: <strong class="${colorNota(p.promedio)}">${p.promedio == null ? "—" : p.promedio.toFixed(1)}</strong></span></div>
        ${listaModulos(s.correo, c.id)}
        <p class="proyecto-linea">${ico("cohete", 16)} <span><strong>Proyecto final:</strong> ${esc(c.proyecto || "Por definir")}</span></p>
        <button type="button" class="btn btn-primary btn-sm" data-ir="actividades" data-curso="${c.id}">Ver actividades</button>
      </article>`; }).join("")}</div>` : vacio("libro", "Aún no tienes cursos aprobados", "Cuando admisiones apruebe tu solicitud, el curso y sus actividades aparecerán aquí.", '<a class="btn btn-primary btn-sm" href="cursos.html">Explorar cursos</a>')) +
      (solicitudes.length ? `<h2 class="subtitulo">Solicitudes</h2><ul class="lista-filas tarjeta">${solicitudes.map((m) => `<li>${ico(m.estado === "rechazada" ? "salir" : "reloj", 18)}<span><strong>${esc(D.curso(m.curso_id)?.titulo || "Curso")}</strong><small>${D.fichaDeInscripcion(m) ? `Ficha ${esc(D.fichaDeInscripcion(m))} · ` : ""}${m.estado === "rechazada" ? "No aprobada · escríbenos si tienes dudas" : "En revisión por admisiones"}</small></span>${pill(m.estado === "rechazada" ? "vencida" : "pendiente").replace("Vencida", "Rechazada").replace("Pendiente", "En revisión")}</li>`).join("")}</ul>` : "");
  } : (el) => {
    const cursos = D.cursosDeDocente(s.nombre);
    el.innerHTML = encabezado("Tus grupos", "Mis cursos", "Cada curso tiene sus fichas (grupos) y está dividido en módulos. Publica actividades por módulo y para una ficha o para todas.") +
      `<div class="lista-cursos-portal">${cursos.map((c) => { const st = statsCurso(c), acts = D.actividadesDeCurso(c.id); return `<article class="tarjeta curso-portal curso-portal-ancho">
        <div class="curso-portal-top"><span class="tag">${esc(c.area)}</span><span class="tag">${esc(c.modalidad)}</span><span class="tag ${c.fase === "Lanzamiento" ? "tag-lanzamiento" : ""}">${esc(c.fase)}</span></div>
        <h2>${esc(c.titulo)}</h2>
        <div class="mini-kpis"><span><strong>${st.estudiantes}</strong> estudiantes</span><span><strong>${st.actividades}</strong> actividades</span><span><strong>${st.promedio == null ? "—" : st.promedio.toFixed(1)}</strong> promedio</span></div>
        ${barra(st.cumplimiento, "Entregas recibidas")}<small class="form-ayuda">${st.cumplimiento}% de entregas recibidas</small>
        <p class="mod-av-sub">Fichas</p>
        <div class="fichas-docente">${D.fichasDeCurso(c.id).map((f) => `<button type="button" class="ficha-boton" data-ir="estudiantes" data-ficha="${esc(f.numero)}"><strong>${esc(f.numero)}</strong><small>${esc(f.jornada)} · ${D.estudiantesDeCurso(c.id, f.numero).length} est.</small><span class="ficha-estado">${esc(f.estado)}</span></button>`).join("") || '<p class="form-ayuda">Este curso aún no tiene fichas.</p>'}</div>
        <p class="mod-av-sub">Módulos</p>
        <div class="modulos-avance">${D.modulos(c).map((m) => { const delModulo = acts.filter((a) => Number(a.modulo || 1) === m.numero); return `<details class="mod-av">
          <summary><span class="mod-av-num"><span>${m.numero}</span></span><span class="mod-av-info"><strong>${esc(m.titulo)}</strong><small>${m.temas.length} temas · ${delModulo.length} ${delModulo.length === 1 ? "actividad publicada" : "actividades publicadas"}</small></span><span class="btn btn-outline btn-sm" role="button" tabindex="0" data-nueva-actividad="${c.id}" data-modulo="${m.numero}">${ico("mas", 14)} Actividad</span></summary>
          <div class="mod-av-cuerpo">
            ${m.temas.length ? `<ul class="temas-chips">${m.temas.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${m.actividades.length ? `<p class="mod-av-sub">Actividad del plan</p><ul class="modulo-acts">${m.actividades.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${m.evidencia ? `<p class="modulo-evidencia"><strong>Evidencia:</strong> ${esc(m.evidencia)}</p>` : ""}
            ${guiaClase(c, m)}
            <p class="mod-av-sub">Actividades publicadas</p>
            ${delModulo.length ? `<ul class="lista-filas mod-av-acts">${delModulo.map((a) => `<li>${tipoIcono(a.tipo)}<span><strong>${esc(a.titulo)}</strong><small>${textoFicha(a.ficha)} · ${fecha(a.fecha_limite)} · ${D.entregasDeActividad(a.id).length}/${D.destinatarios(a).length} entregas</small></span><button type="button" class="btn btn-outline btn-sm" data-ver-entregas="${esc(a.id)}">Entregas</button></li>`).join("")}</ul>` : '<p class="form-ayuda">Sin actividades publicadas en este módulo.</p>'}
          </div>
        </details>`; }).join("")}</div>
        <p class="proyecto-linea">${ico("cohete", 16)} <span><strong>Proyecto final:</strong> ${esc(c.proyecto || "Por definir")}</span></p>
        <div class="fila-botones"><button type="button" class="btn btn-primary btn-sm" data-nueva-actividad="${c.id}">${ico("mas", 16)} Nueva actividad</button><button type="button" class="btn btn-outline btn-sm" data-ir="estudiantes" data-ficha="${esc(D.fichasDeCurso(c.id)[0]?.numero || "")}">Seguimiento</button></div>
      </article>`; }).join("") || vacio("libro", "Sin cursos asignados", "Pide a coordinación académica que te asigne un curso.")}</div>`;
  };

  RENDER.actividades = rol === "estudiante" ? (el) => {
    const cursos = D.cursosDeEstudiante(s.correo);
    let filtro = "todas";
    el.innerHTML = encabezado("Lo que dejan tus docentes", "Actividades", "Ábrelas, entrégalas y recibe retroalimentación. Puedes editar tu entrega mientras no esté calificada.") +
      `<div class="filtros-barra"><div class="chips-filtro" role="tablist" aria-label="Filtrar por estado">${[["todas", "Todas"], ["pendiente", "Pendientes"], ["entregada", "Entregadas"], ["revisada", "Calificadas"]].map(([v, t]) => `<button type="button" role="tab" class="chip-filtro ${v === filtro ? "activo" : ""}" data-filtro="${v}" aria-selected="${v === filtro}">${t}</button>`).join("")}</div>
      <label class="select-mini"><span class="sr-only">Curso</span><select id="f-curso"><option value="">Todos los cursos</option>${cursos.map((c) => `<option value="${c.id}" ${String(c.id) === filtroCurso ? "selected" : ""}>${esc(c.titulo)}</option>`).join("")}</select></label></div>
      <div class="grid-tarjetas" id="lista-actividades"></div>`;
    const pintar = () => {
      const lista = misActividades().filter((a) => (filtro === "todas" || a.estado === filtro || (filtro === "pendiente" && a.estado === "vencida")) && (!filtroCurso || String(a.curso_id) === filtroCurso));
      el.querySelector("#lista-actividades").innerHTML = lista.map(tarjetaActividad).join("") || vacio("portapapeles", "Nada por aquí", cursos.length ? "No hay actividades con este filtro." : "Cuando tengas un curso aprobado, tus docentes te dejarán actividades aquí.");
    };
    el.querySelector(".chips-filtro").addEventListener("click", (e) => { const b = e.target.closest("[data-filtro]"); if (!b) return; filtro = b.dataset.filtro; el.querySelectorAll("[data-filtro]").forEach((x) => { x.classList.toggle("activo", x === b); x.setAttribute("aria-selected", x === b); }); pintar(); });
    el.querySelector("#f-curso").addEventListener("change", (e) => { filtroCurso = e.target.value; pintar(); });
    pintar();
  } : (el) => {
    const cursos = D.cursosDeDocente(s.nombre);
    el.innerHTML = encabezado("Lo que dejas a tus grupos", "Actividades", "Publica actividades por módulo, para una ficha o para todas las fichas del curso.", `<button type="button" class="btn btn-primary" data-nueva-actividad data-guia="nueva">${ico("mas", 18)} Nueva actividad</button>`) +
      `<div class="filtros-barra"><label class="select-mini"><span class="sr-only">Curso</span><select id="f-curso"><option value="">Todos mis cursos</option>${cursos.map((c) => `<option value="${c.id}" ${String(c.id) === filtroCurso ? "selected" : ""}>${esc(c.titulo)}</option>`).join("")}</select></label>
      <label class="select-mini"><span class="sr-only">Ficha</span><select id="f-ficha"><option value="">Todas las fichas</option>${D.fichasDeDocente(s.nombre).map((f) => `<option value="${esc(f.numero)}" ${f.numero === filtroFicha ? "selected" : ""}>Ficha ${esc(f.numero)} · ${esc(D.curso(f.curso_id)?.titulo || "")}</option>`).join("")}</select></label></div><div class="lista-actividades" id="lista-actividades"></div>`;
    const pintar = () => {
      const lista = D.actividadesDeDocente(s.nombre).filter((a) => (!filtroCurso || String(a.curso_id) === filtroCurso) && (!filtroFicha || (D.ficha(filtroFicha)?.curso_id === Number(a.curso_id) && D.llegaA(a, filtroFicha)))).sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
      el.querySelector("#lista-actividades").innerHTML = lista.map((a) => {
        const total = D.destinatarios(a).length, ent = D.entregasDeActividad(a.id), rev = ent.filter((e) => e.estado === "revisada").length;
        const pct = total ? Math.min(100, Math.round((ent.length / total) * 100)) : 0;
        return `<article class="tarjeta act-docente">${tipoIcono(a.tipo)}<div class="act-docente-info"><span class="act-curso">${esc(D.curso(a.curso_id)?.titulo || "")} · ${esc(a.tipo)}${etiquetaModulo(a)} · ${textoFicha(a.ficha)}</span><h3>${esc(a.titulo)}</h3><p class="act-vence ${D.diasRestantes(a.fecha_limite) < 0 ? "" : D.diasRestantes(a.fecha_limite) <= 2 ? "is-urgente" : ""}">${ico("calendario", 14)} ${fecha(a.fecha_limite)} · ${D.textoVence(a.fecha_limite)}</p></div>
          <div class="act-docente-progreso"><small>${ent.length}/${total} entregas · ${rev} calificadas</small>${barra(pct, "Entregas recibidas")}</div>
          <div class="fila-botones"><button type="button" class="btn btn-outline btn-sm" data-ver-entregas="${esc(a.id)}">${ico("ojo", 15)} Entregas</button><button type="button" class="btn btn-outline btn-sm" data-editar-actividad="${esc(a.id)}">${ico("editar", 15)} Editar</button><button type="button" class="btn btn-outline btn-sm btn-peligro" data-eliminar-actividad="${esc(a.id)}" aria-label="Eliminar ${esc(a.titulo)}">${ico("basura", 15)}</button></div></article>`;
      }).join("") || vacio("lapiz", "Aún no has publicado actividades", "Crea la primera: usa una plantilla y estará lista en un minuto.", `<button type="button" class="btn btn-primary btn-sm" data-nueva-actividad>${ico("mas", 16)} Crear actividad</button>`);
    };
    el.querySelector("#f-curso").addEventListener("change", (e) => { filtroCurso = e.target.value; pintar(); });
    el.querySelector("#f-ficha").addEventListener("change", (e) => { filtroFicha = e.target.value; pintar(); });
    pintar();
  };

  /* ---------- Logros (estudiante) ---------- */
  RENDER.logros = (el) => {
    const acts = misActividades(), entregadas = acts.filter((a) => a.entrega), notas = acts.map((a) => a.entrega?.nota).filter((n) => typeof n === "number");
    const aTiempo = entregadas.filter((a) => a.entrega.creado.slice(0, 10) <= (a.fecha_limite || "9999")).length;
    const retos = TCUtil.leer("tc_retos_" + s.correo, 0) || 0;
    const LOGROS = [
      ["cohete", "Primer despegue", "Entrega tu primera actividad.", entregadas.length >= 1],
      ["estrella", "Constancia caribe", "Entrega 3 actividades.", entregadas.length >= 3],
      ["reloj", "Puntual", "Entrega 2 actividades antes de la fecha límite.", aTiempo >= 2],
      ["trofeo", "Nota de oro", "Obtén una nota de 4.5 o más.", notas.some((n) => n >= 4.5)],
      ["libro", "Explorador", "Ten 2 o más cursos activos.", D.cursosDeEstudiante(s.correo).length >= 2],
      ["pregunta", "Mente curiosa", "Acierta un reto del día.", retos >= 1],
      ["usuarios", "Perfil completo", "Completa tus datos de inscripción.", !!s.numero_documento],
      ["chat", "Conversador", "Haz 3 preguntas al tutor IA.", (TCUtil.leer("tc_chat_" + s.correo, []) || []).filter((m) => m.de === "yo").length >= 3],
    ];
    const ganados = LOGROS.filter((l) => l[3]).length;
    el.innerHTML = encabezado("Celebra tu avance", "Logros", "Cada logro es una muestra de constancia. ¡Colecciónalos todos!") +
      `<article class="tarjeta logros-resumen"><div><strong>${ganados}</strong> de ${LOGROS.length} logros</div>${barra(Math.round((ganados / LOGROS.length) * 100), "Logros obtenidos")}</article>
      <div class="grid-logros">${LOGROS.map(([icono, t, d, ok]) => `<article class="logro ${ok ? "is-ganado" : ""}"><span class="logro-icono">${ico(icono, 26)}</span><h3>${t}</h3><p>${d}</p><span class="pill ${ok ? "pill-ok" : ""}">${ok ? "¡Obtenido!" : "Por lograr"}</span></article>`).join("")}</div>`;
  };

  /* ---------- Asistente a pantalla completa ---------- */
  RENDER.asistente = (el) => {
    el.innerHTML = encabezado(rol === "docente" ? "Tu copiloto" : "Tu tutor", rol === "docente" ? "Copiloto IA" : "Tutor IA", rol === "docente" ? "Pídele ideas de actividades, rúbricas o el estado de tus grupos." : "Pregúntale por tus pendientes, pídele un plan de estudio o que te explique un concepto.") + '<div class="chat-completo"></div>';
    TCChatUI.montar(el.querySelector(".chat-completo"), { modo: "completo" });
  };

  /* ==========================================================
     DOCENTE: utilidades, entregas y estudiantes
     ========================================================== */
  function statsCurso(c) {
    const est = D.estudiantesDeCurso(c.id), acts = D.actividadesDeCurso(c.id);
    const ent = acts.flatMap((a) => D.entregasDeActividad(a.id));
    const notas = ent.map((e) => e.nota).filter((n) => typeof n === "number");
    const esperadas = acts.reduce((n, a) => n + D.destinatarios(a).length, 0);
    return { estudiantes: est.length, actividades: acts.length, cumplimiento: esperadas ? Math.min(100, Math.round((ent.length / esperadas) * 100)) : 0, promedio: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null };
  }
  function porRevisar() {
    if (rol !== "docente") return [];
    const acts = D.actividadesDeDocente(s.nombre), mapa = new Map(acts.map((a) => [a.id, a]));
    return D.entregas().filter((e) => mapa.has(e.actividad_id) && e.estado === "entregada").map((e) => ({ ...e, actividad: mapa.get(e.actividad_id) })).sort((a, b) => a.creado.localeCompare(b.creado));
  }
  let filtroActividad = "", filtroEstadoEntrega = "entregada";
  RENDER.entregas = (el) => {
    const acts = D.actividadesDeDocente(s.nombre);
    el.innerHTML = encabezado("Retroalimenta", "Entregas", "Revisa el trabajo de tus estudiantes y califica de 1.0 a 5.0 con un comentario.") +
      `<div class="filtros-barra"><div class="chips-filtro">${[["entregada", "Por revisar"], ["revisada", "Calificadas"], ["", "Todas"]].map(([v, t]) => `<button type="button" class="chip-filtro ${v === filtroEstadoEntrega ? "activo" : ""}" data-filtro="${v}">${t}</button>`).join("")}</div>
      <label class="select-mini"><span class="sr-only">Actividad</span><select id="f-actividad"><option value="">Todas las actividades</option>${acts.map((a) => `<option value="${esc(a.id)}" ${a.id === filtroActividad ? "selected" : ""}>${esc(a.titulo)}</option>`).join("")}</select></label></div>
      <div class="tabla-wrap"><table class="tabla"><thead><tr><th>Estudiante</th><th>Actividad</th><th>Entregada</th><th>Estado</th><th>Nota</th><th><span class="sr-only">Acción</span></th></tr></thead><tbody id="tb-entregas"></tbody></table></div>`;
    const pintar = () => {
      const mapa = new Map(acts.map((a) => [a.id, a]));
      const lista = D.entregas().filter((e) => mapa.has(e.actividad_id) && (!filtroActividad || e.actividad_id === filtroActividad) && (!filtroEstadoEntrega || e.estado === filtroEstadoEntrega)).sort((a, b) => b.creado.localeCompare(a.creado));
      el.querySelector("#tb-entregas").innerHTML = lista.map((e) => { const a = mapa.get(e.actividad_id); return `<tr><td><span class="celda-persona"><span class="avatar avatar-sm">${esc(iniciales(e.nombre))}</span><span>${esc(e.nombre)}<br><small>Ficha ${esc(D.fichaDe(e.correo, a.curso_id))}</small></span></span></td><td>${esc(a.titulo)}<br><small>${esc(D.curso(a.curso_id)?.titulo || "")}${etiquetaModulo(a)}</small></td><td>${fecha(e.creado)}</td><td>${pill(e.estado)}</td><td><span class="nota-chip ${colorNota(e.nota)}">${nota(e.nota)}</span></td><td><button type="button" class="btn ${e.estado === "entregada" ? "btn-primary" : "btn-outline"} btn-sm" data-calificar="${esc(e.id)}">${e.estado === "entregada" ? "Calificar" : "Ver"}</button></td></tr>`; }).join("") || `<tr><td colspan="6">${filtroEstadoEntrega === "entregada" ? "🎉 No hay entregas por revisar." : "No hay entregas con este filtro."}</td></tr>`;
    };
    el.querySelector(".chips-filtro").addEventListener("click", (e) => { const b = e.target.closest("[data-filtro]"); if (!b) return; filtroEstadoEntrega = b.dataset.filtro; el.querySelectorAll("[data-filtro]").forEach((x) => x.classList.toggle("activo", x === b)); pintar(); });
    el.querySelector("#f-actividad").addEventListener("change", (e) => { filtroActividad = e.target.value; pintar(); });
    pintar();
  };
  /* ---------- Seguimiento: avance de cada estudiante por módulo, ficha por ficha ---------- */
  const celdaColor = (m) => (m.estado === "sin-actividades" ? "" : `--pct:${m.porcentaje}`);
  RENDER.estudiantes = (el) => {
    const fichas = D.fichasDeDocente(s.nombre);
    if (!fichas.some((f) => f.numero === filtroFicha)) filtroFicha = (fichas.find((f) => D.estudiantesDeFicha(f.numero).length) || fichas[0])?.numero || "";
    el.innerHTML = encabezado("Acompaña a cada persona", "Seguimiento por módulos", "Elige una ficha para ver cuánto ha avanzado cada estudiante en cada módulo. Toca un estudiante para ver el detalle. 🔔 marca a quien podría necesitar apoyo.") +
      `<div class="filtros-barra seguimiento-filtros">
        <div class="chips-filtro chips-fichas" role="tablist" aria-label="Fichas">${fichas.map((f) => `<button type="button" role="tab" class="chip-filtro ${f.numero === filtroFicha ? "activo" : ""}" aria-selected="${f.numero === filtroFicha}" data-ficha-sel="${esc(f.numero)}">${esc(f.numero)} <small>${esc(D.curso(f.curso_id)?.titulo || "")}</small></button>`).join("")}</div>
        <label class="buscar-ficha"><span class="sr-only">Buscar ficha</span>${ico("buscar", 16)}<input type="search" id="buscar-ficha" inputmode="numeric" maxlength="6" placeholder="Buscar n.º de ficha"></label>
      </div><div id="seguimiento-tabla"></div>`;
    const pintar = () => {
      const f = D.ficha(filtroFicha), cont = el.querySelector("#seguimiento-tabla");
      if (!f) { cont.innerHTML = vacio("usuarios", "Sin fichas", "Cuando coordinación te asigne una ficha, aparecerá aquí."); return; }
      const c = D.curso(f.curso_id), mods = D.modulos(c), est = D.estudiantesDeFicha(f.numero);
      const filas = est.map((e) => ({ e, p: D.progreso(e.correo, c.id), m: D.progresoModulos(e.correo, c.id) }));
      const grupo = mods.map((_, i) => { const con = filas.filter((x) => x.m[i].total); return con.length ? Math.round(con.reduce((n, x) => n + x.m[i].porcentaje, 0) / con.length) : null; });
      cont.innerHTML = `<article class="tarjeta">
        <div class="seguimiento-cabecera"><div><span class="eyebrow">Ficha ${esc(f.numero)} · ${esc(f.jornada)} · ${esc(f.estado)}</span><h2 class="tarjeta-titulo">${ico("libro", 18)} ${esc(c.titulo)}</h2></div><div class="mini-kpis"><span><strong>${est.length}</strong> estudiantes</span><span><strong>${mods.length}</strong> módulos</span><span><strong>${filas.filter((x) => x.p.total && (x.p.porcentaje < 50 || (x.p.promedio != null && x.p.promedio < 3))).length}</strong> 🔔</span></div></div>
        ${est.length ? `<div class="tabla-wrap"><table class="tabla tabla-seguimiento"><thead><tr><th>Estudiante</th>${mods.map((m) => `<th class="th-mod" title="${esc(m.titulo)}"><span>M${m.numero}</span><small>${esc(m.titulo)}</small></th>`).join("")}<th>Total</th><th>Promedio</th><th>Estado</th></tr></thead>
          <tbody>${filas.map(({ e, p, m }) => { const alerta = p.total && (p.porcentaje < 50 || (p.promedio != null && p.promedio < 3)); return `<tr>
            <td><button type="button" class="celda-persona persona-boton" data-seguimiento="${esc(e.correo)}" data-curso="${c.id}"><span class="avatar avatar-sm">${esc(iniciales(e.nombre))}</span><span>${esc(e.nombre)}<br><small>Ver detalle</small></span></button></td>
            ${m.map((x) => `<td><button type="button" class="celda-mod mod-${x.estado}" style="${celdaColor(x)}" data-seguimiento="${esc(e.correo)}" data-curso="${c.id}" data-modulo="${x.numero}" title="Módulo ${x.numero}: ${x.total ? `${x.hechas}/${x.total} entregas` : "sin actividades"}${x.promedio != null ? ` · promedio ${x.promedio.toFixed(1)}` : ""}">${x.total ? `<strong>${x.porcentaje}%</strong><small>${x.hechas}/${x.total}</small>` : "—"}</button></td>`).join("")}
            <td><div class="celda-progreso">${barra(p.porcentaje, "Avance total")}<small>${p.porcentaje}%</small></div></td>
            <td><span class="nota-chip ${colorNota(p.promedio)}">${p.promedio == null ? "—" : p.promedio.toFixed(1)}</span></td>
            <td>${alerta ? `<span class="pill pill-pendiente">🔔 Necesita apoyo</span>` : p.total ? `<span class="pill pill-ok">Al día</span>` : `<span class="pill pill-gris">Sin actividades</span>`}</td></tr>`; }).join("")}</tbody>
          <tfoot><tr><th scope="row">Promedio del grupo</th>${grupo.map((g) => `<td>${g == null ? "—" : `<span class="grupo-pct">${g}%</span>`}</td>`).join("")}<td colspan="3"></td></tr></tfoot></table></div>
          <p class="leyenda-mod"><span class="mod-completo">Completo</span><span class="mod-en-curso">En curso</span><span class="mod-sin-iniciar">Sin iniciar</span><span class="mod-sin-actividades">Sin actividades</span></p>` : "<p>Aún no hay estudiantes aprobados en esta ficha.</p>"}
      </article>`;
    };
    const elegir = (numero) => { filtroFicha = numero; el.querySelectorAll("[data-ficha-sel]").forEach((x) => { const on = x.dataset.fichaSel === numero; x.classList.toggle("activo", on); x.setAttribute("aria-selected", on); }); pintar(); };
    el.querySelector(".chips-fichas").addEventListener("click", (e) => { const b = e.target.closest("[data-ficha-sel]"); if (b) elegir(b.dataset.fichaSel); });
    el.querySelector("#buscar-ficha").addEventListener("input", (e) => {
      const q = e.target.value.replace(/\D/g, ""); if (!q) return;
      const f = fichas.find((x) => x.numero.startsWith(q)); if (f) elegir(f.numero);
    });
    pintar();
  };
  function abrirSeguimiento(correo, cursoId, modulo) {
    const c = D.curso(cursoId), e = D.estudiantesDeCurso(cursoId).find((x) => x.correo.toLowerCase() === correo.toLowerCase()); if (!c || !e) return;
    const p = D.progreso(correo, cursoId);
    $("#ms-cuerpo").innerHTML = `<div class="modal-act-cabecera"><span class="avatar">${esc(iniciales(e.nombre))}</span><div><span class="eyebrow">${esc(c.titulo)} · Ficha ${esc(e.ficha)}</span><h2 id="ms-titulo">${esc(e.nombre)}</h2><p class="act-vence">${p.hechas}/${p.total} actividades entregadas · promedio <strong class="${colorNota(p.promedio)}">${p.promedio == null ? "—" : p.promedio.toFixed(1)}</strong></p></div></div>
      ${barra(p.porcentaje, "Avance total")}
      ${listaModulos(correo, cursoId, { docente: true })}`;
    const abrir = $$("#ms-cuerpo details.mod-av")[(Number(modulo) || 1) - 1];
    if (abrir) abrir.open = true;
    $("#modal-seguimiento").showModal();
  }
  $("#ms-cuerpo").addEventListener("click", (ev) => { const b = ev.target.closest("[data-calificar]"); if (b) { $("#modal-seguimiento").close(); abrirCalificar(b.dataset.calificar); } });

  /* ---------- Modal: estudiante abre y entrega ---------- */
  let actividadAbierta = null;
  const contador = () => { $("#me-contador").textContent = $("#me-respuesta").value.length; };
  $("#me-respuesta").addEventListener("input", contador);
  function abrirActividad(id) {
    const a = misActividades().find((x) => x.id === id); if (!a) return;
    actividadAbierta = a;
    const e = a.entrega, cerrada = e?.estado === "revisada";
    $("#ma-cuerpo").innerHTML = `<div class="modal-act-cabecera">${tipoIcono(a.tipo)}<div><span class="eyebrow">${esc(a.tipo)} · ${esc(a.curso?.titulo || "")}</span><h2 id="ma-titulo">${esc(a.titulo)}</h2></div></div>
      <div class="act-meta">${pill(a.estado)}<span class="act-vence">${ico("calendario", 14)} ${fecha(a.fecha_limite)} · ${D.textoVence(a.fecha_limite)}</span><span class="act-vence">${ico("pizarra", 14)} ${esc(a.docente)}</span></div>
      ${a.objetivo ? `<div class="objetivo-caja">${ico("brujula", 18)}<div><strong>Objetivo</strong><p>${esc(a.objetivo)}</p></div></div>` : ""}
      <h3>Instrucciones</h3><div class="instrucciones">${TCChatUI.formato(a.descripcion)}</div>
      ${a.recurso ? `<p><a class="btn btn-outline btn-sm" href="${esc(a.recurso)}" target="_blank" rel="noopener">${ico("libro", 15)} Abrir recurso de apoyo</a></p>` : ""}
      ${cerrada ? `<div class="retro-caja"><span class="nota-grande ${colorNota(e.nota)}">${nota(e.nota)}</span><div><strong>Retroalimentación de ${esc(a.docente)}</strong><p>${esc(e.comentario)}</p></div></div><h3>Tu entrega</h3><div class="instrucciones" data-no-traducir>${TCChatUI.formato(e.respuesta)}</div>${e.enlace ? `<p><a href="${esc(e.enlace)}" target="_blank" rel="noopener">${esc(e.enlace)}</a></p>` : ""}` : ""}
      ${!cerrada ? `<button type="button" class="btn-texto-plano" data-preguntar-ia="Ayúdame con &quot;${esc(a.titulo)}&quot;">${ico("chat", 14)} ¿Dudas? Pregúntale al tutor IA</button>` : ""}`;
    const form = $("#form-entrega"); form.hidden = cerrada;
    form.elements.respuesta.value = e?.respuesta || ""; form.elements.enlace.value = e?.enlace || ""; contador();
    $("#me-enviar").textContent = e ? "Actualizar entrega" : "Entregar actividad";
    $$(".error", form).forEach((x) => (x.hidden = true));
    $("#modal-actividad").showModal();
  }
  $("#ma-cuerpo").addEventListener("click", (ev) => { const p = ev.target.closest("[data-preguntar-ia]"); if (p) { $("#modal-actividad").close(); window.TCAbrirAsistente?.(p.dataset.preguntarIa); } });
  /* Guarda (en el navegador o en PostgreSQL) bloqueando el botón mientras responde el servidor */
  async function guardando(form, accion) {
    const btn = form.querySelector("[type=submit]"); if (btn) btn.disabled = true;
    try { await accion(); return true; }
    catch (error) { toast(error.message || "No se pudo guardar. Inténtalo de nuevo.", "error"); return false; }
    finally { if (btn) btn.disabled = false; }
  }
  $("#form-entrega").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const form = ev.currentTarget;
    const ok = validar(form, { respuesta: (v) => (v.length < 10 ? "Escribe al menos 10 caracteres para que tu docente pueda revisarla." : ""), enlace: (v) => (v && !/^https?:\/\//.test(v) ? "El enlace debe empezar por https://" : "") });
    if (!ok) return;
    if (!(await guardando(form, () => D.entregar({ actividad_id: actividadAbierta.id, nombre: s.nombre, correo: s.correo, respuesta: form.elements.respuesta.value.trim(), enlace: form.elements.enlace.value.trim() })))) return;
    $("#modal-actividad").close(); toast("¡Actividad entregada! 🎉 Tu docente la revisará pronto."); celebrar(); navegar(actual, { sinFoco: true });
  });

  /* ---------- Modal: docente crea o edita ---------- */
  const PLANTILLAS = [
    ["Actividad del plan", "Práctica", (c, m) => (m ? actividadDelPlan(c, m) : { titulo: c.titulo, objetivo: "", descripcion: "" })],
    ["Práctica guiada", "Práctica", (c, m) => ({ titulo: `Práctica: ${m?.titulo || c.titulo}`.slice(0, 90), objetivo: `Aplicar ${(m?.temas?.[0] || "lo visto en clase").toLowerCase()} en un caso real.`, descripcion: "1. Lee el caso que encontrarás en el recurso.\n2. Resuélvelo paso a paso, explicando cada decisión.\n3. Comprueba tu resultado con un ejemplo diferente.\n4. Escribe en 3 líneas qué aprendiste." })],
    ["Quiz rápido", "Quiz", (c, m) => ({ titulo: `Quiz: ${m?.titulo || c.titulo}`.slice(0, 90), objetivo: `Comprobar la comprensión de ${m?.temas?.length ? m.temas.slice(0, 3).join(", ").toLowerCase() : "los conceptos clave del módulo"}.`, descripcion: "Responde con tus palabras:\n1. ¿Qué es … ? Da un ejemplo.\n2. ¿En qué se diferencia … de … ?\n3. ¿Dónde usarías esto en tu vida diaria?" })],
    ["Mini proyecto", "Proyecto", (c) => ({ titulo: `Mini proyecto: ${c.proyecto?.split(" ").slice(0, 5).join(" ") || "aplica lo aprendido"}`, objetivo: "Integrar lo aprendido en un producto propio.", descripcion: `1. Elige un problema de tu barrio o de un emprendimiento.\n2. Diseña una solución usando lo visto en ${c.titulo}.\n3. Construye una primera versión.\n4. Comparte el enlace y una foto o captura.\n5. Cuenta qué mejorarías en la siguiente versión.` })],
    ["Lectura + reflexión", "Lectura", () => ({ titulo: "Lectura y reflexión", objetivo: "Comprender un tema y explicarlo con tus palabras.", descripcion: "1. Lee el recurso de apoyo.\n2. Resume las 3 ideas principales.\n3. Escribe una pregunta que te haya quedado.\n4. Explica el tema como si se lo contaras a un amigo." })],
  ];
  let tipoElegido = "Tarea";
  function pintarTipos() {
    $("#na-tipos").innerHTML = Object.keys(D.TIPOS).map((t) => `<button type="button" class="tipo-opcion ${t === tipoElegido ? "is-selected" : ""}" data-tipo="${esc(t)}" aria-pressed="${t === tipoElegido}" style="--tipo:${D.TIPOS[t].color}">${ico(D.TIPOS[t].icono, 18)}<span>${esc(t)}</span></button>`).join("");
  }
  $("#na-tipos").addEventListener("click", (e) => { const b = e.target.closest("[data-tipo]"); if (b) { tipoElegido = b.dataset.tipo; pintarTipos(); } });
  $("#na-plantillas").innerHTML = PLANTILLAS.map(([nombre], i) => `<button type="button" class="chip" data-plantilla="${i}">${esc(nombre)}</button>`).join("");
  $("#na-plantillas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plantilla]"); if (!b) return;
    const [, tipo, fn] = PLANTILLAS[Number(b.dataset.plantilla)], form = $("#form-actividad"), c = D.curso(form.elements.curso_id.value) || {};
    const m = D.modulos(c).find((x) => x.numero === Number(form.elements.modulo.value));
    const datos = fn(c, m); tipoElegido = datos.tipo || tipo; pintarTipos();
    ["titulo", "objetivo", "descripcion"].forEach((k) => (form.elements[k].value = datos[k]));
    toast("Plantilla aplicada: ajústala a tu grupo ✍️");
  });
  const alcance = () => {
    const f = $("#na-ficha").value, n = D.estudiantesDeCurso($("#na-curso").value, f).length;
    $("#na-alcance").textContent = `La verán ${n} ${n === 1 ? "estudiante aprobado" : "estudiantes aprobados"} ${f ? "de la ficha " + f : "de todas las fichas de este curso"}.`;
    const m = D.modulos(D.curso($("#na-curso").value)).find((x) => x.numero === Number($("#na-modulo").value));
    $("#na-modulo-temas").textContent = m?.temas.length ? "Temas: " + m.temas.join(", ") : "";
  };
  /* Opciones de ficha y módulo según el curso elegido */
  function opcionesCurso(ficha = "", modulo = 1) {
    const c = D.curso($("#na-curso").value);
    $("#na-ficha").innerHTML = `<option value="">Todas las fichas del curso</option>` + D.fichasDeCurso(c?.id).map((f) => `<option value="${esc(f.numero)}">Ficha ${esc(f.numero)} · ${esc(f.jornada)} (${D.estudiantesDeCurso(c.id, f.numero).length} est.)</option>`).join("");
    $("#na-ficha").value = D.fichasDeCurso(c?.id).some((f) => f.numero === String(ficha)) ? String(ficha) : "";
    $("#na-modulo").innerHTML = D.modulos(c).map((m) => `<option value="${m.numero}">Módulo ${m.numero}: ${esc(m.titulo)}</option>`).join("");
    $("#na-modulo").value = String(Number(modulo) || 1);
    alcance();
  }
  $("#na-curso").addEventListener("change", () => opcionesCurso());
  $("#na-ficha").addEventListener("change", alcance);
  $("#na-modulo").addEventListener("change", alcance);
  function abrirFormActividad(cursoId, actividad = null, modulo = 1) {
    const form = $("#form-actividad"); form.reset(); $$(".error", form).forEach((x) => (x.hidden = true));
    const cursos = D.cursosDeDocente(s.nombre);
    if (!cursos.length) { toast("No tienes cursos asignados.", "error"); return; }
    form.elements.curso_id.innerHTML = cursos.map((c) => `<option value="${c.id}">${esc(c.titulo)}</option>`).join("");
    form.elements.curso_id.value = actividad?.curso_id || cursoId || cursos[0].id;
    const hoy = new Date().toISOString().slice(0, 10); form.elements.fecha_limite.min = actividad ? "" : hoy;
    form.elements.id.value = actividad?.id || "";
    form.elements.titulo.value = actividad?.titulo || ""; form.elements.objetivo.value = actividad?.objetivo || "";
    form.elements.descripcion.value = actividad?.descripcion || ""; form.elements.recurso.value = actividad?.recurso || "";
    const enUnaSemana = new Date(); enUnaSemana.setDate(enUnaSemana.getDate() + 7);
    form.elements.fecha_limite.value = actividad?.fecha_limite || enUnaSemana.toISOString().slice(0, 10);
    tipoElegido = actividad?.tipo || "Tarea"; pintarTipos();
    opcionesCurso(actividad ? actividad.ficha || "" : filtroFicha && D.ficha(filtroFicha)?.curso_id === Number(form.elements.curso_id.value) ? filtroFicha : "", actividad?.modulo || modulo);
    $("#mna-titulo").textContent = actividad ? "Editar actividad" : "Nueva actividad";
    form.querySelector("[type=submit]").textContent = actividad ? "Guardar cambios" : "Publicar actividad";
    $("#modal-nueva-actividad").showModal();
  }
  $("#form-actividad").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const form = ev.currentTarget;
    const ok = validar(form, { titulo: (v) => (v.length < 4 ? "Escribe un título de al menos 4 caracteres." : ""), fecha_limite: (v) => (v ? "" : "Elige una fecha límite."), descripcion: (v) => (v.length < 15 ? "Las instrucciones deben tener al menos 15 caracteres." : ""), recurso: (v) => (v && !/^https?:\/\//.test(v) ? "El enlace debe empezar por https://" : "") });
    if (!ok) return;
    const datos = { curso_id: Number(form.elements.curso_id.value), ficha: form.elements.ficha.value, modulo: Number(form.elements.modulo.value) || 1, tipo: tipoElegido, titulo: form.elements.titulo.value.trim(), objetivo: form.elements.objetivo.value.trim(), descripcion: form.elements.descripcion.value.trim(), fecha_limite: form.elements.fecha_limite.value, recurso: form.elements.recurso.value.trim(), docente: s.nombre };
    const editando = form.elements.id.value;
    if (!(await guardando(form, () => (editando ? D.actualizarActividad(editando, datos) : D.crearActividad(datos))))) return;
    if (editando) toast("Actividad actualizada");
    else { toast(`Actividad publicada para ${D.destinatarios(datos).length} estudiantes (${datos.ficha ? "ficha " + datos.ficha : "todas las fichas"}) 🚀`); celebrar(); }
    $("#modal-nueva-actividad").close(); navegar(actual === "cursos" ? "cursos" : "actividades", { sinFoco: true });
  });

  /* ---------- Modal: docente califica ---------- */
  const FRASES = ["¡Excelente trabajo! 🎉", "Se nota tu esfuerzo.", "Revisa de nuevo las instrucciones del punto 2.", "Agrega un ejemplo propio.", "Explica con tus palabras por qué lo hiciste así.", "Siguiente paso: intenta una versión más completa."];
  $("#mr-botones-nota").innerHTML = ["5.0", "4.5", "4.0", "3.5", "3.0"].map((n) => `<button type="button" class="chip" data-nota="${n}">${n}</button>`).join("");
  $("#mr-botones-nota").addEventListener("click", (e) => { const b = e.target.closest("[data-nota]"); if (b) $("#mr-nota").value = b.dataset.nota; });
  $("#mr-frases").innerHTML = FRASES.map((f) => `<button type="button" class="chip" data-frase="${esc(f)}">${esc(f)}</button>`).join("");
  $("#mr-frases").addEventListener("click", (e) => { const b = e.target.closest("[data-frase]"); if (!b) return; const t = $("#mr-comentario"); t.value = (t.value ? t.value.trim() + " " : "") + b.dataset.frase; t.focus(); });
  function abrirCalificar(id) {
    const e = D.entregas().find((x) => x.id === id); if (!e) return;
    const a = D.actividades().find((x) => x.id === e.actividad_id);
    $("#mr-cuerpo").innerHTML = `<div class="modal-act-cabecera"><span class="avatar">${esc(iniciales(e.nombre))}</span><div><span class="eyebrow">${esc(D.curso(a.curso_id)?.titulo || "")} · Ficha ${esc(D.fichaDe(e.correo, a.curso_id))}${etiquetaModulo(a)}</span><h2 id="mr-titulo">${esc(e.nombre)}</h2><p class="act-vence">${esc(a.titulo)} · entregada el ${fecha(e.creado)} ${e.creado.slice(0, 10) > a.fecha_limite ? '<span class="pill pill-no">Fuera de tiempo</span>' : '<span class="pill pill-ok">A tiempo</span>'}</p></div></div>
      ${a.objetivo ? `<div class="objetivo-caja">${ico("brujula", 18)}<div><strong>Objetivo de la actividad</strong><p>${esc(a.objetivo)}</p></div></div>` : ""}
      <h3>Respuesta del estudiante</h3><div class="instrucciones entrega-texto" data-no-traducir>${TCChatUI.formato(e.respuesta)}</div>${e.enlace ? `<p><a class="btn btn-outline btn-sm" href="${esc(e.enlace)}" target="_blank" rel="noopener">${ico("ojo", 15)} Abrir enlace entregado</a></p>` : ""}`;
    const form = $("#form-calificar"); form.reset(); $$(".error", form).forEach((x) => (x.hidden = true));
    form.elements.id.value = e.id; form.elements.nota.value = e.nota ?? ""; form.elements.comentario.value = e.comentario || "";
    $("#modal-entrega").showModal();
  }
  $("#form-calificar").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const form = ev.currentTarget;
    const ok = validar(form, { nota: (v) => { const n = Number(v); return v && n >= 1 && n <= 5 ? "" : "La nota debe estar entre 1.0 y 5.0."; }, comentario: (v) => (v.length < 5 ? "Escribe una retroalimentación para el estudiante." : "") });
    if (!ok) return;
    if (!(await guardando(form, () => D.calificar(form.elements.id.value, Math.round(Number(form.elements.nota.value) * 10) / 10, form.elements.comentario.value.trim())))) return;
    $("#modal-entrega").close(); toast("Calificación guardada ✅"); navegar(actual, { sinFoco: true });
  });

  /* Clics globales del contenido principal */
  main.addEventListener("click", (e) => {
    const t = e.target.closest("[data-abrir-actividad],[data-nueva-actividad],[data-editar-actividad],[data-eliminar-actividad],[data-ver-entregas],[data-calificar],[data-seguimiento],[data-plan-actividad]"); if (!t) return;
    if (t.dataset.abrirActividad) abrirActividad(t.dataset.abrirActividad);
    else if (t.dataset.planActividad) {
      abrirFormActividad(t.dataset.planActividad, null, t.dataset.modulo);
      const c = D.curso(t.dataset.planActividad), m = D.modulos(c).find((x) => x.numero === Number(t.dataset.modulo)), datos = actividadDelPlan(c, m), form = $("#form-actividad");
      ["titulo", "objetivo", "descripcion"].forEach((k) => (form.elements[k].value = datos[k]));
      tipoElegido = datos.tipo; pintarTipos();
      const fin = new Date(); fin.setDate(fin.getDate() + 14); form.elements.fecha_limite.value = fin.toISOString().slice(0, 10);
      toast("Actividad del plan lista: revísala y ajústala a tu grupo ✍️");
    }
    else if (t.dataset.seguimiento) abrirSeguimiento(t.dataset.seguimiento, t.dataset.curso, t.dataset.modulo);
    else if (t.hasAttribute("data-nueva-actividad")) { e.preventDefault(); abrirFormActividad(t.dataset.nuevaActividad, null, t.dataset.modulo); }
    else if (t.dataset.editarActividad) abrirFormActividad(null, D.actividades().find((a) => a.id === t.dataset.editarActividad));
    else if (t.dataset.verEntregas) { filtroActividad = t.dataset.verEntregas; filtroEstadoEntrega = ""; navegar("entregas"); }
    else if (t.dataset.calificar) abrirCalificar(t.dataset.calificar);
    else if (t.dataset.eliminarActividad) {
      const a = D.actividades().find((x) => x.id === t.dataset.eliminarActividad);
      if (t.dataset.confirmar) Promise.resolve(D.eliminarActividad(a.id)).then(() => { toast("Actividad eliminada"); navegar("actividades", { sinFoco: true }); }, (error) => toast(error.message, "error"));
      else { t.dataset.confirmar = "1"; t.innerHTML = "¿Eliminar? Toca de nuevo"; setTimeout(() => { if (t.isConnected) { delete t.dataset.confirmar; t.innerHTML = ico("basura", 15); } }, 3000); }
    }
  });

  /* Confeti suave al entregar o publicar (respeta movimiento reducido) */
  function celebrar() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const capa = document.createElement("div"); capa.className = "confeti"; capa.setAttribute("aria-hidden", "true");
    const colores = ["#1ab0d6", "#f8ac24", "#0f9a80", "#7dd3fc", "#ffffff"];
    capa.innerHTML = Array.from({ length: 40 }, (_, i) => `<i style="--x:${Math.random() * 100}vw;--d:${0.9 + Math.random() * 1.2}s;--r:${Math.random() * 720}deg;--c:${colores[i % 5]};--w:${6 + Math.random() * 6}px"></i>`).join("");
    document.body.append(capa); setTimeout(() => capa.remove(), 2500);
  }

  /* ---------- Guía de bienvenida (primera vez por rol) ---------- */
  const GUIA = rol === "estudiante" ? [
    { sel: ".app-nav", titulo: "Tu menú", texto: "Desde aquí vas a tus cursos, actividades, logros y al tutor IA. El número rojo te avisa cuántas actividades tienes pendientes." },
    { sel: "[data-guia=kpis]", titulo: "Tu resumen", texto: "Cursos activos, pendientes, entregas y tu promedio, siempre a la vista." },
    { sel: "[data-guia=siguiente]", titulo: "Tu siguiente paso", texto: "La actividad que vence primero. Ábrela, escribe tu respuesta y entrégala." },
    { sel: "[data-guia=ruta]", titulo: "Tu ruta", texto: "Cada curso es una parada. El círculo se llena a medida que entregas actividades." },
    { sel: ".tc-chat-launch", titulo: "Tu tutor IA", texto: "¿Dudas? Pregúntale por tus pendientes, pídele un plan de estudio o que te explique un concepto." },
  ] : [
    { sel: ".app-nav", titulo: "Tu menú docente", texto: "Cursos con sus fichas y módulos, actividades, entregas por revisar y el seguimiento de tus estudiantes módulo por módulo." },
    { sel: "[data-guia=revisar]", titulo: "Por revisar", texto: "Las entregas que esperan tu nota y comentario. Califica de 1.0 a 5.0." },
    { sel: "[data-guia=guia]", titulo: "Crea una actividad", texto: "Elige el curso, la ficha y el módulo, usa una plantilla didáctica y publícala: le llega a los estudiantes aprobados de esa ficha (o de todas)." },
    { sel: ".tc-chat-launch", titulo: "Tu copiloto IA", texto: "Pídele ideas de actividades para tu curso, una rúbrica o quién necesita apoyo." },
  ];
  $("#btn-guia").addEventListener("click", () => { if (actual !== "inicio") navegar("inicio"); setTimeout(() => TCGuia.iniciar(GUIA, null, true), 250); });

  addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h !== actual && SECCIONES.some((x) => x[0] === h)) navegar(h); });
  const inicial = location.hash.slice(1);
  main.innerHTML = `<div class="vacio"><span class="spinner" aria-hidden="true"></span><p>Cargando tu espacio…</p></div>`;
  (window.TCListo || Promise.resolve()).then(() => {
    navegar(RENDER[inicial] && SECCIONES.some((x) => x[0] === inicial) ? inicial : "inicio", { sinFoco: true });
    setTimeout(() => TCGuia.iniciar(GUIA, "tc_guia_" + rol), 900);
  });
})();
