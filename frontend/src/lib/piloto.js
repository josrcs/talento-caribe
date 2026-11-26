/* ==========================================================
   piloto.js - La ruta del piloto 2027 que usan las páginas públicas
   «Programación desde cero»: 5 módulos en orden. Cada módulo dura 2 semanas, con una
   clase presencial por semana. Es la misma ruta de compartido/cursos.json.
   Estado: en planeación. Todavía no hay inscripciones: se reciben solicitudes y el
   equipo las aprueba (la solicitud se guarda en el primer módulo).
   Cada módulo es un curso en la base de datos y se busca por su nombre (no por su
   número): así funciona igual en la base de prueba y en la publicada.
   Las páginas públicas solo muestran los módulos de la ruta.
   ========================================================== */
export const PILOTO = {
  nombre: "Programación desde cero",
  ciudad: "Barranquilla",
  pais: "Colombia",
  periodo: "primer y segundo trimestre de 2027",
  estado: "En planeación",
  semanasPorModulo: 2,
  clasesPorSemana: 1,
  ruta: [
    { titulo: "Lógica de programación", corto: "Lógica de programación", logro: "Pensar como programador: algoritmos, decisiones y ciclos." },
    { titulo: "Git y GitHub", corto: "Git y GitHub", logro: "Guardar y publicar tu código como los equipos de verdad." },
    { titulo: "HTML y CSS: tu primera página web", corto: "HTML y CSS", logro: "La estructura y el diseño de tu página web." },
    { titulo: "JavaScript para principiantes", corto: "JavaScript", logro: "Botones, menús y formularios que responden." },
    { titulo: "Bases de datos con SQL", corto: "Bases de datos con SQL", logro: "Guardar y consultar información con SQL." },
  ],
};

const clave = (texto) => String(texto || "").trim().toLocaleLowerCase("es");

/* Posición del módulo en la ruta (0 a 4) o -1 si no es de la ruta */
export const pasoDeRuta = (curso) => PILOTO.ruta.findIndex((p) => clave(p.titulo) === clave(curso?.titulo));

/* Solo los módulos de la ruta, en su orden */
export const soloRuta = (cursos) => cursos.filter((c) => pasoDeRuta(c) >= 0).sort((a, b) => pasoDeRuta(a) - pasoDeRuta(b));

/* Los pasos de la ruta con su curso del catálogo (si ya llegó de la API) */
export const rutaConCursos = (cursos) => PILOTO.ruta.map((paso, i) => ({ ...paso, numero: i + 1, curso: cursos.find((c) => pasoDeRuta(c) === i) || null }));

/* "1 semana" o "2 semanas" */
export const semanas = (n) => `${Number(n) || 0} ${Number(n) === 1 ? "semana" : "semanas"}`;
