/* Orientador - Dos preguntas y una recomendación de curso, con su próximo grupo.
   Todo sale del catálogo: si el equipo cambia un curso o abre un grupo, la recomendación se actualiza sola. */
import { useState } from "react";
import { INTERESES, EXPERIENCIAS, RECOMENDACIONES } from "./contenido.js";
import { buscarCurso, fichasDe, fechaLarga, t } from "../../lib/plataforma.js";

/* Próximo grupo del curso: primero uno con inscripciones abiertas; si no hay, el siguiente que vaya a abrir */
function proximoGrupo(cursoId) {
  const delCurso = [...fichasDe(cursoId)].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
  return delCurso.find((f) => f.estado === "Inscripciones abiertas") || delCurso.find((f) => f.estado === "Próximamente") || null;
}

function Opcion({ nombre, valor, elegido, alElegir, titulo, detalle }) {
  return (
    <label className="or-opcion">
      <input type="radio" name={nombre} value={valor} checked={elegido === valor} onChange={() => alElegir(valor)} />
      <span>
        <strong>{titulo}</strong>
        {detalle && <small>{detalle}</small>}
      </span>
    </label>
  );
}

function Recomendacion({ interes, experiencia }) {
  const [id, porque] = RECOMENDACIONES[interes][experiencia];
  const curso = buscarCurso(id);
  if (!curso) {
    return <p className="orientador-vacio">Revisa el catálogo completo para elegir tu curso. <a href="cursos.html">Ver el catálogo</a></p>;
  }
  const grupo = proximoGrupo(curso.id);
  const datos = [curso.nivel, t("{n} semanas", { n: Number(curso.duracion) || 16 }), curso.modalidad];
  if (grupo) datos.push(t(grupo.estado === "Inscripciones abiertas" ? "Inicia el {fecha}" : "Abre el {fecha}", { fecha: fechaLarga(grupo.inicio) }));
  const disponible = curso.fase === "Lanzamiento";
  return (
    <div className="recomendacion">
      <p className="recomendacion-etiqueta">Te recomendamos</p>
      <h3>{curso.titulo}</h3>
      <p className="recomendacion-porque">{porque}</p>
      <ul className="recomendacion-datos">{datos.map((d) => <li key={d}>{d}</li>)}</ul>
      {curso.proyecto && <p className="recomendacion-proyecto"><strong>Tu proyecto final:</strong> {curso.proyecto}</p>}
      <div className="recomendacion-acciones">
        <a className="btn btn-primary" href={`cursos.html?curso=${encodeURIComponent(curso.id)}`}>{disponible ? "Ver el curso e inscribirme" : "Ver el curso"}</a>
        <a className="btn btn-outline" href="cursos.html">Comparar con otros cursos</a>
      </div>
    </div>
  );
}

export default function Orientador() {
  const [interes, setInteres] = useState("");
  const [experiencia, setExperiencia] = useState("");
  return (
    <section id="empieza" className="section" aria-labelledby="empieza-titulo">
      <div className="container orientador">
        <div className="orientador-texto" data-revelar="">
          <span className="eyebrow">Orientación</span>
          <h2 id="empieza-titulo">¿No sabes por dónde empezar? Responde dos preguntas.</h2>
          <p>Te mostramos el curso que mejor encaja contigo, con su fecha de inicio. No necesitas registrarte para verlo.</p>
        </div>
        <form className="orientador-form" onSubmit={(e) => e.preventDefault()} data-revelar="">
          <fieldset>
            <legend><span>1</span> ¿Qué te gustaría hacer?</legend>
            <div className="or-opciones">
              {INTERESES.map((o) => <Opcion key={o.valor} nombre="interes" elegido={interes} alElegir={setInteres} {...o} />)}
            </div>
          </fieldset>
          <fieldset>
            <legend><span>2</span> ¿Has programado alguna vez?</legend>
            <div className="or-opciones or-opciones-dos">
              {EXPERIENCIAS.map((o) => <Opcion key={o.valor} nombre="experiencia" elegido={experiencia} alElegir={setExperiencia} {...o} />)}
            </div>
          </fieldset>
          <div className="orientador-resultado" aria-live="polite">
            {interes && experiencia
              ? <Recomendacion key={interes + experiencia} interes={interes} experiencia={experiencia} />
              : <p className="orientador-vacio">Tu recomendación aparece aquí cuando respondas las dos preguntas.</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
