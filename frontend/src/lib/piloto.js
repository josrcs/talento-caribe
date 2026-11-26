/* ==========================================================
   piloto.js - Datos del piloto 2027 que usan las páginas públicas
   La ruta es la misma de compartido/cursos.json (propiedad "piloto").
   Los cursos se buscan por su nombre (no por su número), así funciona igual
   en la base de prueba y en la publicada, donde los números son otros.
   ========================================================== */
export const PILOTO = {
  ciudad: "Barranquilla",
  pais: "Colombia",
  periodo: "primer y segundo trimestre de 2027",
  semanasPorCurso: 2,
  ruta: [
    { titulo: "HTML y CSS: tu primera página web", corto: "HTML y CSS", logro: "La estructura y el diseño de tu página." },
    { titulo: "JavaScript para principiantes", corto: "JavaScript", logro: "Botones, menús y formularios que responden." },
    { titulo: "Python desde cero", corto: "Python", logro: "El servidor que recibe lo que envía tu página." },
    { titulo: "PostgreSQL: tu primera base de datos", corto: "PostgreSQL", logro: "Los datos de tu página, guardados para siempre." },
  ],
};

const clave = (texto) => String(texto || "").trim().toLocaleLowerCase("es");

/* Posición del curso en la ruta (0, 1, 2, 3) o -1 si no es de la ruta */
export const pasoDeRuta = (curso) => PILOTO.ruta.findIndex((p) => clave(p.titulo) === clave(curso?.titulo));

/* Ordena los cursos: primero los de la ruta en su orden, después los demás */
export function ordenarPorRuta(cursos) {
  const peso = (c) => { const i = pasoDeRuta(c); return i < 0 ? 99 : i; };
  return [...cursos].sort((a, b) => peso(a) - peso(b) || Number(a.id) - Number(b.id));
}

/* Los pasos de la ruta con su curso del catálogo (si ya llegó de la API) */
export const rutaConCursos = (cursos) => PILOTO.ruta.map((paso, i) => ({ ...paso, numero: i + 1, curso: cursos.find((c) => pasoDeRuta(c) === i) || null }));
