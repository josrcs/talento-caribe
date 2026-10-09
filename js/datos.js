/* ==========================================================
   datos.js - Modelo de datos compartido
   Dos modos (lo decide js/config.js):
   - Demostración (Live Server): todo se guarda en el navegador (localStorage).
   - API (servidor en localhost:3000): los datos vienen de PostgreSQL.
     GET  /api/datos                      -> cargar() (lo que el usuario puede ver)
     POST /api/actividades                -> crearActividad()
     PUT  /api/actividades/:id/entrega    -> entregar()
     PATCH /api/entregas/:id              -> calificar()
     POST /api/inscripciones              -> inscribir() ... (ver backend/README.md)
   Las funciones de lectura son iguales en ambos modos; las de escritura
   devuelven una promesa en modo API (se usan con await).
   window.TCListo es una promesa que se cumple cuando los datos están listos.
   Requiere utils.js y cursos-data.js cargados antes.
   ========================================================== */
(() => {
  const API = window.TC?.MODO_DEMO === false;
  /* En modo API los datos viven en memoria (copia de lo que devolvió el servidor) */
  const memoria = { tc_inscripciones: [], tc_actividades: [], tc_entregas: [], tc_mensajes: [], tc_gastos_demo: [], tc_ia: null };
  window.TALENTO_CARIBE_FICHAS = window.TALENTO_CARIBE_FICHAS || [];
  const leerLocal = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const guardarLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ } };
  const leer = (k, d) => (API && k in memoria ? JSON.parse(JSON.stringify(memoria[k] ?? d ?? null)) ?? d : leerLocal(k, d));
  const guardar = (k, v) => { if (API && k in memoria) memoria[k] = v; else guardarLocal(k, v); };

  /* ---------- Cliente de la API ---------- */
  const sesionActual = () => leerLocal("tc_sesion_demo", null);
  async function pedir(metodo, ruta, cuerpo) {
    const token = sesionActual()?.token;
    let res;
    try {
      res = await fetch(window.TC.API_URL + ruta, { method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    } catch {
      throw new Error("No hay conexión con el servidor. Revisa que esté encendido (npm start).");
    }
    const datos = await res.json().catch(() => ({}));
    if (res.status === 401 && token) {
      // La sesión venció: se cierra y se vuelve al inicio de sesión
      localStorage.removeItem("tc_sesion_demo");
      location.href = (location.pathname.includes("/admin/") ? "" : "admin/") + "login.html";
    }
    if (!res.ok) { const e = new Error(datos.error || "No se pudo completar la acción."); e.status = res.status; e.campos = datos.campos; throw e; }
    return datos;
  }
  window.TCApi = { activa: API, pedir };
  // Una sesión del modo demostración (sin token) no sirve contra el servidor: se descarta
  if (API && sesionActual() && !sesionActual().token) localStorage.removeItem("tc_sesion_demo");
  const cursos = () => window.TALENTO_CARIBE_CURSOS || [];
  const curso = (id) => cursos().find((c) => Number(c.id) === Number(id));
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const norm = (t) => String(t || "").trim().toLowerCase();

  /* Un docente por cada mentor. Cada uno dicta los cursos donde aparece como instructor. */
  const DOCENTES = [
    { nombre: "Camila Ospino", correo: "docente@talentocaribe.co", clave: "Docente123", especialidad: "Desarrollo web", iniciales: "CO" },
    { nombre: "Daniel Barrios", correo: "daniel@talentocaribe.co", clave: "Docente123", especialidad: "Programación y datos", iniciales: "DB" },
    { nombre: "Valeria De la Hoz", correo: "valeria@talentocaribe.co", clave: "Docente123", especialidad: "IA aplicada", iniciales: "VH" },
    { nombre: "Andrés Pacheco", correo: "andres@talentocaribe.co", clave: "Docente123", especialidad: "Electrónica y robótica", iniciales: "AP" },
    { nombre: "Laura Mendoza", correo: "laura@talentocaribe.co", clave: "Docente123", especialidad: "Hardware e IoT", iniciales: "LM" },
  ];

  const TIPOS = {
    Tarea: { icono: "lapiz", color: "#1ab0d6" },
    Práctica: { icono: "codigo", color: "#1268c8" },
    Quiz: { icono: "pregunta", color: "#f8ac24" },
    Lectura: { icono: "libro", color: "#0f9a80" },
    Proyecto: { icono: "cohete", color: "#a78bfa" },
  };

  const enDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };

  /* Datos iniciales para que la demostración tenga vida desde el primer ingreso */
  function sembrar() {
    if (API || leer("tc_semilla_v4", false)) return; // en modo API los datos iniciales vienen de database/seed.sql
    const ins = leer("tc_inscripciones", []);
    const agregar = (curso_id, nombre, correo, estado, dias, ficha) => {
      const previa = ins.find((i) => norm(i.correo) === correo && Number(i.curso_id) === curso_id);
      if (previa) { if (!previa.ficha) previa.ficha = ficha; return; }
      ins.push({ curso_id, ficha, nombre, correo, edad: 17, estado, creado: haceDias(dias) });
    };
    agregar(1, "Sofía Pérez", "estudiante@talentocaribe.co", "aprobada", 20, "25896");
    agregar(3, "Sofía Pérez", "estudiante@talentocaribe.co", "aprobada", 18, "25921");
    agregar(7, "Sofía Pérez", "estudiante@talentocaribe.co", "aprobada", 12, "25963");
    agregar(1, "Luis Gómez", "luis.gomez@correo.com", "aprobada", 19, "25896");
    agregar(1, "Andrea Castro", "andrea.castro@correo.com", "aprobada", 18, "25896");
    agregar(3, "María Torres", "maria.torres@correo.com", "aprobada", 15, "25921");
    agregar(3, "Kevin Ariza", "kevin.ariza@correo.com", "aprobada", 14, "25921");
    agregar(8, "Daniela Ruiz", "daniela.ruiz@correo.com", "aprobada", 11, "25974");
    agregar(9, "Kevin Ariza", "kevin.ariza@correo.com", "pendiente", 3, "25985");
    agregar(2, "Luis Gómez", "luis.gomez@correo.com", "pendiente", 2, "25910");
    agregar(7, "María Torres", "maria.torres@correo.com", "aprobada", 9, "25963");
    agregar(4, "Daniela Ruiz", "daniela.ruiz@correo.com", "pendiente", 1, "25935");
    guardar("tc_inscripciones", ins);

    const acts = [
      { id: "act-demo-1", curso_id: 1, modulo: 1, ficha: "", docente: "Daniel Barrios", tipo: "Práctica", titulo: "El algoritmo de tu mañana", descripcion: "Escribe, paso a paso, lo que haces desde que te levantas hasta que sales de casa.\n1. Usa verbos al inicio de cada paso.\n2. Incluye al menos una decisión (SI llueve... ENTONCES...).\n3. Incluye al menos una repetición (MIENTRAS...).", objetivo: "Reconocer que un algoritmo es una secuencia ordenada de pasos.", fecha_limite: enDias(3), recurso: "", creado: haceDias(4) },
      { id: "act-demo-2", curso_id: 3, modulo: 1, ficha: "", docente: "Camila Ospino", tipo: "Tarea", titulo: "Tu primera página con 5 etiquetas", descripcion: "Crea un archivo index.html que use: h1, p, a, img y ul.\nEl tema es libre: tu comida caribeña favorita, tu barrio o un emprendimiento.\nPega el enlace de tu página (GitHub Pages o CodePen) o el código.", objetivo: "Usar etiquetas HTML básicas para estructurar contenido.", fecha_limite: enDias(5), recurso: "https://developer.mozilla.org/es/docs/Learn/HTML", creado: haceDias(2) },
      { id: "act-demo-3", curso_id: 7, modulo: 4, ficha: "", docente: "Valeria De la Hoz", tipo: "Quiz", titulo: "3 prompts para estudiar mejor", descripcion: "Escribe 3 prompts que te ayuden a estudiar un tema del colegio o del curso.\nPara cada uno explica qué rol le das a la IA y cómo verificarías su respuesta.", objetivo: "Escribir instrucciones claras y verificar respuestas de la IA.", fecha_limite: enDias(-1), recurso: "", creado: haceDias(7) },
      { id: "act-demo-4", curso_id: 3, modulo: 1, ficha: "", docente: "Camila Ospino", tipo: "Lectura", titulo: "¿Cómo funciona la web?", descripcion: "Lee el recurso y responde con tus palabras:\n1. ¿Qué es un navegador?\n2. ¿Qué pasa cuando escribes una dirección web?", objetivo: "Comprender el recorrido de una página desde el servidor hasta tu pantalla.", fecha_limite: enDias(9), recurso: "https://developer.mozilla.org/es/docs/Learn/Getting_started_with_the_web/How_the_Web_works", creado: haceDias(1) },
      { id: "act-demo-5", curso_id: 8, modulo: 3, ficha: "", docente: "Andrés Pacheco", tipo: "Práctica", titulo: "Calcula la resistencia de tu LED", descripcion: "Con una fuente de 5V y un LED rojo (2V, 20mA), calcula la resistencia con la ley de Ohm. Explica cada paso.", objetivo: "Aplicar V = I × R en un circuito real.", fecha_limite: enDias(4), recurso: "", creado: haceDias(2) },
      { id: "act-demo-6", curso_id: 1, modulo: 1, ficha: "25896", docente: "Daniel Barrios", tipo: "Quiz", titulo: "Algoritmos en la tienda del barrio", descripcion: "Responde con tus palabras:\n1. ¿Qué pasos sigue el tendero para cobrarte?\n2. ¿Dónde hay una decisión?\n3. ¿Dónde hay una repetición?", objetivo: "Identificar algoritmos en situaciones cotidianas.", fecha_limite: enDias(-3), recurso: "", creado: haceDias(10) },
      { id: "act-demo-7", curso_id: 1, modulo: 4, ficha: "25896", docente: "Daniel Barrios", tipo: "Tarea", titulo: "Variables de una tienda", descripcion: "Haz una lista de 5 datos que guarda una tienda (precio, cantidad, nombre...).\nPara cada uno indica su tipo de dato y un ejemplo de valor.", objetivo: "Reconocer variables y tipos de datos.", fecha_limite: enDias(6), recurso: "", creado: haceDias(1) },
      { id: "act-demo-8", curso_id: 3, modulo: 3, ficha: "25921", docente: "Camila Ospino", tipo: "Práctica", titulo: "Dale color a tu página", descripcion: "Usa CSS para cambiar en tu página:\n1. El color de fondo y de los títulos.\n2. La tipografía.\n3. Márgenes y relleno de al menos dos bloques.", objetivo: "Aplicar colores, tipografías y modelo de caja.", fecha_limite: enDias(12), recurso: "", creado: haceDias(0) },
    ];
    const actuales = leer("tc_actividades", []);
    acts.forEach((a) => {
      const previa = actuales.find((x) => x.id === a.id);
      if (!previa) actuales.push(a);
      else Object.assign(previa, { modulo: a.modulo, ficha: previa.ficha ?? a.ficha }); // los módulos de los cursos se actualizaron
    });
    guardar("tc_actividades", actuales);

    const ent = leer("tc_entregas", []);
    const entrega = (actividad_id, nombre, correo, respuesta, extra = {}) => {
      if (!ent.some((e) => e.actividad_id === actividad_id && norm(e.correo) === correo)) ent.push({ id: uid("ent"), actividad_id, nombre, correo, respuesta, enlace: "", estado: "entregada", nota: null, comentario: "", creado: haceDias(1), ...extra });
    };
    entrega("act-demo-3", "Sofía Pérez", "estudiante@talentocaribe.co", "1. Actúa como profesor de biología y explícame la fotosíntesis con un ejemplo de Barranquilla.\n2. Hazme 5 preguntas tipo examen sobre fracciones.\n3. Resume este texto en 5 ideas y dime qué fuentes revisar.", { estado: "revisada", nota: 4.6, comentario: "¡Muy buen trabajo, Sofía! Tus roles son claros. Para el tercero, pide también que la IA señale qué partes no está segura.", revisado: haceDias(0) });
    entrega("act-demo-1", "Luis Gómez", "luis.gomez@correo.com", "1. Apagar la alarma\n2. SI tengo sueño ENTONCES pospongo 5 min\n3. MIENTRAS no esté listo: vestirme...");
    entrega("act-demo-2", "María Torres", "maria.torres@correo.com", "Hice una página sobre la arepa de huevo.", { enlace: "https://codepen.io/" });
    entrega("act-demo-3", "María Torres", "maria.torres@correo.com", "Prompts para estudiar inglés...", { estado: "revisada", nota: 2.8, comentario: "Vas bien, pero falta explicar cómo verificarías las respuestas.", revisado: haceDias(1) });
    entrega("act-demo-6", "Sofía Pérez", "estudiante@talentocaribe.co", "1. Me saluda, 2. pregunta qué quiero, 3. SI tiene el producto lo busca, 4. MIENTRAS haya productos los suma, 5. me cobra.", { estado: "revisada", nota: 4.2, comentario: "Muy bien identificada la repetición. Revisa el orden del paso 3.", revisado: haceDias(2), creado: haceDias(4) });
    entrega("act-demo-6", "Andrea Castro", "andrea.castro@correo.com", "El tendero escucha, busca, suma y cobra. Si no hay cambio, pide sencillo.", { estado: "revisada", nota: 3.6, comentario: "Bien la decisión del cambio. Falta la repetición.", revisado: haceDias(2), creado: haceDias(4) });
    entrega("act-demo-1", "Andrea Castro", "andrea.castro@correo.com", "1. Me levanto\n2. SI hace calor ENTONCES me baño con agua fría\n3. MIENTRAS desayuno escucho música.");
    entrega("act-demo-4", "Kevin Ariza", "kevin.ariza@correo.com", "El navegador es el programa que pide la página al servidor y la dibuja en pantalla.", { estado: "revisada", nota: 4.0, comentario: "Clara tu explicación. Agrega qué papel cumple el DNS.", revisado: haceDias(0) });
    guardar("tc_entregas", ent);
    guardar("tc_semilla_v4", true);
  }

  /* ---------- Consultas ---------- */
  const inscripciones = () => leer("tc_inscripciones", []);
  const actividades = () => leer("tc_actividades", []);
  const entregas = () => leer("tc_entregas", []);

  /* ---------- Fichas y módulos ---------- */
  const fichas = () => window.TALENTO_CARIBE_FICHAS || [];
  const ficha = (numero) => fichas().find((f) => String(f.numero) === String(numero));
  const fichasDeCurso = (id) => fichas().filter((f) => Number(f.curso_id) === Number(id));
  const fichaAbierta = (id) => fichasDeCurso(id).find((f) => f.estado === "Inscripciones abiertas") || fichasDeCurso(id).find((f) => f.estado !== "Finalizada") || fichasDeCurso(id)[0];
  const modulos = (c) => (c ? (c.modulos?.length ? c.modulos : window.TCModulos ? window.TCModulos(c) : []) : []);
  /* Ficha de una inscripción (las antiguas sin ficha quedan en la primera ficha del curso) */
  const fichaDeInscripcion = (i) => i?.ficha || fichasDeCurso(i?.curso_id)[0]?.numero || "";
  const fichaDe = (correo, curso_id) => fichaDeInscripcion(inscripciones().find((i) => norm(i.correo) === norm(correo) && Number(i.curso_id) === Number(curso_id)));
  /* ¿Una actividad le llega a esta ficha? (sin ficha = a todas las fichas del curso) */
  const llegaA = (a, numero) => !a.ficha || String(a.ficha) === String(numero);

  const docentePorCorreo = (correo) => DOCENTES.find((d) => norm(d.correo) === norm(correo));
  const cursosDeDocente = (nombre) => cursos().filter((c) => norm(c.instructor) === norm(nombre));
  const matriculas = (correo) => inscripciones().filter((i) => norm(i.correo) === norm(correo));
  const cursosDeEstudiante = (correo) => matriculas(correo).filter((i) => i.estado === "aprobada").map((i) => curso(i.curso_id)).filter(Boolean);
  const estudiantesDeCurso = (id, numeroFicha = "") => {
    const vistos = new Set();
    return inscripciones().filter((i) => Number(i.curso_id) === Number(id) && i.estado === "aprobada" && (!numeroFicha || fichaDeInscripcion(i) === String(numeroFicha)) && !vistos.has(norm(i.correo)) && vistos.add(norm(i.correo)))
      .map((i) => ({ ...i, ficha: fichaDeInscripcion(i) }));
  };
  const estudiantesDeFicha = (numero) => { const f = ficha(numero); return f ? estudiantesDeCurso(f.curso_id, f.numero) : []; };
  const fichasDeDocente = (nombre) => { const ids = new Set(cursosDeDocente(nombre).map((c) => Number(c.id))); return fichas().filter((f) => ids.has(Number(f.curso_id))); };
  /* Estudiantes que deben entregar una actividad (los de su ficha, o de todo el curso) */
  const destinatarios = (a) => (a.ficha ? estudiantesDeCurso(a.curso_id, a.ficha) : estudiantesDeCurso(a.curso_id));
  const actividadesDeCurso = (id) => actividades().filter((a) => Number(a.curso_id) === Number(id)).sort((a, b) => (a.fecha_limite || "").localeCompare(b.fecha_limite || ""));
  const actividadesDeDocente = (nombre) => { const ids = new Set(cursosDeDocente(nombre).map((c) => Number(c.id))); return actividades().filter((a) => ids.has(Number(a.curso_id))); };
  const actividadesDeEstudiante = (correo) => { const ids = new Set(cursosDeEstudiante(correo).map((c) => Number(c.id))); return actividades().filter((a) => ids.has(Number(a.curso_id)) && llegaA(a, fichaDe(correo, a.curso_id))).sort((a, b) => (a.fecha_limite || "").localeCompare(b.fecha_limite || "")); };
  const entregaDe = (actividad_id, correo) => entregas().find((e) => e.actividad_id === actividad_id && norm(e.correo) === norm(correo));
  const entregasDeActividad = (actividad_id) => entregas().filter((e) => e.actividad_id === actividad_id);

  /* Estado de una actividad para un estudiante: pendiente, vencida, entregada o revisada */
  function estadoPara(actividad, correo) {
    const e = entregaDe(actividad.id, correo);
    if (e) return e.estado;
    return diasRestantes(actividad.fecha_limite) < 0 ? "vencida" : "pendiente";
  }
  function diasRestantes(fecha) {
    if (!fecha) return Infinity;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fecha + "T00:00:00");
    return Math.round((limite - hoy) / 86400000);
  }
  function textoVence(fecha) {
    const d = diasRestantes(fecha);
    if (d === Infinity) return "Sin fecha límite";
    if (d < 0) return `Venció hace ${-d} ${-d === 1 ? "día" : "días"}`;
    if (d === 0) return "Vence hoy";
    if (d === 1) return "Vence mañana";
    return `Vence en ${d} días`;
  }
  function progreso(correo, curso_id) {
    const f = fichaDe(correo, curso_id);
    const acts = actividadesDeCurso(curso_id).filter((a) => llegaA(a, f));
    const hechas = acts.filter((a) => entregaDe(a.id, correo)).length;
    const notas = acts.map((a) => entregaDe(a.id, correo)?.nota).filter((n) => typeof n === "number");
    return { total: acts.length, hechas, porcentaje: acts.length ? Math.round((hechas / acts.length) * 100) : 0, promedio: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null };
  }

  /* Avance de un estudiante en cada módulo de un curso.
     estado: "completo" (entregó todo), "en-curso", "sin-iniciar" o "sin-actividades" */
  function progresoModulos(correo, curso_id) {
    const c = curso(curso_id), f = fichaDe(correo, curso_id);
    const acts = actividadesDeCurso(curso_id).filter((a) => llegaA(a, f));
    return modulos(c).map((m) => {
      const delModulo = acts.filter((a) => Number(a.modulo || 1) === m.numero);
      const ents = delModulo.map((a) => entregaDe(a.id, correo)).filter(Boolean);
      const notas = ents.map((e) => e.nota).filter((n) => typeof n === "number");
      const vencidas = delModulo.filter((a) => !entregaDe(a.id, correo) && diasRestantes(a.fecha_limite) < 0).length;
      const total = delModulo.length, hechas = ents.length;
      const estado = !total ? "sin-actividades" : hechas === total ? "completo" : hechas ? "en-curso" : "sin-iniciar";
      return { ...m, total, hechas, vencidas, calificadas: notas.length, porcentaje: total ? Math.round((hechas / total) * 100) : 0, promedio: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null, estado, actividades_publicadas: delModulo };
    });
  }

  /* ---------- Escrituras ---------- */
  /* En modo API: se envía al servidor y luego se recargan los datos */
  const yRecargar = async (promesa) => { const r = await promesa; await cargar(); return r; };

  function crearActividad(datos) {
    if (API) return yRecargar(pedir("POST", "/actividades", datos));
    const lista = actividades();
    const act = { id: uid("act"), creado: new Date().toISOString(), ...datos };
    lista.push(act); guardar("tc_actividades", lista); return act;
  }
  function actualizarActividad(id, cambios) {
    if (API) return yRecargar(pedir("PUT", "/actividades/" + id, cambios));
    const lista = actividades(), i = lista.findIndex((a) => a.id === id);
    if (i >= 0) { lista[i] = { ...lista[i], ...cambios }; guardar("tc_actividades", lista); }
  }
  function eliminarActividad(id) {
    if (API) return yRecargar(pedir("DELETE", "/actividades/" + id));
    guardar("tc_actividades", actividades().filter((a) => a.id !== id));
    guardar("tc_entregas", entregas().filter((e) => e.actividad_id !== id));
  }
  function entregar({ actividad_id, nombre, correo, respuesta, enlace }) {
    if (API) return yRecargar(pedir("PUT", `/actividades/${actividad_id}/entrega`, { respuesta, enlace }));
    const lista = entregas(), i = lista.findIndex((e) => e.actividad_id === actividad_id && norm(e.correo) === norm(correo));
    const base = { actividad_id, nombre, correo: norm(correo), respuesta, enlace, estado: "entregada", nota: null, comentario: "", creado: new Date().toISOString() };
    if (i >= 0) lista[i] = { ...lista[i], ...base }; else lista.push({ id: uid("ent"), ...base });
    guardar("tc_entregas", lista);
  }
  function calificar(id, nota, comentario) {
    if (API) return yRecargar(pedir("PATCH", "/entregas/" + id, { nota, comentario }));
    const lista = entregas(), i = lista.findIndex((e) => e.id === id);
    if (i >= 0) { lista[i] = { ...lista[i], nota, comentario, estado: "revisada", revisado: new Date().toISOString() }; guardar("tc_entregas", lista); }
  }

  /* ---------- Funciones del panel administrativo y de inscripción ---------- */
  function inscribir(curso_id, edad, sesion, numeroFicha) {
    const f = numeroFicha || fichaAbierta(curso_id)?.numero || "";
    if (API) return yRecargar(pedir("POST", "/inscripciones", { curso_id, ficha: f }));
    const lista = inscripciones();
    lista.push({ curso_id, ficha: f, nombre: sesion.nombre, correo: sesion.correo, edad, estado: "pendiente", creado: new Date().toISOString() });
    guardar("tc_inscripciones", lista);
  }
  function cambiarEstadoInscripcion(indice, estado) {
    const lista = inscripciones(), item = lista[indice];
    if (API) return yRecargar(pedir("PATCH", "/inscripciones/" + item.id, { estado }));
    item.estado = estado; guardar("tc_inscripciones", lista);
  }
  function marcarLeido(indice) {
    const lista = leer("tc_mensajes", []), m = lista[indice];
    if (API) return yRecargar(pedir("PATCH", `/mensajes/${m.id}/leido`));
    m.leido = true; guardar("tc_mensajes", lista);
  }
  function registrarGasto(gasto) {
    if (API) return yRecargar(pedir("POST", "/gastos", gasto));
    guardar("tc_gastos_demo", [...leer("tc_gastos_demo", []), { ...gasto, creado: new Date().toISOString() }]);
  }
  function guardarIA(config) {
    if (API) return yRecargar(pedir("PUT", "/config-ia", config));
    guardar("tc_ia", config);
  }
  function guardarCurso(c) {
    if (API) return yRecargar(c.id && cursos().some((x) => Number(x.id) === Number(c.id)) ? pedir("PUT", "/cursos/" + c.id, c) : pedir("POST", "/cursos", c));
    const guardados = leer("tc_cursos_demo", []), i = guardados.findIndex((x) => Number(x.id) === Number(c.id));
    if (i >= 0) guardados[i] = c; else guardados.push(c);
    guardar("tc_cursos_demo", guardados);
  }
  function guardarFicha(f) {
    if (API) return yRecargar(ficha(f.numero) && f.existente ? pedir("PUT", "/fichas/" + f.numero, f) : pedir("POST", "/fichas", f));
    const { existente, ...datos } = f;
    const guardadas = leer("tc_fichas_demo", []), i = guardadas.findIndex((x) => x.numero === datos.numero);
    if (i >= 0) guardadas[i] = datos; else guardadas.push(datos);
    guardar("tc_fichas_demo", guardadas);
    const lista = window.TALENTO_CARIBE_FICHAS, j = lista.findIndex((x) => x.numero === datos.numero);
    if (j >= 0) lista[j] = datos; else lista.push(datos);
  }
  /* Siguiente número de ficha libre (5 dígitos, consecutivo) */
  const siguienteFicha = () => String(Math.max(25000, ...fichas().map((f) => Number(f.numero) || 0)) + 1);
  async function fichaEstudiante(correo) {
    if (API) return pedir("GET", "/estudiantes/" + encodeURIComponent(correo));
    return leer("tc_cuentas_demo", []).find((x) => norm(x.correo) === norm(correo)) || leer("tc_perfiles_demo", []).find((x) => norm(x.correo) === norm(correo)) || null;
  }

  /* ---------- Carga desde el servidor (modo API) ---------- */
  async function cargar() {
    const d = await pedir("GET", "/datos");
    const catalogo = window.TALENTO_CARIBE_CURSOS;
    catalogo.splice(0, catalogo.length, ...d.cursos);  // se reemplaza en el mismo arreglo (CURSOS lo comparte)
    catalogo.forEach((c) => { c.modulos = window.TCModulos ? window.TCModulos(c) : c.modulos || []; });
    const listaFichas = window.TALENTO_CARIBE_FICHAS;
    listaFichas.splice(0, listaFichas.length, ...(d.fichas || []));
    memoria.tc_inscripciones = d.inscripciones;
    memoria.tc_actividades = d.actividades;
    memoria.tc_entregas = d.entregas;
    memoria.tc_mensajes = d.mensajes;
    memoria.tc_gastos_demo = d.gastos;
    memoria.tc_ia = d.ia;
    return d;
  }
  if (API && window.TCUtil) {
    // El panel y el asistente leen con TCUtil.leer: en modo API esas claves salen de la memoria
    const leerOriginal = TCUtil.leer;
    TCUtil.leer = (k, d) => (k in memoria ? leer(k, d) : leerOriginal(k, d));
  }
  window.TCListo = API
    ? cargar().catch((error) => {
        console.error(error);
        document.addEventListener("DOMContentLoaded", () => window.TCUtil?.toast?.(error.message, "error"));
      })
    : Promise.resolve();

  sembrar();
  window.TCDatos = {
    DOCENTES, TIPOS, curso, cursos, inscripciones, actividades, entregas,
    fichas, ficha, fichasDeCurso, fichaAbierta, fichasDeDocente, fichaDe, fichaDeInscripcion, estudiantesDeFicha, destinatarios, llegaA, modulos, progresoModulos, guardarFicha, siguienteFicha,
    docentePorCorreo, cursosDeDocente, matriculas, cursosDeEstudiante, estudiantesDeCurso,
    actividadesDeCurso, actividadesDeDocente, actividadesDeEstudiante, entregaDe, entregasDeActividad,
    estadoPara, diasRestantes, textoVence, progreso,
    crearActividad, actualizarActividad, eliminarActividad, entregar, calificar,
    inscribir, cambiarEstadoInscripcion, marcarLeido, registrarGasto, guardarIA, guardarCurso, fichaEstudiante,
    cargar, api: API,
  };
})();
