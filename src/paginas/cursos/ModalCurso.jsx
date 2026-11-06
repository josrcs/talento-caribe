/* ModalCurso - Ficha completa de un curso: datos, módulos, proyecto y grupos (fichas) para elegir */
import { useState } from "react";
import { fichasDe, fechaCorta } from "../../lib/plataforma.js";
import { useDialogo } from "../../lib/ganchos.js";

const CLASE_FICHA = { "Inscripciones abiertas": "tag-lanzamiento", "En formación": "tag-formacion", Finalizada: "tag-finalizada" };

function Modulo({ modulo, abierto, semanas }) {
  const { numero, titulo, temas, actividades, evidencia } = modulo;
  return (
    <details className="modulo" open={abierto}>
      <summary>
        <span className="modulo-num">{numero}</span>
        <span className="modulo-titulo">
          <small>{semanas ? `Módulo ${numero} · Semanas ${numero * 2 - 1} y ${numero * 2}` : `Módulo ${numero}`}</small>{titulo}
        </span>
        <span className="modulo-cuenta">{`${temas.length} ${temas.length === 1 ? "tema" : "temas"}`}</span>
      </summary>
      <div className="modulo-cuerpo">
        <ul className="modulo-temas">{temas.map((tema) => <li key={tema}>{tema}</li>)}</ul>
        {actividades.length > 0 && (
          <>
            <p className="modulo-sub">Lo que harás</p>
            <ul className="modulo-acts">{actividades.map((a) => <li key={a}>{a}</li>)}</ul>
          </>
        )}
        {evidencia && <p className="modulo-evidencia"><strong>Entregas:</strong> {evidencia}</p>}
      </div>
    </details>
  );
}

/* fichaBuscada: el número que la persona escribió en el filtro (si coincide con una ficha abierta, queda elegida) */
export default function ModalCurso({ curso, fichaBuscada, alCerrar, alInscribirse }) {
  const ref = useDialogo(Boolean(curso), alCerrar);
  const fichas = curso ? fichasDe(curso.id) : [];
  const abiertas = fichas.filter((f) => f.estado === "Inscripciones abiertas");
  const sugerida = (abiertas.find((f) => fichaBuscada && f.numero.startsWith(fichaBuscada)) || abiertas[0])?.numero || "";
  const [fichaElegida, setFichaElegida] = useState(sugerida);
  const modulos = curso?.modulos || [];
  const conSemanas = curso && modulos.length * 2 === Number(curso.duracion);
  const puede = curso?.fase === "Lanzamiento" && Boolean(fichaElegida);
  const textoBoton = puede ? `Inscribirme en la ficha ${fichaElegida}` : curso?.fase === "Lanzamiento" ? "Sin fichas abiertas" : "Próximamente";
  const edad = Number(curso?.edadMinima ?? 14);
  const porDefinir = (v) => v || "Por definir";

  return (
    <dialog className="modal" aria-labelledby="mc-titulo" ref={ref}>
      {curso && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar detalle" onClick={alCerrar}>×</button>
          <h2 id="mc-titulo">{curso.titulo}</h2>
          <dl className="curso-meta">
            <div><dt>Área</dt><dd>{porDefinir(curso.area)}</dd></div>
            <div><dt>Nivel</dt><dd>{porDefinir(curso.nivel)}</dd></div>
            <div><dt>Duración</dt><dd>{`${curso.duracion} semanas`}</dd></div>
            <div><dt>Modalidad</dt><dd>{porDefinir(curso.modalidad)}</dd></div>
            <div><dt>Instructor</dt><dd>{porDefinir(curso.instructor)}</dd></div>
            <div><dt>Edad mínima</dt><dd>{edad > 0 ? `${edad} años` : "Sin mínimo específico"}</dd></div>
          </dl>
          <h3>De qué trata</h3>
          <p>{porDefinir(curso.descripcion)}</p>
          <h3>Lo que lograrás</h3>
          <p>{porDefinir(curso.objetivo)}</p>
          <h3>Módulos del curso</h3>
          <p className="modal-sub">Cada módulo agrupa los temas que se verán y las actividades para practicarlos.</p>
          <div className="modulos-lista">
            {modulos.length
              ? modulos.map((m, i) => <Modulo key={m.numero} modulo={m} abierto={i === 0} semanas={conSemanas} />)
              : <p>El contenido de este curso se publicará pronto.</p>}
          </div>
          <h3>Proyecto final</h3>
          <p>{porDefinir(curso.proyecto)}</p>
          <h3>Fichas</h3>
          <p className="modal-sub">Cada grupo del curso tiene un número de ficha. Elige el que mejor se acomode a tu horario.</p>
          <div className="fichas-lista" role="radiogroup" aria-label="Fichas del curso">
            {fichas.length ? fichas.map((f) => {
              const abierta = f.estado === "Inscripciones abiertas";
              return (
                <label className={`ficha-opcion ${abierta ? "" : "is-cerrada"}`} key={f.numero}>
                  <input type="radio" name="mc-ficha" value={f.numero} checked={f.numero === fichaElegida} disabled={!abierta} onChange={() => setFichaElegida(f.numero)} />
                  <span className="ficha-numero"><small>Ficha</small>{f.numero}</span>
                  <span className="ficha-datos"><strong>{f.jornada}</strong><small>{`Inicia ${fechaCorta(f.inicio)} · ${Number(f.cupos) || "—"} cupos`}</small></span>
                  <span className={`tag ${CLASE_FICHA[f.estado] || ""}`}>{f.estado}</span>
                </label>
              );
            }) : <p className="modal-sub">Pronto abriremos la primera ficha de este curso.</p>}
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn btn-primary" disabled={!puede} onClick={() => alInscribirse(curso, fichaElegida)}>{textoBoton}</button>
            <button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button>
          </div>
        </article>
      )}
    </dialog>
  );
}
