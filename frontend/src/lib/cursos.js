/* ==========================================================
   cursos.js - Módulos y guía de clase de cada curso
   Los cursos llegan de la API (GET /api/datos). Su catálogo inicial está en
   compartido/cursos.json, el mismo archivo con el que el backend llena la base.
   ========================================================== */

/* ---------- Módulos ----------
   Cada curso se divide en módulos con sus temas y actividades del plan.
   Si un curso todavía no tiene "modulos" definidos, se arman a partir de su temario:
   cada línea del temario es un módulo y sus partes (separadas por coma o "y") son los temas.
   Para escribirlos a mano, agrega al curso:
     modulos: [{ titulo: 'Nombre del módulo', temas: ['Tema 1', 'Tema 2'], actividades: ['Taller: ...'] }, ...] */
export const modulosDe = (curso) => {
  if (Array.isArray(curso.modulos) && curso.modulos.length) {
    return curso.modulos.map((m, i) => ({ numero: i + 1, titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || (m.temas || []).join(", "), actividades: m.actividades || [], evidencia: m.evidencia || "" }));
  }
  const partir = (texto) => String(texto).split(/,\s*|\s+y\s+/).map((t) => t.trim()).filter(Boolean).map((t) => t[0].toUpperCase() + t.slice(1));
  return (curso.temario || []).map((linea, i) => {
    // "Nombre del módulo: tema 1, tema 2" -> título y temas por separado
    const dos = String(linea).match(/^([^:]{3,80}):\s*(.+)$/);
    return { numero: i + 1, titulo: dos ? dos[1].trim() : linea, temas: partir(dos ? dos[2] : linea), temasTexto: dos ? dos[2] : linea, actividades: [], evidencia: "" };
  });
};

/* ---------- Guía de clase de un módulo (para docentes) ----------
   Cada módulo dura dos semanas con dos sesiones modelo de 90 minutos. La estructura es la del plan de cursos:
   se completa con el título, los temas, la actividad y la evidencia del módulo, y con la guía del curso. */
export const sesionesDe = (curso, m) => {
  const g = curso.guia || {}, actividad = (m.actividades && m.actividades[0]) || "la actividad del módulo";
  const temas = m.temasTexto || m.temas.join(", ");
  return [
    { nombre: "Primera semana · Sesión 1", pasos: [
      ["Inicio de la clase", 10, m.numero === 1 ? "Inicie con una pregunta breve sobre una situación cotidiana relacionada con el tema; use las respuestas para presentar el vocabulario de la clase." : "Inicie recuperando una idea del módulo anterior y pregunte cómo se aplicaría al nuevo reto."],
      ["Desarrollo", 25, `Explique ${m.titulo.toLowerCase()} en palabras sencillas. Desarrolle estos conceptos uno por uno: ${temas}. Dibuje o escriba cómo se conectan y use un caso concreto antes de pasar a la práctica.`],
      ["Modelado docente", 20, `Muestre la actividad «${actividad}» paso a paso: plantee el reto, modele una primera decisión, diga qué espera observar y compruebe el resultado. Pida al grupo que prediga el paso siguiente y explique una corrección frecuente.`],
      ["Práctica guiada", 25, "El grupo comienza la misma actividad con apoyo; haga dos pausas de revisión y pida que expliquen qué decisión tomaron."],
      ["Cierre", 10, "Cada estudiante dice qué entendió y deja una pregunta o un error que logró corregir."],
    ] },
    { nombre: "Segunda semana · Sesión 2", pasos: [
      ["Recuperación", 10, "Repase tres ideas clave con preguntas breves."],
      ["Revisión guiada", 10, "Reconstruyan los pasos y aclaren dudas."],
      ["Reto aplicado", 40, g.reto || "Proponga una variación del ejercicio y compruebe el resultado."],
      ["Revisión entre pares", 20, "Intercambien productos y comprueben con estas preguntas: " + ((g.preguntas || []).join(" ") || "¿Qué funcionó? ¿Qué mejorarías?")],
      ["Cierre y entrega", 10, `Incorporen una mejora y entreguen: ${(m.evidencia || "la evidencia del módulo").replace(/\.$/, "")}.`],
    ] },
  ];
};
