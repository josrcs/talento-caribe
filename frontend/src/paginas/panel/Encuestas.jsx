/* Encuestas.jsx - Resultados de las encuestas que responden los estudiantes, agrupados y sin nombres */
import { useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { Barras } from "./comunes.jsx";

function Resultado({ p }) {
  if (p.tipo === "escala") return <><p className="resultado-promedio"><strong>{p.promedio == null ? "—" : p.promedio.toFixed(1)}</strong>{" / 5 "}<small>promedio</small></p><Barras filas={["1", "2", "3", "4", "5"].map((t, i) => ({ etiqueta: t, valor: p.conteo[i] }))} /></>;
  if (p.tipo === "opciones") return <Barras filas={p.opciones.map((t, i) => ({ etiqueta: t, valor: p.conteo[i] }))} />;
  if (!p.textos.length) return <p className="form-ayuda">Sin comentarios todavía.</p>;
  const resto = p.textos.length - 3;
  return (
    <>
      <ul className="resultado-textos" data-no-traducir>{p.textos.slice(0, 3).map((t, i) => <li key={i}>{"«" + t + "»"}</li>)}</ul>
      {resto > 0 && <p className="form-ayuda">{`Y ${resto}${resto === 1 ? " comentario más." : " comentarios más."}`}</p>}
    </>
  );
}

function TarjetaEncuesta({ e }) {
  const { modelo: D } = useDatos();
  const r = D.resultadosEncuesta(e);
  return (
    <article className="department-card encuesta-resultados">
      <div className="encuesta-cabecera"><span className="tag">{e.dept}</span><span className={"pill " + (r.total ? "pill-ok" : "")}>{r.total + (r.total === 1 ? " respuesta" : " respuestas")}</span></div>
      <h3>{e.titulo}</h3>
      {r.preguntas.map((p, i) => (
        <div className="resultado" key={p.id}>
          <p className="resultado-pregunta"><span className="pregunta-num">{`${i + 1}.`}</span> {p.texto}</p>
          {r.total > 0 && <Resultado p={p} />}
        </div>
      ))}
      {!r.total && <p className="form-ayuda">Aún no hay respuestas. Los estudiantes encuentran esta encuesta en su portal.</p>}
    </article>
  );
}

export default function Encuestas() {
  const { modelo: D } = useDatos();
  const [dept, setDept] = useState("");
  const encuestas = D.encuestas();
  const grupos = [...new Set(encuestas.map((e) => e.dept))].filter((n) => !dept || n === dept);
  return (
    <>
      <div className="seccion-cabecera"><div><span className="eyebrow">ESCUCHA A LA COMUNIDAD</span><h1 id="t-encuestas">Encuestas por departamento</h1></div></div>
      <p>Resultados de las encuestas que responden los estudiantes en su portal. Todo el equipo administrativo los ve agrupados y sin nombres; usa el filtro para ver cada área.</p>
      <div className="campo encuesta-filtro">
        <label htmlFor="filtro-encuestas">Departamento</label>
        <select id="filtro-encuestas" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">Todos los departamentos</option>
          {["Académico", "Tecnología", "Admisiones", "Comunicaciones", "Administración y finanzas"].map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="survey-departments">
        {grupos.map((nombre) => (
          <section className="survey-department" key={nombre}>
            <h2>{nombre}</h2>
            <div className="survey-grid">{encuestas.filter((e) => e.dept === nombre).map((e) => <TarjetaEncuesta e={e} key={e.id} />)}</div>
          </section>
        ))}
      </div>
      <p className="nota-requisitos">Cada estudiante responde una vez cada encuesta. Los comentarios escritos se muestran sin el nombre de quien respondió.</p>
    </>
  );
}
