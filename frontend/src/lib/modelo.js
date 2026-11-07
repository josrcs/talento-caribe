/* ==========================================================
   modelo.js - Consultas sobre los datos que entrega la API
   GET /api/datos devuelve SOLO lo que el usuario actual puede ver
   (ver backend/src/rutas/datos.js). crearModelo(datos) arma, sobre esa
   respuesta, las consultas que usan las páginas: cursos de un docente,
   actividades de un estudiante, progreso por módulo, resultados de encuestas...
   Son funciones puras: no guardan nada. Para escribir se usa la API
   (ver src/contexto/Datos.jsx, que vuelve a cargar los datos después).
   ========================================================== */
import { modulosDe } from "./cursos.js";
import { norm } from "./utils.js";
import { encuestas as ENCUESTAS } from "../../../compartido/encuestas.json";

/* Un docente por cada mentor. Cada uno dicta los cursos donde aparece como instructor. */
export const DOCENTES = [
  { nombre: "Camila Ospino", correo: "docente@talentocaribe.co", especialidad: "Desarrollo web", iniciales: "CO" },
  { nombre: "Daniel Barrios", correo: "daniel@talentocaribe.co", especialidad: "Programación y datos", iniciales: "DB" },
  { nombre: "Valeria De la Hoz", correo: "valeria@talentocaribe.co", especialidad: "IA aplicada", iniciales: "VH" },
  { nombre: "Andrés Pacheco", correo: "andres@talentocaribe.co", especialidad: "Electrónica y robótica", iniciales: "AP" },
  { nombre: "Laura Mendoza", correo: "laura@talentocaribe.co", especialidad: "Hardware e IoT", iniciales: "LM" },
];

export const TIPOS = {
  Tarea: { icono: "lapiz", color: "#1ab0d6" },
  Práctica: { icono: "codigo", color: "#1268c8" },
  Quiz: { icono: "pregunta", color: "#f8ac24" },
  Lectura: { icono: "libro", color: "#0f9a80" },
  Proyecto: { icono: "cohete", color: "#a78bfa" },
};

export function diasRestantes(fecha) {
  if (!fecha) return Infinity;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const limite = new Date(String(fecha).slice(0, 10) + "T00:00:00");
  return Math.round((limite - hoy) / 86400000);
}
export function textoVence(fecha) {
  const d = diasRestantes(fecha);
  if (d === Infinity) return "Sin fecha límite";
  if (d < 0) return `Venció hace ${-d} ${-d === 1 ? "día" : "días"}`;
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  return `Vence en ${d} días`;
}

export const VACIO = { cursos: [], fichas: [], inscripciones: [], actividades: [], entregas: [], mensajes: [], gastos: [], ia: null, encuestas: [] };

