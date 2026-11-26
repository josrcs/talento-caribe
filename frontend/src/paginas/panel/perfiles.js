/* ==========================================================
   perfiles.js - Qué ve cada cargo en el panel administrativo
   Las secciones y permisos coinciden con los del servidor
   (PERMISOS en backend/src/seguridad.js): ocultar un botón aquí es
   solo comodidad; quien decide de verdad es la API.
   ========================================================== */
export const PERFILES = {
  "Director(a) general": { area: "Dirección general", start: "resumen", sections: ["resumen", "area", "seguimiento", "cursos", "inscripciones", "mensajes", "ia", "encuestas"], courseArea: "", title: "Dirección general · todas las áreas", intro: "Diriges la fundación y supervisas el trabajo de todas las áreas y puedes corregirlo cuando haga falta: oferta académica, actividades y notas de los docentes, admisiones, comunicaciones, finanzas y el asistente.", tasks: [["Seguimiento de la ruta", "Mira el avance de cada joven, quién necesita apoyo y registra cada contacto.", "seguimiento"], ["Indicadores ejecutivos", "Consulta cifras de actividad y demanda de todas las áreas.", "resumen"], ["Oferta de formación", "Crea, edita y elimina cursos y fichas de cualquier área.", "cursos"], ["Admisiones", "Revisa y cambia el estado de las solicitudes de inscripción.", "inscripciones"], ["Comunicaciones", "Lee y responde los mensajes de contacto.", "mensajes"], ["Finanzas", "Revisa, registra, corrige o elimina los gastos del proyecto.", "area"], ["Pulso institucional", "Consulta encuestas organizadas por departamento.", "encuestas"], ["Experiencia de la comunidad", "Define el tono y la información del asistente.", "ia"]] },
  "Monitor(a)": { area: "Monitoría", start: "seguimiento", sections: ["resumen", "seguimiento", "encuestas"], courseArea: "", title: "Monitoría · seguimiento de la ruta", intro: "Acompañas a los jóvenes de la ruta: revisas su avance, ves quién se está quedando y te pones en contacto con ellos y con sus acudientes.", tasks: [["Seguimiento de la ruta", "Revisa el avance de cada joven y registra cada contacto con ellos o su acudiente.", "seguimiento"], ["Encuestas", "Consulta cómo se sienten los estudiantes con la ruta.", "encuestas"]] },
  "Coordinador(a) académico(a)": { area: "Coordinación académica", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Software", title: "Coordinación académica", intro: "Organiza el catálogo de software y cuida la experiencia de aprendizaje.", tasks: [["Cursos de software", "Consulta la programación de cursos de tu área.", "cursos"], ["Encuestas por departamento", "Consulta la escucha comunitaria.", "encuestas"]] },
  "Coordinador(a) de tecnología": { area: "Coordinación de tecnología", start: "area", sections: ["area", "cursos", "encuestas"], courseArea: "Hardware", title: "Coordinación de tecnología", intro: "Organiza las prácticas de tecnología y los recursos para laboratorios.", tasks: [["Cursos de hardware", "Consulta la programación de cursos de tu área.", "cursos"], ["Encuestas por departamento", "Consulta la escucha comunitaria.", "encuestas"]] },
  "Coordinador(a) de admisiones": { area: "Coordinación de admisiones", start: "area", sections: ["area", "inscripciones", "encuestas"], courseArea: "", title: "Coordinación de admisiones", intro: "Da seguimiento a solicitudes de ingreso sin acceso a mensajes de otras áreas.", tasks: [["Solicitudes de inscripción", "Filtra y actualiza las solicitudes de los cursos.", "inscripciones"], ["Encuestas por departamento", "Consulta la experiencia de ingreso y otros temas.", "encuestas"]] },
  "Coordinador(a) de comunicaciones": { area: "Coordinación de comunicaciones", start: "area", sections: ["area", "mensajes", "encuestas"], courseArea: "", title: "Coordinación de comunicaciones", intro: "Gestiona los mensajes públicos y el trabajo cotidiano de comunicación.", tasks: [["Bandeja de contacto", "Lee los mensajes recibidos desde la página pública.", "mensajes"], ["Encuestas por departamento", "Consulta las preguntas de toda la organización.", "encuestas"]] },
  "Admisiones y registro": { area: "Admisiones y registro", start: "area", sections: ["area", "inscripciones", "mensajes", "encuestas"], courseArea: "", title: "Admisiones y registro", intro: "Administra datos de aspirantes y da respuesta a las consultas de ingreso.", tasks: [["Solicitudes", "Revisa y actualiza inscripciones de cursos.", "inscripciones"], ["Consultas", "Responde mensajes sobre ingreso y registro.", "mensajes"], ["Encuestas", "Consulta la experiencia del proceso de inscripción.", "encuestas"]] },
  "Administración y finanzas": { area: "Administración y finanzas", start: "area", sections: ["area", "encuestas"], courseArea: "", title: "Administración y finanzas", intro: "Controla movimientos financieros y consulta las opiniones de la comunidad.", tasks: [["Control de gastos", "Registra movimientos y consulta totales del proyecto.", "area"], ["Encuestas financieras", "Consulta retroalimentación por departamento.", "encuestas"]] },
  "Comunicaciones y alianzas": { area: "Comunicaciones", start: "area", sections: ["area", "mensajes", "encuestas"], courseArea: "", title: "Comunicaciones y alianzas", intro: "Gestiona consultas, difusión y vínculos con la comunidad y aliados.", tasks: [["Bandeja de contacto", "Lee los mensajes recibidos desde la página pública.", "mensajes"], ["Encuestas de comunicación", "Consulta la claridad de los mensajes y canales.", "encuestas"]] },
  "Otro cargo administrativo": { area: "Administración", start: "area", sections: ["area", "encuestas"], courseArea: "", title: "Espacio administrativo", intro: "Consulta las encuestas por departamento y revisa las funciones asignadas a tu cargo.", tasks: [["Encuestas", "Los resultados están organizados por departamento.", "encuestas"]] }
};

export const CARGOS = Object.keys(PERFILES);
// Cargos que ven la actividad académica de los docentes
const ACADEMICOS = ["Director(a) general", "Coordinador(a) académico(a)", "Coordinador(a) de tecnología"];
// Registro de seguridad: PERMISOS.seguridad
const SEGURIDAD = ["Director(a) general"];
// = PERMISOS.finanzas, PERMISOS.editarCursos, PERMISOS.cuentasEquipo y PERMISOS.bloquearEstudiantes del servidor
const FINANZAS = ["Director(a) general", "Administración y finanzas"];
const EDITAN_CURSOS = ["Director(a) general"];

/* Perfil completo de un cargo: secciones visibles, tareas (accesos rápidos) y permisos */
export function construirPerfil(puesto) {
  const base = PERFILES[puesto] || PERFILES["Otro cargo administrativo"];
  const secciones = ["resumen", ...base.sections.filter((x) => x !== "resumen")];
  const tasks = [...base.tasks];
  if (ACADEMICOS.includes(puesto)) { secciones.splice(1, 0, "academico"); tasks.push(["Actividad académica", "Mira qué actividades publican los docentes y cómo van las entregas.", "academico"]); }
  if (SEGURIDAD.includes(puesto)) { secciones.push("seguridad"); tasks.push(["Seguridad", "Revisa ingresos, intentos fallidos y bloqueos de cuentas.", "seguridad"]); }
  // gestionaDocentes = PERMISOS.cuentasDocentes del servidor (los mismos cargos que editan cursos)
  const gestionaEquipo = puesto === "Director(a) general", gestionaEstudiantes = ["Director(a) general", "Coordinador(a) de admisiones"].includes(puesto), gestionaDocentes = EDITAN_CURSOS.includes(puesto);
  if (gestionaEquipo || gestionaEstudiantes || gestionaDocentes) {
    secciones.push("cuentas");
    tasks.push(["Cuentas", gestionaEquipo ? "Crea cuentas del equipo y de docentes, y bloquea estudiantes inactivos."
      : gestionaDocentes ? "Crea las cuentas de los docentes y desactívalas cuando dejen de dictar."
      : "Bloquea las cuentas de estudiantes inactivos y desbloquéalas cuando lo pidan.", "cuentas"]);
  }
  secciones.push("asistente");
  tasks.push(["Asistente de gestión", "Pregúntale por cifras, pendientes y funciones de tu cargo.", "asistente"]);
  return {
    ...base, tasks, secciones,
    permitidas: new Set([...secciones, "encuestas"]),
    finanzas: FINANZAS.includes(puesto),
    editaCursos: EDITAN_CURSOS.includes(puesto),
    eliminaCursos: puesto === "Director(a) general", // = PERMISOS.eliminarCursos del servidor (Talento Caribe no tiene Gerente)
    supervisa: puesto === "Director(a) general",
    gestionaEquipo, gestionaEstudiantes, gestionaDocentes,
  };
}
