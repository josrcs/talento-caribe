/* ==========================================================
   perfiles.js - Qué ve cada cargo en el panel administrativo
   Las secciones y permisos coinciden con los del servidor
   (PERMISOS en backend/src/seguridad.js): ocultar un botón aquí es
   solo comodidad; quien decide de verdad es la API.
   ========================================================== */
export const PERFILES = {
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

export const CARGOS = Object.keys(PERFILES);
// Cargos que ven la actividad académica de los docentes
const ACADEMICOS = ["Gerente", "Director(a) general", "Director(a) académico(a)", "Director(a) de tecnología", "Coordinador(a) académico(a)", "Coordinador(a) de tecnología"];
// Registro de seguridad: PERMISOS.seguridad
const SEGURIDAD = ["Gerente", "Director(a) general", "Director(a) de tecnología"];
// = PERMISOS.finanzas, PERMISOS.editarCursos, PERMISOS.cuentasEquipo y PERMISOS.bloquearEstudiantes del servidor
const FINANZAS = ["Gerente", "Administración y finanzas", "Director(a) administrativo(a)"];
const EDITAN_CURSOS = ["Gerente", "Director(a) académico(a)", "Director(a) de tecnología"];

/* Perfil completo de un cargo: secciones visibles, tareas (accesos rápidos) y permisos */
export function construirPerfil(puesto) {
  const base = PERFILES[puesto] || PERFILES["Otro cargo administrativo"];
  const secciones = ["resumen", ...base.sections.filter((x) => x !== "resumen")];
  const tasks = [...base.tasks];
  if (ACADEMICOS.includes(puesto)) { secciones.splice(1, 0, "academico"); tasks.push(["Actividad académica", "Mira qué actividades publican los docentes y cómo van las entregas.", "academico"]); }
  if (SEGURIDAD.includes(puesto)) { secciones.push("seguridad"); tasks.push(["Seguridad", "Revisa ingresos, intentos fallidos y bloqueos de cuentas.", "seguridad"]); }
  const gestionaEquipo = puesto === "Gerente", gestionaEstudiantes = ["Gerente", "Coordinador(a) de admisiones"].includes(puesto);
  if (gestionaEquipo || gestionaEstudiantes) {
    secciones.push("cuentas");
    tasks.push(["Cuentas", gestionaEquipo ? "Crea o elimina cuentas del equipo y bloquea estudiantes inactivos." : "Bloquea las cuentas de estudiantes inactivos y desbloquéalas cuando lo pidan.", "cuentas"]);
  }
  secciones.push("asistente");
  tasks.push(["Asistente de gestión", "Pregúntale por cifras, pendientes y funciones de tu cargo.", "asistente"]);
  return {
    ...base, tasks, secciones,
    permitidas: new Set([...secciones, "encuestas"]),
    finanzas: FINANZAS.includes(puesto),
    editaCursos: EDITAN_CURSOS.includes(puesto),
    supervisa: puesto === "Gerente",
    gestionaEquipo, gestionaEstudiantes,
  };
}
