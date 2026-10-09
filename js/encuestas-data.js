/* ==========================================================
   encuestas-data.js - Encuestas por departamento
   Las responde cada estudiante en su portal (una vez por encuesta) y el
   equipo administrativo ve los resultados en el panel, agrupados y sin
   nombres. El servidor valida las respuestas con este mismo archivo
   (backend/src/rutas/encuestas.js).
   Tipos de pregunta:
     escala   -> de 1 a 5
     opciones -> una de la lista "opciones"
     texto    -> respuesta libre y corta (es opcional)
   ========================================================== */
window.TALENTO_CARIBE_ENCUESTAS = [
  { id: "experiencia-curso", dept: "Académico", titulo: "Experiencia del curso", preguntas: [
    { id: "claridad", tipo: "escala", texto: "¿Qué tan claro fue el contenido de las clases?" },
    { id: "proyecto", tipo: "opciones", texto: "¿Pudiste avanzar en tu proyecto práctico?", opciones: ["Sí, lo terminé", "Voy por la mitad", "Todavía no empiezo"] },
    { id: "siguiente", tipo: "texto", texto: "¿Qué tema te gustaría aprender después?" },
  ] },
  { id: "herramientas", dept: "Tecnología", titulo: "Herramientas y conectividad", preguntas: [
    { id: "equipos", tipo: "opciones", texto: "¿Contaste con los equipos necesarios para practicar?", opciones: ["Sí, siempre", "A veces", "No"] },
    { id: "acceso", tipo: "opciones", texto: "¿Tuviste dificultades para entrar a las sesiones?", opciones: ["Nunca", "Algunas veces", "Con frecuencia"] },
    { id: "falto", tipo: "texto", texto: "¿Qué herramienta o equipo hizo falta?" },
  ] },
  { id: "inscripcion", dept: "Admisiones", titulo: "Proceso de inscripción", preguntas: [
    { id: "encontrar", tipo: "escala", texto: "¿Qué tan fácil fue encontrar el curso adecuado?" },
    { id: "instrucciones", tipo: "escala", texto: "¿Qué tan claras fueron las instrucciones para inscribirte?" },
    { id: "mejorar", tipo: "texto", texto: "¿Qué podemos mejorar del proceso de registro?" },
  ] },
  { id: "comunidad", dept: "Comunicaciones", titulo: "Información y comunidad", preguntas: [
    { id: "medio", tipo: "opciones", texto: "¿Por qué medio conociste Talento Caribe?", opciones: ["Redes sociales", "Un amigo o familiar", "Colegio o universidad", "Otro"] },
    { id: "informacion", tipo: "escala", texto: "¿Qué tan clara fue la información sobre los cursos?" },
    { id: "contenido", tipo: "texto", texto: "¿Qué contenido te gustaría recibir?" },
  ] },
  { id: "recursos", dept: "Administración y finanzas", titulo: "Apoyo y recursos", preguntas: [
    { id: "materiales", tipo: "opciones", texto: "¿Tuviste los materiales necesarios para participar?", opciones: ["Sí", "En parte", "No"] },
    { id: "prioridad", tipo: "opciones", texto: "¿Qué recurso debería priorizarse para mejorar los cursos?", opciones: ["Equipos y kits", "Conectividad", "Transporte", "Materiales de estudio"] },
    { id: "observacion", tipo: "texto", texto: "¿Quieres dejar una observación para el equipo?" },
  ] },
];

/* Respuestas de ejemplo de los estudiantes de prueba, para que el panel tenga resultados desde
   el primer día (las usan la demostración, backend/scripts/generar-seed.js y actualizar-db.js).
   La cuenta estudiante@talentocaribe.co no tiene respuestas: así se puede probar responder. */
window.TALENTO_CARIBE_RESPUESTAS_EJEMPLO = [
  { correo: "luis.gomez@correo.com", encuesta: "experiencia-curso", respuestas: { claridad: 5, proyecto: "Voy por la mitad", siguiente: "Python para analizar datos" } },
  { correo: "andrea.castro@correo.com", encuesta: "experiencia-curso", respuestas: { claridad: 4, proyecto: "Voy por la mitad", siguiente: "Desarrollo web con JavaScript" } },
  { correo: "maria.torres@correo.com", encuesta: "experiencia-curso", respuestas: { claridad: 4, proyecto: "Sí, lo terminé", siguiente: "Diseño de páginas para emprendimientos" } },
  { correo: "kevin.ariza@correo.com", encuesta: "experiencia-curso", respuestas: { claridad: 3, proyecto: "Todavía no empiezo", siguiente: "" } },
  { correo: "daniela.ruiz@correo.com", encuesta: "experiencia-curso", respuestas: { claridad: 5, proyecto: "Sí, lo terminé", siguiente: "Robótica con sensores" } },
  { correo: "luis.gomez@correo.com", encuesta: "herramientas", respuestas: { equipos: "A veces", acceso: "Algunas veces", falto: "Un computador en la sede los sábados" } },
  { correo: "kevin.ariza@correo.com", encuesta: "herramientas", respuestas: { equipos: "No", acceso: "Con frecuencia", falto: "Internet estable en la casa" } },
  { correo: "daniela.ruiz@correo.com", encuesta: "herramientas", respuestas: { equipos: "Sí, siempre", acceso: "Nunca", falto: "" } },
  { correo: "maria.torres@correo.com", encuesta: "inscripcion", respuestas: { encontrar: 5, instrucciones: 4, mejorar: "Avisar por WhatsApp cuando aprueben la inscripción" } },
  { correo: "andrea.castro@correo.com", encuesta: "inscripcion", respuestas: { encontrar: 4, instrucciones: 5, mejorar: "" } },
  { correo: "kevin.ariza@correo.com", encuesta: "inscripcion", respuestas: { encontrar: 3, instrucciones: 3, mejorar: "Explicar mejor qué es una ficha" } },
  { correo: "luis.gomez@correo.com", encuesta: "comunidad", respuestas: { medio: "Un amigo o familiar", informacion: 4, contenido: "Retos semanales de programación" } },
  { correo: "maria.torres@correo.com", encuesta: "comunidad", respuestas: { medio: "Redes sociales", informacion: 5, contenido: "Historias de egresados" } },
  { correo: "daniela.ruiz@correo.com", encuesta: "comunidad", respuestas: { medio: "Colegio o universidad", informacion: 4, contenido: "" } },
  { correo: "andrea.castro@correo.com", encuesta: "recursos", respuestas: { materiales: "En parte", prioridad: "Equipos y kits", observacion: "Más kits de Arduino para practicar en casa" } },
  { correo: "kevin.ariza@correo.com", encuesta: "recursos", respuestas: { materiales: "No", prioridad: "Conectividad", observacion: "" } },
];