export function crearModelo(d = VACIO) {
  const cursos = () => d.cursos;
  const curso = (id) => d.cursos.find((c) => Number(c.id) === Number(id));
  const inscripciones = () => d.inscripciones;
  const actividades = () => d.actividades;
  const entregas = () => d.entregas;

  /* ---------- Fichas y módulos ---------- */
  const fichas = () => d.fichas;
  const ficha = (numero) => d.fichas.find((f) => String(f.numero) === String(numero));
  const fichasDeCurso = (id) => d.fichas.filter((f) => Number(f.curso_id) === Number(id));
  const fichaAbierta = (id) => fichasDeCurso(id).find((f) => f.estado === "Inscripciones abiertas") || fichasDeCurso(id).find((f) => f.estado !== "Finalizada") || fichasDeCurso(id)[0];
  const modulos = (c) => c?.modulos || [];
  /* Ficha de una inscripción (las antiguas sin ficha quedan en la primera ficha del curso) */
  const fichaDeInscripcion = (i) => i?.ficha || fichasDeCurso(i?.curso_id)[0]?.numero || "";
  const fichaDe = (correo, curso_id) => fichaDeInscripcion(d.inscripciones.find((i) => norm(i.correo) === norm(correo) && Number(i.curso_id) === Number(curso_id)));
  /* ¿Una actividad le llega a esta ficha? (sin ficha = a todas las fichas del curso) */
  const llegaA = (a, numero) => !a.ficha || String(a.ficha) === String(numero);

  const docentePorCorreo = (correo) => DOCENTES.find((x) => norm(x.correo) === norm(correo));
  const cursosDeDocente = (nombre) => d.cursos.filter((c) => norm(c.instructor) === norm(nombre));
  const matriculas = (correo) => d.inscripciones.filter((i) => norm(i.correo) === norm(correo));
  const cursosDeEstudiante = (correo) => matriculas(correo).filter((i) => i.estado === "aprobada").map((i) => curso(i.curso_id)).filter(Boolean);
  const estudiantesDeCurso = (id, numeroFicha = "") => {
    const vistos = new Set();
    return d.inscripciones.filter((i) => Number(i.curso_id) === Number(id) && i.estado === "aprobada" && (!numeroFicha || fichaDeInscripcion(i) === String(numeroFicha)) && !vistos.has(norm(i.correo)) && vistos.add(norm(i.correo)))
      .map((i) => ({ ...i, ficha: fichaDeInscripcion(i) }));
  };
  const estudiantesDeFicha = (numero) => { const f = ficha(numero); return f ? estudiantesDeCurso(f.curso_id, f.numero) : []; };
  const fichasDeDocente = (nombre) => { const ids = new Set(cursosDeDocente(nombre).map((c) => Number(c.id))); return d.fichas.filter((f) => ids.has(Number(f.curso_id))); };
  /* Estudiantes que deben entregar una actividad (los de su ficha, o de todo el curso) */
  const destinatarios = (a) => (a.ficha ? estudiantesDeCurso(a.curso_id, a.ficha) : estudiantesDeCurso(a.curso_id));
  const porFecha = (a, b) => String(a.fecha_limite || "").localeCompare(String(b.fecha_limite || ""));
  const actividadesDeCurso = (id) => d.actividades.filter((a) => Number(a.curso_id) === Number(id)).sort(porFecha);
  const actividadesDeDocente = (nombre) => { const ids = new Set(cursosDeDocente(nombre).map((c) => Number(c.id))); return d.actividades.filter((a) => ids.has(Number(a.curso_id))); };
  const actividadesDeEstudiante = (correo) => { const ids = new Set(cursosDeEstudiante(correo).map((c) => Number(c.id))); return d.actividades.filter((a) => ids.has(Number(a.curso_id)) && llegaA(a, fichaDe(correo, a.curso_id))).sort(porFecha); };
  const entregaDe = (actividad_id, correo) => d.entregas.find((e) => String(e.actividad_id) === String(actividad_id) && norm(e.correo) === norm(correo));
  const entregasDeActividad = (actividad_id) => d.entregas.filter((e) => String(e.actividad_id) === String(actividad_id));

  /* Estado de una actividad para un estudiante: pendiente, vencida, entregada o revisada */
  function estadoPara(actividad, correo) {
    const e = entregaDe(actividad.id, correo);
    if (e) return e.estado;
    return diasRestantes(actividad.fecha_limite) < 0 ? "vencida" : "pendiente";
  }
  function progreso(correo, curso_id) {
    const f = fichaDe(correo, curso_id);
    const acts = actividadesDeCurso(curso_id).filter((a) => llegaA(a, f));
    const hechas = acts.filter((a) => entregaDe(a.id, correo)).length;
    const notas = acts.map((a) => entregaDe(a.id, correo)?.nota).filter((n) => n !== null && n !== undefined).map(Number);
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
      const notas = ents.map((e) => e.nota).filter((n) => n !== null && n !== undefined).map(Number);
      const vencidas = delModulo.filter((a) => !entregaDe(a.id, correo) && diasRestantes(a.fecha_limite) < 0).length;
      const total = delModulo.length, hechas = ents.length;
      const estado = !total ? "sin-actividades" : hechas === total ? "completo" : hechas ? "en-curso" : "sin-iniciar";
      return { ...m, total, hechas, vencidas, calificadas: notas.length, porcentaje: total ? Math.round((hechas / total) * 100) : 0, promedio: notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null, estado, actividades_publicadas: delModulo };
    });
  }

  /* ---------- Encuestas ----------
     El estudiante recibe solo cuáles respondió; el equipo administrativo, las respuestas sin nombres. */
  const encuestas = () => ENCUESTAS;
  const respuestasEncuestas = () => d.encuestas || [];
  const encuestaRespondida = (id) => respuestasEncuestas().some((r) => r.encuesta === id);
  /* Resultados agrupados de una encuesta: promedio y conteo (escala), conteo por opción y comentarios */
  function resultadosEncuesta(encuesta) {
    const lista = respuestasEncuestas().filter((r) => r.encuesta === encuesta.id);
    return {
      total: lista.length,
      preguntas: encuesta.preguntas.map((p) => {
        const valores = lista.map((r) => r.respuestas?.[p.id]).filter((v) => v !== undefined && v !== null && v !== "");
        if (p.tipo === "escala") {
          const numeros = valores.map(Number);
          return { ...p, total: numeros.length, promedio: numeros.length ? numeros.reduce((a, b) => a + b, 0) / numeros.length : null, conteo: [1, 2, 3, 4, 5].map((n) => numeros.filter((v) => v === n).length) };
        }
        if (p.tipo === "opciones") return { ...p, total: valores.length, conteo: p.opciones.map((o) => valores.filter((v) => v === o).length) };
        return { ...p, total: valores.length, textos: valores.map(String) };
      }),
    };
  }

  /* Siguiente número de ficha libre (5 dígitos, consecutivo) */
  const siguienteFicha = () => String(Math.max(25000, ...d.fichas.map((f) => Number(f.numero) || 0)) + 1);

  return {
    DOCENTES, TIPOS, curso, cursos, inscripciones, actividades, entregas,
    mensajes: () => d.mensajes || [], gastos: () => (d.gastos || []).map((g) => ({ ...g, id: String(g.id) })), ia: () => d.ia,
    fichas, ficha, fichasDeCurso, fichaAbierta, fichasDeDocente, fichaDe, fichaDeInscripcion, estudiantesDeFicha, destinatarios, llegaA, modulos, progresoModulos, siguienteFicha,
    docentePorCorreo, cursosDeDocente, matriculas, cursosDeEstudiante, estudiantesDeCurso,
    actividadesDeCurso, actividadesDeDocente, actividadesDeEstudiante, entregaDe, entregasDeActividad,
    estadoPara, diasRestantes, textoVence, progreso,
    encuestas, encuestaRespondida, resultadosEncuesta,
  };
}

/* Los cursos llegan con sus módulos en bruto: se numeran y se completan aquí */
export const prepararDatos = (d) => ({ ...VACIO, ...d, cursos: (d.cursos || []).map((c) => ({ ...c, modulos: modulosDe(c) })), fichas: d.fichas || [] });
