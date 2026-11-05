/* inicio.js - Página de inicio: orientador "¿por dónde empiezo?" y rutas de aprendizaje.
   Todo sale del catálogo (window.TALENTO_CARIBE_CURSOS y TALENTO_CARIBE_FICHAS), así que si el
   equipo cambia un curso o abre un grupo nuevo desde el panel, el inicio se actualiza solo. */
(() => {
  const esc = window.TCUtil.esc;
  const t = (texto, vars) => (window.TCi18n ? window.TCi18n.t(texto, vars) : texto.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? ""));
  const cursos = () => window.TALENTO_CARIBE_CURSOS || [];
  const fichas = () => window.TALENTO_CARIBE_FICHAS || [];
  const buscar = (id) => cursos().find((c) => Number(c.id) === Number(id));

  /* Próximo grupo del curso: primero uno con inscripciones abiertas; si no hay, el siguiente que vaya a abrir */
  function proximoGrupo(cursoId) {
    const delCurso = fichas().filter((f) => Number(f.curso_id) === Number(cursoId)).sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
    return delCurso.find((f) => f.estado === "Inscripciones abiertas") || delCurso.find((f) => f.estado === "Próximamente") || null;
  }
  const fecha = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return window.TCi18n ? window.TCi18n.fecha(d, { day: "numeric", month: "long", year: "numeric" }) : d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  };

  /* ---------- Rutas: cursos de cada área, de básico a intermedio ---------- */
  function pintarRutas() {
    document.querySelectorAll("[data-ruta]").forEach((lista) => {
      const area = lista.dataset.ruta;
      const nivel = (c) => (c.nivel === "Básico" ? 0 : c.nivel === "Intermedio" ? 1 : 2);
      const delArea = cursos().filter((c) => c.area === area).sort((a, b) => nivel(a) - nivel(b) || Number(a.id) - Number(b.id));
      lista.innerHTML = delArea.map((c) => {
        const abierto = c.fase === "Lanzamiento";
        return `<li><a href="cursos.html?curso=${encodeURIComponent(c.id)}">
          <span class="ruta-curso">${esc(c.titulo)}<small><span>${esc(c.nivel)}</span> · <span>${esc(c.modalidad)}</span></small></span>
          <span class="tag ${abierto ? "tag-lanzamiento" : "tag-pronto"}">${abierto ? "Disponible" : "Próximamente"}</span>
        </a></li>`;
      }).join("");
    });
  }

  /* ---------- Orientador ---------- */
  // [interés][experiencia] → curso recomendado y por qué
  const RECOMENDACIONES = {
    web: { no: [3, "Empiezas por lo visual: ves el resultado de cada línea que escribes y terminas con tu página publicada en internet."], si: [4, "Si ya escribiste algo de código, JavaScript es el paso que hace que una página responda a lo que hace la persona."] },
    datos: { no: [2, "Python es el lenguaje más usado para datos e inteligencia artificial, y uno de los más fáciles de leer para empezar."], si: [7, "Con una base de programación, aquí entiendes qué puede hacer la IA, cuáles son sus límites y cómo usarla bien."] },
    hardware: { no: [8, "Antes de programar una placa conviene entender la electricidad: aquí armas y mides tus primeros circuitos."], si: [9, "Si ya programaste, con Arduino llevas ese código al mundo físico: luces, sensores y motores."] },
    explorar: { no: [1, "Es el curso de entrada: aprendes a pensar un problema paso a paso, la base de cualquier ruta que elijas después."], si: [2, "Python sirve para casi todo y te deja probar varias áreas antes de decidir cuál seguir."] },
  };

  const form = document.querySelector("#orientador");
  const salida = document.querySelector("#orientador-resultado");

  function recomendar() {
    const interes = form.elements.interes.value, experiencia = form.elements.experiencia.value;
    if (!interes || !experiencia) return;
    const [id, porque] = RECOMENDACIONES[interes][experiencia];
    const curso = buscar(id);
    if (!curso) { salida.innerHTML = `<p class="orientador-vacio">${esc(t("Revisa el catálogo completo para elegir tu curso."))} <a href="cursos.html">${esc(t("Ver el catálogo"))}</a></p>`; return; }
    const grupo = proximoGrupo(curso.id);
    const datos = [curso.nivel, t("{n} semanas", { n: Number(curso.duracion) || 16 }), curso.modalidad];
    if (grupo) datos.push(grupo.estado === "Inscripciones abiertas" ? t("Inicia el {fecha}", { fecha: fecha(grupo.inicio) }) : t("Abre el {fecha}", { fecha: fecha(grupo.inicio) }));
    const disponible = curso.fase === "Lanzamiento";
    salida.innerHTML = `
      <div class="recomendacion">
        <p class="recomendacion-etiqueta">${esc(t("Te recomendamos"))}</p>
        <h3>${esc(curso.titulo)}</h3>
        <p class="recomendacion-porque">${esc(t(porque))}</p>
        <ul class="recomendacion-datos">${datos.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
        ${curso.proyecto ? `<p class="recomendacion-proyecto"><strong>${esc(t("Tu proyecto final:"))}</strong> ${esc(curso.proyecto)}</p>` : ""}
        <div class="recomendacion-acciones">
          <a class="btn btn-primary" href="cursos.html?curso=${encodeURIComponent(curso.id)}">${esc(t(disponible ? "Ver el curso e inscribirme" : "Ver el curso"))}</a>
          <a class="btn btn-outline" href="cursos.html">${esc(t("Comparar con otros cursos"))}</a>
        </div>
      </div>`;
  }

  (window.TCListo || Promise.resolve()).then(() => {
    pintarRutas();
    if (form && salida) {
      form.addEventListener("change", recomendar);
      form.addEventListener("submit", (e) => e.preventDefault());
      recomendar(); // si el navegador recordó las respuestas al volver atrás
    }
  });
})();
