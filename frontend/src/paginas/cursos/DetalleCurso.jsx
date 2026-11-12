/* DetalleCurso.jsx - Ventana con el detalle de un curso: datos, módulos, proyecto y fichas.
   Solo se puede elegir una ficha con inscripciones abiertas. */
import Modal from "../../componentes/Modal.jsx";
import { locale } from "../../i18n/idioma.js";

const fechaCorta = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "Por definir");
const claseFicha = (estado) => ({ "Inscripciones abiertas": "tag-lanzamiento", "En formación": "tag-formacion", Finalizada: "tag-finalizada" }[estado] || "");
const o = (valor) => valor || "Por definir";

export default function DetalleCurso({ curso, fichas, fichaElegida, alElegirFicha, alInscribirse, alCerrar }) {
  const modulos = curso?.modulos || [];
  const edad = Number(curso?.edadMinima ?? 14);
  const puede = curso?.fase === "Lanzamiento" && Boolean(fichaElegida);
  return (
    <Modal abierto={Boolean(curso)} alCerrar={alCerrar} etiqueta="mc-titulo" id="modal-curso">
      {curso && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar detalle" onClick={alCerrar}>&times;</button>
          <h2 id="mc-titulo">{curso.titulo}</h2>
          <dl className="curso-meta">
            <div><dt>Área</dt><dd>{o(curso.area)}</dd></div>
            <div><dt>Nivel</dt><dd>{o(curso.nivel)}</dd></div>
            <div><dt>Duración</dt><dd>{`${curso.duracion} semanas`}</dd></div>
            <div><dt>Modalidad</dt><dd>{o(curso.modalidad)}</dd></div>
            <div><dt>Instructor</dt><dd>{o(curso.instructor)}</dd></div>
            <div><dt>Edad mínima</dt><dd>{edad > 0 ? `${edad} años` : "Sin mínimo específico"}</dd></div>
          </dl>
          <h3>De qué trata</h3>
          <p>{o(curso.descripcion)}</p>
          <h3>Lo que lograrás</h3>
          <p>{o(curso.objetivo)}</p>
          <h3>Módulos del curso</h3>
          <p className="modal-sub">Cada módulo agrupa los temas que se verán y las actividades para practicarlos.</p>
          <div className="modulos-lista">
            {modulos.length ? modulos.map((m, i) => (
              <details className="modulo" open={i === 0} key={m.numero}>
                <summary>
                  <span className="modulo-num">{m.numero}</span>
                  <span className="modulo-titulo"><small>{`Módulo ${m.numero}${modulos.length * 2 === Number(curso.duracion) ? ` · Semanas ${m.numero * 2 - 1} y ${m.numero * 2}` : ""}`}</small>{m.titulo}</span>
                  <span className="modulo-cuenta">{`${m.temas.length} ${m.temas.length === 1 ? "tema" : "temas"}`}</span>
                </summary>
                <div className="modulo-cuerpo">
                  <ul className="modulo-temas">{m.temas.map((t) => <li key={t}>{t}</li>)}</ul>
                  {m.actividades.length > 0 && <><p className="modulo-sub">Lo que harás</p><ul className="modulo-acts">{m.actividades.map((a) => <li key={a}>{a}</li>)}</ul></>}
                  {m.evidencia && <p className="modulo-evidencia"><strong>Entregas:</strong> {m.evidencia}</p>}
                </div>
              </details>
            )) : <p>El contenido de este curso se publicará pronto.</p>}
          </div>
          <h3>Proyecto final</h3>
          <p>{o(curso.proyecto)}</p>
          <h3>Fichas</h3>
          <p className="modal-sub">Cada grupo del curso tiene un número de ficha. Elige el que mejor se acomode a tu horario.</p>
          <div className="fichas-lista" role="radiogroup" aria-label="Fichas del curso">
            {fichas.length ? fichas.map((f) => {
              const abierta = f.estado === "Inscripciones abiertas";
              return (
                <label className={`ficha-opcion ${abierta ? "" : "is-cerrada"}`} key={f.numero}>
                  <input type="radio" name="mc-ficha" value={f.numero} checked={f.numero === fichaElegida} disabled={!abierta} onChange={() => alElegirFicha(f.numero)} />
                  <span className="ficha-numero"><small>Ficha</small>{f.numero}</span>
                  <span className="ficha-datos"><strong>{f.jornada}</strong><small>{`Inicia ${fechaCorta(f.inicio)} · ${Number(f.cupos) || "—"} cupos`}</small></span>
                  <span className={`tag ${claseFicha(f.estado)}`}>{f.estado}</span>
                </label>
              );
            }) : <p className="modal-sub">Pronto abriremos la primera ficha de este curso.</p>}
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn btn-primary" id="mc-inscribirme" disabled={!puede} onClick={alInscribirse}>
              {puede ? `Inscribirme en la ficha ${fichaElegida}` : curso.fase === "Lanzamiento" ? "Sin fichas abiertas" : "Próximamente"}
            </button>
            <button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button>
          </div>
        </article>
      )}
    </Modal>
  );
}
