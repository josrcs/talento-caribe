/* ==========================================================
   asistente-ia.js - Asistente IA de Talento Caribe
   1. TCAsistente: "cerebro" que responde según el rol (estudiante,
      docente, administrativo o visitante) usando los datos reales
      de la plataforma (actividades, entregas, inscripciones).
      En modo demostración responde con reglas locales; con MODO_DEMO
      en false envía la pregunta + contexto a POST /api/chat.
   2. TCChatUI: componente de chat completo (historial, sugerencias,
      acciones, indicador de escritura, copiar, nueva conversación).
   Requiere: utils.js, iconos.js y (opcional) datos.js.
   ========================================================== */
(() => {
  const D = () => window.TCDatos;
  const S = () => window.TCUtil?.sesion?.() || null;
  const sinTildes = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const tiene = (t, ...palabras) => palabras.some((p) => (p instanceof RegExp ? p.test(t) : t.includes(p)));
  const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const nombreCorto = (s) => (s?.nombre || "").split(" ")[0] || "";
  const titulo = (c) => c ? `**${c.titulo}**` : "";

  /* Idioma: "es" o "en" (preferencias.js). L(es, en) devuelve el texto del idioma activo. */
  const EN = () => (window.TCIdioma?.actual || "es") === "en";
  const L = (es, en) => (EN() ? en : es);
  const tituloCurso = (c) => (c ? (EN() ? (window.TCIdioma?.t(c.titulo) || c.titulo) : c.titulo) : "");

  /* ---------- Conocimiento didáctico: glosario con ejemplo y mini reto (ES/EN) ---------- */
  const GLOSARIO = [
    { claves: ["algoritmo", "algorithm"], termino: ["Algoritmo", "Algorithm"], def: ["Es una lista ordenada de pasos para resolver un problema. Como una receta: si cambias el orden, el resultado cambia.", "An ordered list of steps to solve a problem. Like a recipe: if you change the order, the result changes."], ejemplo: ["Preparar un jugo de corozo: 1) lavar la fruta, 2) licuar con agua, 3) colar, 4) endulzar.", "Making corozo juice: 1) wash the fruit, 2) blend with water, 3) strain, 4) sweeten."], reto: ["Escribe el algoritmo para cruzar una calle de forma segura en 5 pasos.", "Write the algorithm to cross a street safely in 5 steps."] },
    { claves: ["variable"], termino: ["Variable", "Variable"], def: ["Es una cajita con nombre donde el programa guarda un dato que puede cambiar.", "A labeled little box where a program stores a value that can change."], ejemplo: ["`edad = 16` guarda el número 16 en la cajita llamada edad.", "`age = 16` stores the number 16 in the box called age."], reto: ["¿Qué variables necesitaría una app que vende raspaos? (nombre, precio...)", "Which variables would an app that sells shaved ice need? (name, price...)"] },
    { claves: ["condicional", " if ", "si entonces", "conditional"], termino: ["Condicional", "Conditional"], def: ["Permite que el programa tome decisiones: SI pasa algo, haz esto; SI NO, haz aquello.", "Lets a program make decisions: IF something happens, do this; OTHERWISE, do that."], ejemplo: ["`if lluvia: llevar_paraguas()`", "`if rain: take_umbrella()`"], reto: ["Escribe un condicional que diga si una persona puede entrar a un curso que pide 14 años.", "Write a conditional that says whether someone can join a course that requires age 14."] },
    { claves: ["ciclo", "bucle", " for ", "while", "mientras", "loop"], termino: ["Ciclo (bucle)", "Loop"], def: ["Repite instrucciones varias veces sin escribirlas de nuevo.", "Repeats instructions several times without writing them again."], ejemplo: ["`for i in range(5): print('¡Wepa!')` imprime 5 veces.", "`for i in range(5): print('Wepa!')` prints 5 times."], reto: ["¿Cómo usarías un ciclo para contar del 1 al 100?", "How would you use a loop to count from 1 to 100?"] },
    { claves: ["funcion", "function"], termino: ["Función", "Function"], def: ["Es un bloque de código con nombre que puedes reutilizar. Recibe datos, hace algo y puede devolver un resultado.", "A named block of code you can reuse. It receives data, does something and can return a result."], ejemplo: ["`def saludar(nombre): return 'Hola ' + nombre`", "`def greet(name): return 'Hello ' + name`"], reto: ["Crea (en papel) una función que calcule el precio con descuento.", "Design (on paper) a function that calculates a discounted price."] },
    { claves: ["html"], termino: ["HTML", "HTML"], def: ["Es el lenguaje que da **estructura** a una página web: títulos, párrafos, imágenes, enlaces.", "The language that gives a web page its **structure**: headings, paragraphs, images, links."], ejemplo: ["`<h1>Talento Caribe</h1>` crea un título principal.", "`<h1>Talento Caribe</h1>` creates a main heading."], reto: ["Nombra 3 etiquetas HTML que verías en una página de noticias.", "Name 3 HTML tags you would see on a news page."] },
    { claves: ["css"], termino: ["CSS", "CSS"], def: ["Es el lenguaje que da **estilo** a la página: colores, tamaños, posiciones y animaciones.", "The language that gives a page its **style**: colors, sizes, positions and animations."], ejemplo: ["`h1 { color: turquoise; }` pinta los títulos de turquesa.", "`h1 { color: turquoise; }` paints headings turquoise."], reto: ["¿Qué propiedad CSS usarías para cambiar el tamaño de un texto?", "Which CSS property would you use to change the size of text?"] },
    { claves: ["javascript", " js"], termino: ["JavaScript", "JavaScript"], def: ["Es el lenguaje que hace las páginas **interactivas**: responde a clics, valida formularios y cambia contenido.", "The language that makes pages **interactive**: it reacts to clicks, validates forms and changes content."], ejemplo: ["`boton.onclick = () => alert('¡Hola!')`", "`button.onclick = () => alert('Hi!')`"], reto: ["Piensa en 2 cosas de una página que funcionan gracias a JavaScript.", "Think of 2 things on a web page that work thanks to JavaScript."] },
    { claves: ["python"], termino: ["Python", "Python"], def: ["Un lenguaje de programación fácil de leer, usado en datos, automatización e inteligencia artificial.", "An easy-to-read programming language used for data, automation and artificial intelligence."], ejemplo: ["`print('Hola, Barranquilla')`", "`print('Hello, Barranquilla')`"], reto: ["¿Qué tarea aburrida de tu día automatizarías con Python?", "Which boring daily task would you automate with Python?"] },
    { claves: ["sql", "base de datos", "bases de datos", "database"], termino: ["Base de datos y SQL", "Databases and SQL"], def: ["Una base de datos guarda información organizada en tablas. SQL es el idioma para preguntarle cosas.", "A database stores information organized in tables. SQL is the language you use to ask it questions."], ejemplo: ["`SELECT nombre FROM estudiantes WHERE edad > 15;`", "`SELECT name FROM students WHERE age > 15;`"], reto: ["Diseña una tabla para guardar los libros de una biblioteca: ¿qué columnas tendría?", "Design a table to store a library's books: which columns would it have?"] },
    { claves: [" git ", "github"], termino: ["Git y GitHub", "Git and GitHub"], def: ["Git guarda el historial de cambios de tu proyecto; GitHub lo publica en internet para compartir y colaborar.", "Git keeps the history of your project's changes; GitHub publishes it online to share and collaborate."], ejemplo: ["`git commit -m \"Agrego menú\"` guarda una foto de tu avance.", "`git commit -m \"Add menu\"` saves a snapshot of your progress."], reto: ["Escribe un buen mensaje de commit para un cambio de color en tu página.", "Write a good commit message for a color change on your page."] },
    { claves: ["arduino"], termino: ["Arduino", "Arduino"], def: ["Una placa pequeña que programas para leer sensores y controlar luces, motores y sonidos.", "A small board you program to read sensors and control lights, motors and sounds."], ejemplo: ["Un LED que parpadea cada segundo es el 'hola mundo' de Arduino.", "An LED that blinks every second is Arduino's 'hello world'."], reto: ["¿Qué sensor usarías para una alarma de parqueo?", "Which sensor would you use for a parking alarm?"] },
    { claves: ["ohm", "voltaje", "corriente", "resistencia", "voltage", "current", "resistance"], termino: ["Ley de Ohm", "Ohm's law"], def: ["Relaciona voltaje (V), corriente (I) y resistencia (R): **V = I × R**.", "It relates voltage (V), current (I) and resistance (R): **V = I × R**."], ejemplo: ["Con 5V y 0.02A: R = 5 ÷ 0.02 = 250 Ω.", "With 5V and 0.02A: R = 5 ÷ 0.02 = 250 Ω."], reto: ["Si tienes 9V y quieres 0.03A, ¿qué resistencia necesitas?", "If you have 9V and want 0.03A, which resistor do you need?"] },
    { claves: ["prompt"], termino: ["Prompt", "Prompt"], def: ["Es la instrucción que le das a una IA. Un buen prompt dice **rol, tarea, contexto y formato**.", "The instruction you give an AI. A good prompt states **role, task, context and format**."], ejemplo: ["\"Actúa como profe de química y explícame los átomos con un ejemplo de cocina, en 5 viñetas.\"", "\"Act as a chemistry teacher and explain atoms with a cooking example, in 5 bullet points.\""], reto: ["Mejora este prompt: 'háblame de la historia'.", "Improve this prompt: 'tell me about history'."] },
    { claves: ["inteligencia artificial", " ia ", " ai ", "machine learning", "artificial intelligence"], termino: ["Inteligencia artificial", "Artificial intelligence"], def: ["Programas que aprenden patrones a partir de muchos ejemplos para predecir, clasificar o generar contenido.", "Programs that learn patterns from many examples to predict, classify or generate content."], ejemplo: ["Un filtro de spam aprende de miles de correos marcados.", "A spam filter learns from thousands of labeled emails."], reto: ["Nombra una herramienta con IA que uses y un error que podría cometer.", "Name an AI tool you use and a mistake it could make."] },
    { claves: ["flexbox", "grid"], termino: ["Flexbox y Grid", "Flexbox and Grid"], def: ["Herramientas de CSS para acomodar elementos: Flexbox en una línea (fila o columna), Grid en filas y columnas a la vez.", "CSS tools to lay out elements: Flexbox in one line (row or column), Grid in rows and columns at once."], ejemplo: ["`display: flex; gap: 1rem;` pone elementos lado a lado con espacio.", "`display: flex; gap: 1rem;` places elements side by side with space."], reto: ["¿Usarías Flexbox o Grid para una galería de fotos?", "Would you use Flexbox or Grid for a photo gallery?"] },
    { claves: ["iot", "internet de las cosas", "internet of things", "esp32"], termino: ["Internet de las Cosas (IoT)", "Internet of Things (IoT)"], def: ["Objetos con sensores conectados a internet que envían y reciben datos.", "Everyday objects with sensors connected to the internet that send and receive data."], ejemplo: ["Un sensor que te avisa al celular si la nevera se calentó.", "A sensor that alerts your phone if the fridge warms up."], reto: ["Inventa un objeto IoT útil para tu barrio.", "Invent a useful IoT object for your neighborhood."] },
    { claves: [" api "], termino: ["API", "API"], def: ["Es como un mesero: lleva tu pedido (petición) a la cocina (servidor) y te trae la respuesta.", "It's like a waiter: it takes your order (request) to the kitchen (server) and brings back the answer."], ejemplo: ["Una app del clima pide los datos a una API meteorológica.", "A weather app asks a weather API for data."], reto: ["¿Qué datos pediría una app de buses a una API?", "What data would a bus app request from an API?"] },
  ].map((g) => ({ ...g, get termino_() { return EN() ? g.termino[1] : g.termino[0]; } }));
  const lang = (par) => (EN() ? par[1] : par[0]);

  const QUIZ = [
    { p: ["¿Qué etiqueta HTML crea un enlace?", "Which HTML tag creates a link?"], o: [["<p>", "<a>", "<img>"], ["<p>", "<a>", "<img>"]], c: 1, e: ["La etiqueta `<a>` (de *anchor*) crea enlaces con el atributo href.", "The `<a>` (*anchor*) tag creates links with the href attribute."] },
    { p: ["En la ley de Ohm, si V = 10V y R = 5Ω, ¿cuánto vale I?", "In Ohm's law, if V = 10V and R = 5Ω, what is I?"], o: [["2 A", "50 A", "0.5 A"], ["2 A", "50 A", "0.5 A"]], c: 0, e: ["I = V ÷ R = 10 ÷ 5 = 2 amperios.", "I = V ÷ R = 10 ÷ 5 = 2 amperes."] },
    { p: ["¿Qué hace un ciclo en programación?", "What does a loop do in programming?"], o: [["Toma una decisión", "Repite instrucciones", "Guarda un dato"], ["Makes a decision", "Repeats instructions", "Stores a value"]], c: 1, e: ["Los ciclos (for, while) repiten instrucciones.", "Loops (for, while) repeat instructions."] },
    { p: ["¿Qué propiedad CSS cambia el color del texto?", "Which CSS property changes the text color?"], o: [["background", "font-size", "color"], ["background", "font-size", "color"]], c: 2, e: ["`color` cambia el color del texto; `background` el del fondo.", "`color` changes the text color; `background` changes the background."] },
    { p: ["¿Cuál es un buen hábito al usar IA para estudiar?", "What is a good habit when using AI to study?"], o: [["Copiar sin leer", "Verificar con otras fuentes", "Nunca preguntar"], ["Copy without reading", "Check other sources", "Never ask questions"]], c: 1, e: ["La IA puede equivocarse: siempre verifica con fuentes confiables.", "AI can be wrong: always double-check with reliable sources."] },
    { p: ["¿Qué comando de Git guarda una 'foto' de tus cambios?", "Which Git command saves a 'snapshot' of your changes?"], o: [["git commit", "git clone", "git delete"], ["git commit", "git clone", "git delete"]], c: 0, e: ["`git commit` registra los cambios preparados en el historial.", "`git commit` records your staged changes in the history."] },
  ];
  /* Vista del quiz en el idioma activo (la usa también el "Reto del día" del portal) */
  const quizVista = (q) => ({ p: lang(q.p), o: lang(q.o), c: q.c, e: lang(q.e) });
  let quizActual = null;

  const RUTAS = {
    web: { nombre: ["Desarrollo web", "Web development"], ids: [1, 3, 4, 5] },
    datos: { nombre: ["Programación y datos", "Programming and data"], ids: [1, 2, 6] },
    hardware: { nombre: ["Electrónica y robótica", "Electronics and robotics"], ids: [8, 9, 11, 12] },
    ia: { nombre: ["Inteligencia artificial", "Artificial intelligence"], ids: [1, 7, 2] },
  };

  /* ---------- Contexto del usuario ---------- */
  function contexto() {
    const s = S(), d = D();
    const rol = s?.rol || "visitante";
    const ctx = { rol, sesion: s, nombre: nombreCorto(s) };
    if (!d || !s) return ctx;
    if (rol === "estudiante") {
      ctx.cursos = d.cursosDeEstudiante(s.correo);
      ctx.actividades = d.actividadesDeEstudiante(s.correo).map((a) => ({ ...a, estado: d.estadoPara(a, s.correo), entrega: d.entregaDe(a.id, s.correo) }));
      ctx.pendientes = ctx.actividades.filter((a) => a.estado === "pendiente" || a.estado === "vencida");
      ctx.solicitudes = d.matriculas(s.correo).filter((m) => m.estado === "pendiente");
    }
    if (rol === "docente") {
      ctx.cursos = d.cursosDeDocente(s.nombre);
      ctx.actividades = d.actividadesDeDocente(s.nombre);
      const ids = new Set(ctx.actividades.map((a) => a.id));
      ctx.porRevisar = d.entregas().filter((e) => ids.has(e.actividad_id) && e.estado === "entregada");
      ctx.estudiantes = ctx.cursos.flatMap((c) => d.estudiantesDeCurso(c.id).map((e) => ({ ...e, curso: c })));
    }
    if (rol === "administrativo") {
      ctx.ins = d.inscripciones();
      ctx.mensajes = window.TCUtil.leer("tc_mensajes", []);
    }
    return ctx;
  }

  /* ---------- Respuestas por tema ---------- */
  const r = (texto, sugerencias = [], acciones = []) => ({ texto, sugerencias, acciones });
  const tx = (x) => (EN() ? window.TCIdioma?.t(x) || x : x); // traduce datos (títulos, fechas) al idioma activo
  const vence = (fecha) => tx(D().textoVence(fecha));
  const n_ = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  function explicar(t) {
    const g = GLOSARIO.find((x) => x.claves.some((k) => (" " + t + " ").includes(k)));
    if (!g) return null;
    return r(`📘 **${lang(g.termino)}**\n${lang(g.def)}\n\n**${L("Ejemplo", "Example")}:** ${lang(g.ejemplo)}\n\n**${L("Mini reto", "Mini challenge")}:** ${lang(g.reto)}`,
      [L("Dame otro ejemplo", "Give me another example"), L("Hazme un quiz", "Quiz me"), L("¿Qué curso enseña esto?", "Which course teaches this?")]);
  }

  function nuevoQuiz() {
    quizActual = azar(QUIZ); const q = quizVista(quizActual);
    return r(`🧠 **${L("Reto rápido", "Quick challenge")}**\n${q.p}\n\n${q.o.map((o, i) => `${"ABC"[i]}) ${o}`).join("\n")}\n\n${L("Responde con la letra.", "Answer with the letter.")}`, q.o.map((_, i) => `${L("Respuesta", "Answer")} ${"ABC"[i]}`));
  }
  function revisarQuiz(t) {
    const m = t.match(/^((respuesta|answer)\s*)?([abc])\)?$/);
    if (!quizActual || !m) return null;
    const i = "abc".indexOf(m[3]), q = quizVista(quizActual); quizActual = null;
    const siguientes = [L("Otro reto", "Another challenge"), L("Explícame un concepto", "Explain a concept")];
    return i === q.c
      ? r(`🎉 **${L("¡Correcto!", "Correct!")}** ${q.e}`, siguientes)
      : r(`${L("Casi", "Almost")} 💪 ${L("La respuesta era", "The answer was")} **${"ABC"[q.c]}) ${q.o[q.c]}**. ${q.e}`, siguientes);
  }

  function recomendar(t) {
    const C = (id) => D()?.curso(id) || (window.TALENTO_CARIBE_CURSOS || []).find((c) => c.id === id);
    let ruta = null;
    if (tiene(t, "web", "pagina", "html", "css", "diseno", "javascript", "page", "design")) ruta = RUTAS.web;
    else if (tiene(t, "electr", "arduino", "robot", "circuit", "hardware", "sensor", "iot")) ruta = RUTAS.hardware;
    else if (tiene(t, " ia", "inteligencia", "prompt", "chatgpt", " ai", "artificial")) ruta = RUTAS.ia;
    else if (tiene(t, "dato", "data", "python", "sql", "program", "codigo", "code")) ruta = RUTAS.datos;
    if (!ruta) return r(L("¡Te ayudo a elegir! 🧭 Cuéntame qué te llama más la atención:", "Let me help you choose! 🧭 Tell me what interests you most:"), [L("Crear páginas web", "Build web pages"), L("Programar y datos", "Programming and data"), L("Electrónica y robots", "Electronics and robots"), L("Inteligencia artificial", "Artificial intelligence")]);
    const pasos = ruta.ids.map(C).filter(Boolean).map((c, i) => `${i + 1}. **${tituloCurso(c)}** · ${c.duracion} ${L("semanas", "weeks")} · ${L(c.modalidad, { Virtual: "Online", Presencial: "In person", "Híbrido": "Hybrid" }[c.modalidad] || c.modalidad)}${c.fase === "Lanzamiento" ? L(" ✅ inscripciones abiertas", " ✅ enrollment open") : L(" (próximamente)", " (coming soon)")}`);
    return r(`🗺️ **${L("Ruta sugerida", "Suggested path")}: ${lang(ruta.nombre)}**\n${pasos.join("\n")}\n\n${L("Empieza por el primero aunque no tengas experiencia: cada curso termina con un proyecto real.", "Start with the first one even with no experience: every course ends with a real project.")}`,
      [L("¿Cómo me inscribo?", "How do I enroll?"), L("¿Son gratis?", "Are they free?")], [{ texto: L("Ver catálogo", "See catalog"), url: "cursos.html" }]);
  }

  function estudiante(t, c) {
    if (tiene(t, "pendiente", "que tengo", "tareas", "actividades", "por hacer", "que debo", "pending", "to do", "todo", "homework", "assignments", "activities")) {
      if (!c.cursos?.length) return r(L("Aún no tienes cursos aprobados, así que no hay actividades. ", "You don't have approved courses yet, so there are no activities. ") + (c.solicitudes?.length ? L(`Tienes ${c.solicitudes.length} solicitud(es) en revisión ⏳.`, `You have ${c.solicitudes.length} request(s) under review ⏳.`) : L("Explora el catálogo para inscribirte.", "Browse the catalog to enroll.")), [L("Recomiéndame un curso", "Recommend a course")], [{ texto: L("Explorar cursos", "Browse courses"), url: "cursos.html" }]);
      if (!c.pendientes.length) return r(L("🎉 ¡Estás al día! No tienes actividades pendientes. Aprovecha para repasar o hacer un reto.", "🎉 You're all caught up! No pending activities. A great moment to review or take a challenge."), [L("Hazme un quiz", "Quiz me"), L("Explícame un concepto", "Explain a concept")]);
      const lista = c.pendientes.map((a) => `- **${tx(a.titulo)}** (${tituloCurso(D().curso(a.curso_id))}) · ${a.estado === "vencida" ? "⚠️ " : "⏰ "}${vence(a.fecha_limite)}`).join("\n");
      return r(`${L("Tienes", "You have")} **${c.pendientes.length}** ${c.pendientes.length === 1 ? L("actividad pendiente", "pending activity") : L("actividades pendientes", "pending activities")}:\n${lista}\n\n${L("Te recomiendo empezar por la que vence primero.", "I suggest starting with the one due first.")}`,
        [L("Arma mi plan de estudio", "Build my study plan"), L("¿Cómo entrego una actividad?", "How do I submit an activity?"), `${L("Ayúdame con", "Help me with")} "${c.pendientes[0].titulo}"`], [{ texto: L("Ir a mis actividades", "Go to my activities"), ir: "actividades" }]);
    }
    if (tiene(t, "plan", "organiz", "horario de estudio", "cronograma", "schedule")) {
      if (!c.pendientes?.length) return r(L("No tienes pendientes ahora mismo. Un buen plan semanal: 3 sesiones de 40 minutos para repasar y 1 sesión para un mini proyecto personal. 💡", "Nothing pending right now. A good weekly plan: 3 sessions of 40 minutes to review and 1 session for a personal mini project. 💡"), [L("Hazme un quiz", "Quiz me")]);
      const dias = EN() ? ["Today", "Tomorrow", "Day after tomorrow", "In 3 days", "In 4 days"] : ["Hoy", "Mañana", "Pasado mañana", "En 3 días", "En 4 días"];
      const plan = c.pendientes.slice(0, 5).map((a, i) => `- **${dias[i]}** · 40 min → ${tx(a.titulo)} (${vence(a.fecha_limite).toLowerCase()})`).join("\n");
      return r(`📅 **${L("Tu plan de estudio", "Your study plan")}**\n${plan}\n\n**${L("Técnica sugerida", "Suggested technique")}:** ${L("25 minutos de concentración + 5 de descanso (técnica Pomodoro). Al terminar cada actividad, entrégala de una vez.", "25 minutes of focus + 5 of rest (Pomodoro technique). Submit each activity as soon as you finish it.")}`,
        [L("¿Cómo entrego una actividad?", "How do I submit an activity?"), L("Dame tips para concentrarme", "Give me focus tips")]);
    }
    if (tiene(t, "ayudame con", "ayuda con", "como hago", "no entiendo la actividad", "help me with", "how do i do")) {
      const a = c.actividades?.find((x) => (t.includes(sinTildes(x.titulo).slice(0, 12)) || t.includes(sinTildes(tx(x.titulo)).slice(0, 12)))) || c.pendientes?.[0];
      if (a) return r(`${L("Vamos con", "Let's tackle")} **${tx(a.titulo)}** 💪\n**${L("Objetivo", "Goal")}:** ${tx(a.objetivo) || L("aplicar lo visto en clase", "apply what you saw in class")}\n\n**${L("Cómo abordarla", "How to approach it")}:**\n${L(`1. Lee las instrucciones dos veces y subraya los verbos (escribe, crea, explica).\n2. Haz un borrador rápido, sin miedo a equivocarte.\n3. Revisa que cumpliste cada punto pedido.\n4. Entrégala desde *Actividades* y espera la retroalimentación de ${a.docente}.\n\nNo te doy la respuesta completa porque aprender haciendo es la clave, pero puedo explicarte cualquier concepto. 😉`, `1. Read the instructions twice and underline the verbs (write, create, explain).\n2. Make a quick draft, don't be afraid of mistakes.\n3. Check that you covered every point.\n4. Submit it from *Activities* and wait for ${a.docente}'s feedback.\n\nI won't give you the full answer because learning by doing is the key, but I can explain any concept. 😉`)}`,
        [L("Explícame un concepto", "Explain a concept"), L("Arma mi plan de estudio", "Build my study plan")], [{ texto: L("Abrir actividad", "Open activity"), ir: "actividades" }]);
    }
    if (tiene(t, "nota", "calificac", "progreso", "como voy", "promedio", "grade", "progress", "how am i doing", "average")) {
      if (!c.cursos?.length) return r(L("Cuando tengas un curso aprobado verás aquí tu progreso y tus notas.", "Once you have an approved course you'll see your progress and grades here."));
      const lineas = c.cursos.map((cu) => { const p = D().progreso(c.sesion.correo, cu.id); return `- **${tituloCurso(cu)}**: ${p.hechas}/${p.total} ${L("actividades", "activities")} (${p.porcentaje}%)${p.promedio != null ? ` · ${L("promedio", "average")} **${p.promedio.toFixed(1)}**` : ""}`; }).join("\n");
      const revisadas = c.actividades.filter((a) => a.entrega?.estado === "revisada");
      return r(`📊 **${L("Tu progreso", "Your progress")}**\n${lineas}${revisadas.length ? `\n\n${L("Última retroalimentación", "Latest feedback")}: “${revisadas[revisadas.length - 1].entrega.comentario}”` : ""}`,
        [L("¿Qué tengo pendiente?", "What do I have pending?"), L("Arma mi plan de estudio", "Build my study plan")], [{ texto: L("Ver mis cursos", "See my courses"), ir: "cursos" }]);
    }
    if (tiene(t, "como entrego", "entregar", "subir", "enviar tarea", "submit", "hand in", "upload")) return r(L("📤 **Para entregar una actividad:**\n1. Ve a *Actividades*.\n2. Pulsa **Abrir** en la actividad.\n3. Escribe tu respuesta y, si tienes, pega un enlace (CodePen, GitHub, Drive).\n4. Pulsa **Entregar**. Puedes volver a enviarla mientras no esté calificada.\n\nTu docente la revisará y verás la nota y su comentario en la misma tarjeta.", "📤 **To submit an activity:**\n1. Go to *Activities*.\n2. Click **Open** on the activity.\n3. Write your answer and, if you have one, paste a link (CodePen, GitHub, Drive).\n4. Click **Submit**. You can resubmit as long as it hasn't been graded.\n\nYour teacher will review it and you'll see the grade and comment on the same card."), [], [{ texto: L("Ir a actividades", "Go to activities"), ir: "actividades" }]);
    if (tiene(t, "concentr", "motiva", "estres", "cansad", "dificil", "focus", "tired", "stress", "hard")) return r(L("Te entiendo, aprender algo nuevo cuesta al principio 🌊\n- Divide la tarea en partes pequeñas.\n- Estudia a la misma hora cada día.\n- Celebra cada avance, por pequeño que sea.\n- Pregunta en clase: tus mentores están para acompañarte.\n\n¡Tu talento no tiene fronteras! 💙", "I get it, learning something new is hard at first 🌊\n- Split the task into small parts.\n- Study at the same time every day.\n- Celebrate every step forward, however small.\n- Ask in class: your mentors are there to support you.\n\nYour talent has no borders! 💙"), [L("Arma mi plan de estudio", "Build my study plan"), L("Hazme un quiz", "Quiz me")]);
    return null;
  }

  function docente(t, c) {
    const d = D();
    if (tiene(t, "revisar", "entregas", "calificar", "por revisar", "review", "submissions", "grade")) {
      if (!c.porRevisar?.length) return r(L("✅ No tienes entregas pendientes por revisar. ¡Buen trabajo!", "✅ You have no submissions waiting for review. Great job!"), [L("Ideas de actividad", "Activity ideas"), L("¿Qué estudiantes necesitan apoyo?", "Which students need support?")]);
      const lista = c.porRevisar.slice(0, 6).map((e) => { const a = d.actividades().find((x) => x.id === e.actividad_id); return `- **${e.nombre}** → ${a?.titulo ? tx(a.titulo) : L("Actividad", "Activity")}`; }).join("\n");
      return r(`${L("Tienes", "You have")} **${c.porRevisar.length}** ${c.porRevisar.length === 1 ? L("entrega", "submission") : L("entregas", "submissions")} ${L("por revisar", "to review")}:\n${lista}\n\n💡 ${L("Consejo: una buena retroalimentación dice **qué hizo bien**, **qué mejorar** y **un siguiente paso**.", "Tip: good feedback says **what went well**, **what to improve** and **a next step**.")}`,
        [L("Dame una rúbrica", "Give me a rubric"), L("¿Qué estudiantes necesitan apoyo?", "Which students need support?")], [{ texto: L("Ir a entregas", "Go to submissions"), ir: "entregas" }]);
    }
    if (tiene(t, "idea", "propon", "sugiere actividad", "actividad para", "suggest")) {
      const curso = c.cursos?.find((cu) => t.includes(sinTildes(cu.titulo).split(":")[0].slice(0, 10)) || t.includes(sinTildes(tituloCurso(cu)).split(":")[0].slice(0, 10))) || c.cursos?.[0];
      if (!curso) return r(L("No tienes cursos asignados todavía.", "You don't have assigned courses yet."));
      const tipos = EN() ? ["Practice", "Quiz", "Project", "Reading"] : ["Práctica", "Quiz", "Proyecto", "Lectura"];
      const usos = EN() ? ["solve a neighborhood case applying this topic", "5 quick questions with instant feedback", "mini project in pairs with a 3-minute presentation", "short reading + explain it in your own words to a friend"] : ["resuelve un caso del barrio aplicando este tema", "5 preguntas rápidas con retroalimentación inmediata", "mini proyecto en parejas con presentación de 3 minutos", "lectura corta + explicar con tus palabras a un amigo"];
      const T = (x) => (EN() ? window.TCIdioma?.t(x) || x : x);
      const ideas = (curso.temario || []).slice(0, 4).map((tema, i) => `- **${tipos[i % 4]}** · ${T(tema)}: ${usos[i % 4]}.`).join("\n");
      return r(`💡 **${L("Ideas para", "Ideas for")} ${tituloCurso(curso)}**\n${ideas}\n\n${L("Recuerda conectar cada actividad con el proyecto final", "Remember to connect each activity to the final project")}: *${T(curso.proyecto)}*.`,
        c.cursos.length > 1 ? c.cursos.filter((x) => x !== curso).slice(0, 2).map((x) => `${L("Ideas de actividad para", "Activity ideas for")} ${tituloCurso(x)}`) : [L("Dame una rúbrica", "Give me a rubric")], [{ texto: L("Crear actividad", "Create activity"), ir: "actividades" }]);
    }
    if (tiene(t, "rubrica", "criterio", "evaluar", "rubric", "criteria")) return r(L("📋 **Rúbrica sugerida (escala 1.0 – 5.0)**\n- **Cumple lo pedido** (40%): resuelve todos los puntos de la actividad.\n- **Comprensión** (30%): explica con sus palabras por qué lo hizo así.\n- **Creatividad** (20%): aporta un ejemplo o idea propia.\n- **Presentación** (10%): orden, claridad y entrega a tiempo.\n\nNotas: 4.5–5.0 sobresaliente · 3.5–4.4 bueno · 3.0–3.4 aceptable · menos de 3.0 necesita refuerzo.", "📋 **Suggested rubric (1.0 – 5.0 scale)**\n- **Meets the brief** (40%): covers every point of the activity.\n- **Understanding** (30%): explains in their own words why they did it that way.\n- **Creativity** (20%): adds their own example or idea.\n- **Presentation** (10%): order, clarity and on-time submission.\n\nGrades: 4.5–5.0 outstanding · 3.5–4.4 good · 3.0–3.4 acceptable · below 3.0 needs reinforcement."), [L("¿Qué tengo por revisar?", "What do I need to review?"), L("Ideas de actividad", "Activity ideas")]);
    if (tiene(t, "apoyo", "bajo", "riesgo", "atrasad", "rendimiento", "support", "struggling", "behind", "at risk")) {
      const alerta = (c.estudiantes || []).map((e) => ({ ...e, p: d.progreso(e.correo, e.curso.id) })).filter((e) => e.p.total && (e.p.porcentaje < 50 || (e.p.promedio != null && e.p.promedio < 3)));
      if (!alerta.length) return r(L("👏 Ningún estudiante está en alerta por ahora.", "👏 No students are flagged right now."));
      return r(`${L("Estos estudiantes podrían necesitar apoyo", "These students might need support")}:\n${alerta.map((e) => `- **${e.nombre}** (${tituloCurso(e.curso)}): ${e.p.hechas}/${e.p.total} ${L("entregas", "submissions")}${e.p.promedio != null ? `, ${L("promedio", "average")} ${e.p.promedio.toFixed(1)}` : ""}`).join("\n")}\n\n${L("Idea: escríbeles un mensaje corto y motivador, y ofréceles una tutoría de 15 minutos.", "Idea: send them a short, encouraging message and offer a 15-minute tutoring session.")}`,
        [L("Dame una rúbrica", "Give me a rubric")], [{ texto: L("Ver estudiantes", "See students"), ir: "estudiantes" }]);
    }
    if (tiene(t, "como creo", "crear actividad", "publicar actividad", "nueva actividad", "create an activity", "new activity", "how do i create")) return r(L("✍️ **Para dejar una actividad a tus estudiantes:**\n1. Abre *Actividades* y pulsa **Nueva actividad**.\n2. Elige el curso (solo ves los que dictas).\n3. Usa una plantilla o escribe instrucciones paso a paso.\n4. Define el objetivo y la fecha límite.\n5. Publica: todos los estudiantes aprobados de ese curso la verán al instante.", "✍️ **To assign an activity to your students:**\n1. Open *Activities* and click **New activity**.\n2. Pick the course (you only see the ones you teach).\n3. Use a template or write step-by-step instructions.\n4. Set the goal and due date.\n5. Publish: every approved student in that course will see it right away."), [L("Ideas de actividad", "Activity ideas"), L("Dame una rúbrica", "Give me a rubric")], [{ texto: L("Crear actividad", "Create activity"), ir: "actividades" }]);
    if (tiene(t, "mis cursos", "estudiantes tengo", "cuantos estudiantes", "resumen", "my courses", "how many students", "summary")) return r(`${L("Dictas", "You teach")} **${n_(c.cursos.length, L("curso", "course"), L("cursos", "courses"))}** ${L("con", "with")} **${c.estudiantes.length}** ${L("estudiantes", "students")}:\n${c.cursos.map((cu) => `- **${tituloCurso(cu)}**: ${d.estudiantesDeCurso(cu.id).length} ${L("estudiantes", "students")} · ${d.actividadesDeCurso(cu.id).length} ${L("actividades", "activities")}`).join("\n")}`,
      [L("¿Qué tengo por revisar?", "What do I need to review?"), L("¿Qué estudiantes necesitan apoyo?", "Which students need support?")]);
    return null;
  }

  function administrativo(t, c) {
    const d = D(), cursos = d?.cursos() || [];
    if (tiene(t, "resumen", "indicador", "como va", "estadistic", "cifras", "summary", "overview", "stats", "kpi")) {
      const est = new Set(c.ins.map((i) => i.correo)).size, pend = c.ins.filter((i) => i.estado === "pendiente").length;
      return r(`📈 **${L("Resumen de la plataforma", "Platform overview")}**\n- ${L("Cursos en catálogo", "Courses in catalog")}: **${cursos.length}**\n- ${L("Estudiantes únicos", "Unique students")}: **${est}**\n- ${L("Inscripciones pendientes", "Pending enrollments")}: **${pend}**\n- ${L("Actividades publicadas por docentes", "Activities published by teachers")}: **${d.actividades().length}**\n- ${L("Entregas recibidas", "Submissions received")}: **${d.entregas().length}**\n- ${L("Mensajes sin leer", "Unread messages")}: **${c.mensajes.filter((m) => !m.leido).length}**`,
        [L("¿Qué cursos tienen más demanda?", "Which courses are most in demand?"), L("¿Qué hace mi cargo?", "What does my role do?")], [{ texto: L("Abrir resumen", "Open overview"), ir: "resumen" }]);
    }
    if (tiene(t, "demanda", "popular", "mas inscrit", "demand", "most")) {
      const conteo = cursos.map((cu) => ({ cu, n: c.ins.filter((i) => Number(i.curso_id) === cu.id).length })).sort((a, b) => b.n - a.n).slice(0, 5);
      return r(`🏆 **${L("Cursos con más solicitudes", "Courses with the most requests")}**\n${conteo.map((x, i) => `${i + 1}. **${tituloCurso(x.cu)}** · ${x.n} ${L("solicitudes", "requests")}`).join("\n")}`, [L("Resumen de la plataforma", "Platform overview")]);
    }
    if (tiene(t, "pendiente", "inscripcion", "solicitud", "pending", "enrollment", "request")) {
      const p = c.ins.filter((i) => i.estado === "pendiente");
      return r(p.length ? `${L("Hay", "There are")} **${p.length}** ${L("solicitudes pendientes", "pending requests")}:\n${p.slice(0, 6).map((i) => `- ${tituloCurso(d.curso(i.curso_id)) || L("Curso", "Course")}`).join("\n")}\n\n${L("Revisa que la edad cumpla el mínimo del curso antes de aprobar.", "Check that the age meets the course minimum before approving.")}` : L("No hay solicitudes pendientes. 🙌", "No pending requests. 🙌"), [], [{ texto: L("Ir a inscripciones", "Go to enrollments"), ir: "inscripciones" }]);
    }
    if (tiene(t, "mensaje", "contacto", "correo", "message", "contact", "inbox")) { const n = c.mensajes.filter((m) => !m.leido).length; return r(n ? L(`Tienes **${n}** mensajes sin leer en la bandeja de contacto. Responde en máximo 3 días hábiles.`, `You have **${n}** unread messages in the contact inbox. Reply within 3 business days.`) : L("La bandeja de contacto está al día. ✉️", "The contact inbox is up to date. ✉️"), [], [{ texto: L("Ir a mensajes", "Go to messages"), ir: "mensajes" }]); }
    if (tiene(t, "mi cargo", "que hago", "funciones", "permisos", "que puedo", "my role", "permissions", "what can i do")) {
      const T = (x) => (EN() ? window.TCIdioma?.t(x) || x : x);
      return r(window.TCPanelPerfil ? `${L("Como", "As")} **${T(c.sesion.puesto)}** (${T(window.TCPanelPerfil.area)}):\n${window.TCPanelPerfil.tasks.map((x) => `- **${T(x[0])}**: ${T(x[1])}`).join("\n")}` : L("Cada cargo ve solo las secciones de su área. Entra al panel para ver tus funciones.", "Each role only sees the sections of its area. Open the panel to see your functions."), [L("Resumen de la plataforma", "Platform overview")]);
    }
    if (tiene(t, "docente", "actividad", "academic", "teacher", "activit")) {
      const porCurso = cursos.map((cu) => ({ cu, n: d.actividadesDeCurso(cu.id).length })).filter((x) => x.n);
      return r(`🎓 **${L("Actividad académica", "Academic activity")}**\n${porCurso.map((x) => `- **${tituloCurso(x.cu)}** (${x.cu.instructor}): ${x.n} ${L("actividades", "activities")}`).join("\n") || L("Aún no hay actividades publicadas.", "No activities published yet.")}`, [], [{ texto: L("Ver actividad académica", "See academic activity"), ir: "academico" }]);
    }
    return null;
  }

  function general(t, c) {
    if (tiene(t, /^(hola|buenas|buen dia|buenos|hey|que mas|q mas|epa|hi|hello|good (morning|afternoon|evening))\b/)) return r(`${L("¡Hola", "Hi")}${c.nombre ? ", " + c.nombre : ""}! 👋 ${L("¿En qué te ayudo hoy?", "How can I help you today?")}`, iniciales(c.rol).map((x) => x.texto));
    if (tiene(t, "gracias", "chevere", "genial", "thank", "thanks", "great", "awesome")) return r(EN() ? azar(["You're welcome! 💙 I'm here whenever you need me.", "Happy to help! Keep it up 🌴", "Anytime! Your talent has no borders ☀️"]) : azar(["¡Con gusto! 💙 Aquí estoy cuando me necesites.", "¡Para eso estamos! Sigue así 🌴", "¡De nada! Tu talento no tiene fronteras ☀️"]));
    if (tiene(t, "quiz", "reto", "preguntame", "evaluame", "challenge", "test me")) return nuevoQuiz();
    const q = revisarQuiz(t.trim()); if (q) return q;
    if (tiene(t, "que es", "explica", "significa", "concepto", "definicion", "what is", "what's", "explain", "meaning", "concept", "define")) {
      const e = explicar(t); if (e) return e;
      return r(L("¿Qué concepto quieres que te explique? Prueba con alguno de estos:", "Which concept should I explain? Try one of these:"), [L("¿Qué es un algoritmo?", "What is an algorithm?"), L("¿Qué es HTML?", "What is HTML?"), L("¿Qué es la ley de Ohm?", "What is Ohm's law?"), L("¿Qué es un prompt?", "What is a prompt?")]);
    }
    const e = explicar(t); if (e && t.split(" ").length <= 4) return e;
    if (tiene(t, "costo", "precio", "gratis", "pagar", "cuanto vale", "free", "cost", "price", "pay")) return r(L("💸 **Todos los cursos son gratuitos.** Solo necesitas una cuenta de estudiante y ganas de aprender.", "💸 **All courses are free.** You only need a student account and the desire to learn."), [L("¿Cómo me inscribo?", "How do I enroll?")]);
    if (tiene(t, "inscrib", "registr", "crear cuenta", "matricul", "enroll", "sign up", "register")) return r(L("📝 **Para inscribirte:**\n1. Crea tu cuenta en *Inscríbete aquí* (eliges tu país y tus datos).\n2. Abre un curso en el catálogo y pulsa **Inscribirme gratis**.\n3. Admisiones revisa tu solicitud y, al aprobarla, verás el curso y sus actividades en tu portal.\n\nSi eres menor de 18 años, te pediremos los datos de un acudiente.", "📝 **To enroll:**\n1. Create your account under *Sign up* (choose your country and fill in your details).\n2. Open a course in the catalog and click **Enroll for free**.\n3. Admissions reviews your request and, once approved, you'll see the course and its activities in your portal.\n\nIf you're under 18, we'll ask for a guardian's details."), [L("¿Qué documentos necesito?", "Which documents do I need?")], [{ texto: L("Ver catálogo", "See catalog"), url: "cursos.html" }]);
    if (tiene(t, "document", "cedula", "tarjeta de identidad", "pep", "id card", "passport")) return r(L("Para Colombia aceptamos cédula de ciudadanía, tarjeta de identidad, cédula de extranjería o PEP. Para otros países el formulario muestra las opciones de documento adecuadas.", "For Colombia we accept citizenship ID, identity card, foreigner ID or PEP. For other countries, the form shows the right document options."));
    if (tiene(t, "recomien", "que curso", "por donde empiezo", "empezar", "nunca he", "quiero aprender", "crear paginas", "programar y datos", "electronica y robots", "inteligencia artificial", "recommend", "where do i start", "where should i start", "which course", "build web pages", "programming and data", "electronics and robots", "artificial intelligence", "i want to learn")) return recomendar(t);
    if (tiene(t, "que curso ensena", "curso ensena esto", "which course teaches")) return recomendar(t);
    if (tiene(t, "mentor", "profesor", "docente", "quien dicta", "teacher", "who teaches")) return r(L("👩‍🏫 **Nuestros mentores**\n- Camila Ospino · Desarrollo web\n- Daniel Barrios · Programación y datos\n- Valeria De la Hoz · IA aplicada\n- Andrés Pacheco · Electrónica y robótica\n- Laura Mendoza · Hardware e IoT", "👩‍🏫 **Our mentors**\n- Camila Ospino · Web development\n- Daniel Barrios · Programming and data\n- Valeria De la Hoz · Applied AI\n- Andrés Pacheco · Electronics and robotics\n- Laura Mendoza · Hardware and IoT"));
    if (tiene(t, "modalidad", "presencial", "virtual", "horario", "sede", "donde", "online", "in person", "where", "schedule")) return r(L("Tenemos cursos **virtuales**, **presenciales** (en la sede de Barranquilla, con kits y equipos) e **híbridos**. Cada curso muestra su modalidad y duración en el catálogo.", "We have **online**, **in-person** (at our Barranquilla site, with kits and equipment) and **hybrid** courses. Each course shows its format and length in the catalog."));
    if (tiene(t, "contrasena", "clave", "no puedo entrar", "olvide", "password", "can't log in", "forgot")) return r(L("🔐 Si olvidaste tu contraseña, en la página de ingreso toca **¿Olvidaste tu contraseña?**: te enviaremos a tu correo un enlace para crear una nueva (vence en 1 hora). **Nunca compartas tu contraseña** en el chat.", "🔐 If you forgot your password, tap **Forgot your password?** on the sign-in page: we'll email you a link to create a new one (it expires in 1 hour). **Never share your password** in the chat."), [], [{ texto: L("Recuperar contraseña", "Recover password"), url: "recuperar.html" }]);
    if (tiene(t, "otro ejemplo", "another example")) return r(L("Claro: piensa en una **variable** como el marcador de un partido del Junior ⚽. El nombre es *goles_junior* y su valor cambia durante el partido: 0, 1, 2...", "Sure: think of a **variable** as the scoreboard of a Junior football match ⚽. Its name is *junior_goals* and its value changes during the game: 0, 1, 2..."), [L("Hazme un quiz", "Quiz me"), L("Explícame un concepto", "Explain a concept")]);
    return null;
  }

  function iniciales(rol) {
    const base = {
      estudiante: [["portapapeles", "¿Qué tengo pendiente?", "What do I have pending?"], ["calendario", "Arma mi plan de estudio", "Build my study plan"], ["grafica", "¿Cómo voy en mis cursos?", "How am I doing in my courses?"], ["foco", "Explícame un concepto", "Explain a concept"]],
      docente: [["check", "¿Qué tengo por revisar?", "What do I need to review?"], ["foco", "Ideas de actividad", "Activity ideas"], ["portapapeles", "Dame una rúbrica", "Give me a rubric"], ["usuarios", "¿Qué estudiantes necesitan apoyo?", "Which students need support?"]],
      administrativo: [["grafica", "Resumen de la plataforma", "Platform overview"], ["birrete", "Inscripciones pendientes", "Pending enrollments"], ["estrella", "¿Qué cursos tienen más demanda?", "Which courses are most in demand?"], ["maletin", "¿Qué hace mi cargo?", "What does my role do?"]],
      visitante: [["brujula", "¿Por dónde empiezo?", "Where do I start?"], ["lapiz", "¿Cómo me inscribo?", "How do I enroll?"], ["billetera", "¿Son gratis los cursos?", "Are the courses free?"], ["foco", "Explícame un concepto", "Explain a concept"]],
    };
    return (base[rol] || base.visitante).map(([icono, es, en]) => ({ icono, texto: L(es, en) }));
  }

  function responderLocal(texto) {
    const c = contexto(), t = sinTildes(texto);
    const porRol = { estudiante, docente, administrativo }[c.rol];
    const temas = { docente: L("tus cursos, actividades, entregas y rúbricas", "your courses, activities, submissions and rubrics"), administrativo: L("indicadores, inscripciones, mensajes y funciones de tu cargo", "indicators, enrollments, messages and your role's functions"), estudiante: L("tus actividades, tu progreso, planes de estudio y conceptos de los cursos", "your activities, progress, study plans and course concepts") }[c.rol] || L("cursos, inscripciones y conceptos de tecnología", "courses, enrollment and tech concepts");
    return (porRol && porRol(t, c)) || general(t, c) || r(
      L(`Mmm, no estoy seguro de haber entendido 🤔 Soy el asistente de Talento Caribe y puedo ayudarte con ${temas}. ¿Probamos con alguna de estas?`, `Hmm, I'm not sure I understood 🤔 I'm the Talento Caribe assistant and I can help you with ${temas}. Shall we try one of these?`),
      iniciales(c.rol).map((x) => x.texto));
  }

  /* Resumen en texto para enviar al backend cuando la IA real esté conectada */
  function resumenContexto() {
    const c = contexto(), partes = [`Rol: ${c.rol}`];
    if (c.sesion?.nombre) partes.push(`Nombre: ${c.sesion.nombre}`);
    if (c.sesion?.puesto) partes.push(`Cargo: ${c.sesion.puesto}`);
    if (c.cursos) partes.push("Cursos: " + c.cursos.map((x) => x.titulo).join(", "));
    if (c.pendientes) partes.push("Pendientes: " + c.pendientes.map((x) => x.titulo).join(", "));
    if (c.porRevisar) partes.push(`Entregas por revisar: ${c.porRevisar.length}`);
    return partes.join(". ");
  }

  async function responder(texto, historial = []) {
    if (window.TC?.MODO_DEMO !== false) return responderLocal(texto);
    let aviso = L("\n\n_(Respuesta sin conexión: el servidor de IA no está disponible.)_", "\n\n_(Offline answer: the AI server is not available.)_");
    try {
      // El servidor arma el contexto de la marca y el catálogo; el token le dice quién pregunta
      const token = S()?.token;
      const res = await fetch(`${TC.API_URL}/chat`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ mensaje: texto, idioma: EN() ? "en" : "es", contexto: resumenContexto().slice(0, 2000), historial: historial.slice(-10).map((h) => ({ ...h, texto: String(h.texto).slice(0, 4000) })) }) });
      const data = await res.json().catch(() => ({}));
      if (data.sinIA) aviso = L("\n\n_(Respuesta automática: la IA todavía no está configurada en el servidor.)_", "\n\n_(Automatic answer: AI is not configured on the server yet.)_");
      else if (res.status === 429) aviso = `\n\n_(${data.error || L("Demasiados mensajes seguidos, espera un momento.", "Too many messages, wait a moment.")})_`;
      if (!res.ok) throw new Error(data.error);
      return r(data.respuesta || L("No recibí respuesta.", "I didn't get an answer."), data.sugerencias || []);
    } catch {
      const local = responderLocal(texto);
      local.texto += aviso;
      return local;
    }
  }

  window.TCAsistente = { responder, responderLocal, contexto, iniciales, GLOSARIO, QUIZ, quizVista, L };

  /* ==========================================================
     TCChatUI - componente de chat
     ========================================================== */
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  /* Markdown mínimo y seguro: se escapa todo y luego se aplican **negrita**, _cursiva_, `código` y listas */
  function formato(texto) {
    const linea = (l) => esc(l).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/(^|\s)[_*]([^_*]+)[_*](?=\s|$|[.,)])/g, "$1<em>$2</em>");
    const bloques = []; let lista = null;
    String(texto).split("\n").forEach((l) => {
      const ul = l.match(/^\s*[-•]\s+(.*)/), ol = l.match(/^\s*(\d+)[.)]\s+(.*)/);
      if (ul || ol) {
        const tipo = ul ? "ul" : "ol";
        if (!lista || lista.tipo !== tipo) { lista = { tipo, items: [] }; bloques.push(lista); }
        lista.items.push(linea(ul ? ul[1] : ol[2]));
      } else { lista = null; if (l.trim()) bloques.push(`<p>${linea(l)}</p>`); }
    });
    return bloques.map((b) => (typeof b === "string" ? b : `<${b.tipo}>${b.items.map((i) => `<li>${i}</li>`).join("")}</${b.tipo}>`)).join("");
  }
  const hora = (iso) => new Date(iso).toLocaleTimeString(window.TCIdioma?.locale || "es-CO", { hour: "numeric", minute: "2-digit" });
  const SUBTITULO = { estudiante: "Tu tutor de aprendizaje", docente: "Tu copiloto docente", administrativo: "Tu asistente de gestión", visitante: "Te ayudo a empezar" };

  function montar(contenedor, opciones = {}) {
    const ses = S(), rol = ses?.rol || "visitante";
    const clave = "tc_chat_" + (ses?.correo || "visitante");
    const iniciales_usuario = (ses?.nombre || "Tú").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    let historial = window.TCUtil?.leer(clave, []) || [];
    let ocupado = false;

    contenedor.classList.add("ia-chat");
    if (opciones.modo) contenedor.classList.add("ia-chat-" + opciones.modo);
    contenedor.innerHTML = `
      <header class="ia-cabecera">
        <span class="ia-avatar ia-avatar-bot" aria-hidden="true"></span>
        <div class="ia-cabecera-texto"><strong>Asistente Talento Caribe</strong><small><span class="punto-en-linea" aria-hidden="true"></span>${SUBTITULO[rol]}</small></div>
        <div class="ia-cabecera-acciones">
          <button type="button" class="ia-icono-btn" data-ia="nueva" title="Nueva conversación" aria-label="Nueva conversación">${TCIcono("reiniciar", 18)}</button>
          ${opciones.ampliable ? `<button type="button" class="ia-icono-btn" data-ia="ampliar" title="Ampliar" aria-label="Ampliar chat">${TCIcono("ampliar", 18)}</button>` : ""}
          ${opciones.cerrable ? `<button type="button" class="ia-icono-btn" data-ia="cerrar" title="Cerrar" aria-label="Cerrar asistente">×</button>` : ""}
        </div>
      </header>
      <div class="ia-log" role="log" aria-live="polite" aria-label="Conversación con el asistente"></div>
      <form class="ia-form" autocomplete="off">
        <label class="sr-only" for="ia-entrada-${opciones.modo || "x"}">Escribe tu mensaje</label>
        <textarea id="ia-entrada-${opciones.modo || "x"}" rows="1" maxlength="500" placeholder="Escribe tu pregunta…"></textarea>
        <button type="submit" class="ia-enviar" aria-label="Enviar">${TCIcono("enviar", 18)}</button>
      </form>
      <p class="ia-nota">${window.TC?.MODO_DEMO === false ? "Asistente con IA · verifica la información importante." : "Modo demostración · no compartas contraseñas ni documentos."}</p>`;

    const log = contenedor.querySelector(".ia-log"), form = contenedor.querySelector(".ia-form"), entrada = contenedor.querySelector("textarea");
    const persistir = () => { historial = historial.slice(-60); window.TCUtil?.guardar(clave, historial); };
    const bajar = () => { log.scrollTop = log.scrollHeight; };

    function bienvenida() {
      const c = contexto();
      const saludo = { estudiante: L(`¡Hola, ${c.nombre || "estudiante"}! 👋 Soy tu tutor. Te ayudo a organizarte, entender conceptos y avanzar en tus actividades.`, `Hi, ${c.nombre || "student"}! 👋 I'm your tutor. I'll help you get organized, understand concepts and move forward with your activities.`), docente: L(`¡Hola, ${c.nombre || "profe"}! 👋 Te ayudo a crear actividades, revisar entregas y acompañar a tus estudiantes.`, `Hi, ${c.nombre || "teacher"}! 👋 I'll help you create activities, review submissions and support your students.`), administrativo: L(`¡Hola, ${c.nombre || ""}! 👋 Te ayudo con indicadores, inscripciones y las funciones de tu cargo.`, `Hi, ${c.nombre || ""}! 👋 I'll help you with indicators, enrollments and your role's functions.`), visitante: L("¡Hola! 👋 Soy el asistente de Talento Caribe. Te ayudo a encontrar tu primer curso.", "Hi! 👋 I'm the Talento Caribe assistant. I'll help you find your first course.") }[rol];
      log.innerHTML = `<div class="ia-bienvenida"><span class="ia-bienvenida-logo" aria-hidden="true"></span><p>${esc(saludo)}</p><div class="ia-iniciales">${iniciales(rol).map((x) => `<button type="button" class="ia-inicial" data-preguntar="${esc(x.texto)}">${TCIcono(x.icono, 18)}<span>${esc(x.texto)}</span></button>`).join("")}</div></div>`;
    }

    function pintarMensaje(m, conExtras) {
      log.querySelector(".ia-bienvenida")?.remove();
      log.querySelectorAll(".ia-extras").forEach((x) => x.remove());
      const fila = document.createElement("div");
      fila.className = `ia-msg ia-msg-${m.de}`;
      fila.innerHTML = `${m.de === "bot" ? '<span class="ia-avatar ia-avatar-bot" aria-hidden="true"></span>' : `<span class="ia-avatar ia-avatar-yo" aria-hidden="true">${esc(iniciales_usuario)}</span>`}
        <div class="ia-cuerpo"><div class="ia-burbuja"${m.de === "yo" ? " data-no-traducir" : ""}>${m.de === "bot" ? formato(m.texto) : `<p>${esc(m.texto).replace(/\n/g, "<br>")}</p>`}</div>
        <div class="ia-meta"><span>${m.de === "bot" ? "Asistente" : "Tú"} · ${hora(m.hora)}</span>${m.de === "bot" ? `<button type="button" class="ia-copiar" title="Copiar respuesta" aria-label="Copiar respuesta">${TCIcono("copiar", 14)}</button>` : ""}</div></div>`;
      if (m.de === "bot") fila.querySelector(".ia-copiar").addEventListener("click", (e) => { navigator.clipboard?.writeText(m.texto); e.currentTarget.innerHTML = TCIcono("check", 14); });
      log.append(fila);
      if (conExtras && (m.sugerencias?.length || m.acciones?.length)) {
        const extras = document.createElement("div");
        extras.className = "ia-extras";
        extras.innerHTML = (m.acciones || []).map((a, i) => `<button type="button" class="ia-accion" data-accion="${i}">${esc(a.texto)} ${TCIcono("flecha", 14)}</button>`).join("") + (m.sugerencias || []).map((s) => `<button type="button" class="ia-sugerencia" data-preguntar="${esc(s)}">${esc(s)}</button>`).join("");
        extras.querySelectorAll("[data-accion]").forEach((b) => b.addEventListener("click", () => ejecutar(m.acciones[Number(b.dataset.accion)])));
        log.append(extras);
      }
      bajar();
    }

    function ejecutar(accion) {
      if (accion.ir && typeof window.TCNavegar === "function" && window.TCNavegar(accion.ir)) { opciones.alNavegar?.(); return; }
      if (accion.url) location.href = (location.pathname.includes("/admin/") ? "../" : "") + accion.url;
      else if (accion.ir) location.href = (location.pathname.includes("/admin/") ? "../" : "") + (rol === "administrativo" ? "admin/panel.html" : "portal.html") + "#" + accion.ir;
    }

    async function enviar(texto) {
      texto = texto.trim(); if (!texto || ocupado) return;
      ocupado = true; entrada.value = ""; ajustar();
      const yo = { de: "yo", texto, hora: new Date().toISOString() };
      historial.push(yo); pintarMensaje(yo); persistir();
      const escribiendo = document.createElement("div");
      escribiendo.className = "ia-msg ia-msg-bot ia-escribiendo";
      escribiendo.innerHTML = '<span class="ia-avatar ia-avatar-bot" aria-hidden="true"></span><div class="ia-burbuja"><span class="ia-puntos"><i></i><i></i><i></i></span><span class="sr-only">El asistente está escribiendo</span></div>';
      log.append(escribiendo); bajar();
      const inicio = Date.now();
      const respuesta = await responder(texto, historial.map((h) => ({ rol: h.de === "yo" ? "user" : "assistant", texto: h.texto })));
      // "Escribiendo..." dura un tiempo natural; si la IA real ya tardó, no se agrega espera
      const pausa = Math.min(1300, 450 + respuesta.texto.length * 4) - (Date.now() - inicio);
      if (pausa > 0) await new Promise((ok) => setTimeout(ok, pausa));
      escribiendo.remove();
      const bot = { de: "bot", hora: new Date().toISOString(), ...respuesta };
      historial.push(bot); pintarMensaje(bot, true); persistir();
      ocupado = false;
    }

    const ajustar = () => { entrada.style.height = "auto"; entrada.style.height = Math.min(entrada.scrollHeight, 140) + "px"; };
    entrada.addEventListener("input", ajustar);
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(entrada.value); } });
    form.addEventListener("submit", (e) => { e.preventDefault(); enviar(entrada.value); });
    contenedor.addEventListener("click", (e) => {
      const p = e.target.closest("[data-preguntar]"); if (p) { enviar(p.dataset.preguntar); return; }
      const b = e.target.closest("[data-ia]"); if (!b) return;
      if (b.dataset.ia === "nueva") { historial = []; persistir(); bienvenida(); entrada.focus(); }
      if (b.dataset.ia === "ampliar") opciones.alAmpliar?.(b);
      if (b.dataset.ia === "cerrar") opciones.alCerrar?.();
    });

    if (historial.length) historial.forEach((m, i) => pintarMensaje(m, i === historial.length - 1)); else bienvenida();
    return { enviar, enfocar: () => entrada.focus() };
  }

  window.TCChatUI = { montar, formato };
})();
