/* Orientador.jsx - "¿Por dónde empiezo?": dos preguntas y una recomendación.
   Todo sale del catálogo de la API (cursos y fichas): si el equipo cambia un curso o
   abre un grupo nuevo desde el panel, la recomendación se actualiza sola. */
import { useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { fecha as fechaLocal, t } from "../../i18n/idioma.js";

// [interés][experiencia] → curso recomendado y por qué
const RECOMENDACIONES = {
  web: { no: [3, "Empiezas por lo visual: ves el resultado de cada línea que escribes y terminas con tu página publicada en internet."], si: [4, "Si ya escribiste algo de código, JavaScript es el paso que hace que una página responda a lo que hace la persona."] },
  datos: { no: [2, "Python es el lenguaje más usado para datos e inteligencia artificial, y uno de los más fáciles de leer para empezar."], si: [7, "Con una base de programación, aquí entiendes qué puede hacer la IA, cuáles son sus límites y cómo usarla bien."] },
  hardware: { no: [8, "Antes de programar una placa conviene entender la electricidad: aquí armas y mides tus primeros circuitos."], si: [9, "Si ya programaste, con Arduino llevas ese código al mundo físico: luces, sensores y motores."] },
  explorar: { no: [1, "Es el curso de entrada: aprendes a pensar un problema paso a paso, la base de cualquier ruta que elijas después."], si: [2, "Python sirve para casi todo y te deja probar varias áreas antes de decidir cuál seguir."] },
};
const INTERESES = [
  ["web", "Crear páginas web y aplicaciones", "Diseño, código y publicar en internet"],
  ["datos", "Trabajar con datos e inteligencia artificial", "Python, automatizar tareas, IA"],
  ["hardware", "Armar circuitos y robots", "Electrónica, Arduino, sensores"],
  ["explorar", "Todavía no lo sé", "Quiero una base para decidir"],
];
const fecha = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : fechaLocal(d, { day: "numeric", month: "long", year: "numeric" });
};

export default function Orientador() {
  const { modelo } = useDatos();
  const [interes, setInteres] = useState("");
  const [experiencia, setExperiencia] = useState("");

  /* Próximo grupo del curso: primero uno con inscripciones abiertas; si no hay, el siguiente que vaya a abrir */
  const proximoGrupo = (cursoId) => {
    const delCurso = [...modelo.fichasDeCurso(cursoId)].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
    return delCurso.find((f) => f.estado === "Inscripciones abiertas") || delCurso.find((f) => f.estado === "Próximamente") || null;
  };

  function resultado() {
    if (!interes || !experiencia) return <p className="orientador-vacio">Tu recomendación aparece aquí cuando respondas las dos preguntas.</p>;
    const [id, porque] = RECOMENDACIONES[interes][experiencia];
    const curso = modelo.curso(id);
    if (!curso) return <p className="orientador-vacio">{t("Revisa el catálogo completo para elegir tu curso.")} <a href="cursos.html">{t("Ver el catálogo")}</a></p>;
    const grupo = proximoGrupo(curso.id);
    const datos = [curso.nivel, t("{n} semanas", { n: Number(curso.duracion) || 16 }), curso.modalidad];
    if (grupo) datos.push(grupo.estado === "Inscripciones abiertas" ? t("Inicia el {fecha}", { fecha: fecha(grupo.inicio) }) : t("Abre el {fecha}", { fecha: fecha(grupo.inicio) }));
    const disponible = curso.fase === "Lanzamiento";
    return (
      <div className="recomendacion">
        <p className="recomendacion-etiqueta">{t("Te recomendamos")}</p>
        <h3>{curso.titulo}</h3>
        <p className="recomendacion-porque">{t(porque)}</p>
        <ul className="recomendacion-datos">{datos.map((d) => <li key={d}>{d}</li>)}</ul>
        {curso.proyecto && <p className="recomendacion-proyecto"><strong>{t("Tu proyecto final:")}</strong> {curso.proyecto}</p>}
        <div className="recomendacion-acciones">
          <a className="btn btn-primary" href={`cursos.html?curso=${encodeURIComponent(curso.id)}`}>{t(disponible ? "Ver el curso e inscribirme" : "Ver el curso")}</a>
          <a className="btn btn-outline" href="cursos.html">{t("Comparar con otros cursos")}</a>
        </div>
      </div>
    );
  }

  return (
    <form className="orientador-form" id="orientador" data-revelar onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend><span>1</span> ¿Qué te gustaría hacer?</legend>
        <div className="or-opciones">
          {INTERESES.map(([valor, titulo, detalle]) => (
            <label className="or-opcion" key={valor}>
              <input type="radio" name="interes" value={valor} checked={interes === valor} onChange={() => setInteres(valor)} />
              <span><strong>{titulo}</strong><small>{detalle}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend><span>2</span> ¿Has programado alguna vez?</legend>
        <div className="or-opciones or-opciones-dos">
          <label className="or-opcion"><input type="radio" name="experiencia" value="no" checked={experiencia === "no"} onChange={() => setExperiencia("no")} /><span><strong>Nunca</strong></span></label>
          <label className="or-opcion"><input type="radio" name="experiencia" value="si" checked={experiencia === "si"} onChange={() => setExperiencia("si")} /><span><strong>Sí, un poco</strong></span></label>
        </div>
      </fieldset>
      <div className="orientador-resultado" id="orientador-resultado" aria-live="polite">
        {resultado()}
      </div>
    </form>
  );
}
