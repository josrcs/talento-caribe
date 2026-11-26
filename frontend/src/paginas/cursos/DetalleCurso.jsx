/* DetalleCurso.jsx - Ventana con el detalle de un módulo de la ruta: datos, clases y proyecto.
   Piloto 2027 (en planeación): no se muestra el mentor (todavía no hay mentores), cada módulo
   dura 2 semanas con una clase por semana, y la solicitud de cupo es a la ruta completa
   (la hace Cursos.jsx en el primer módulo; el equipo la aprueba). */
import Modal from "../../componentes/Modal.jsx";
import { PILOTO, pasoDeRuta, semanas } from "../../lib/piloto.js";

const o = (valor) => valor || "Por definir";

export default function DetalleCurso({ curso, puedeInscribirse, alInscribirse, alCerrar }) {
  const clases = curso?.modulos || [];
  const edad = Number(curso?.edadMinima ?? 14);
  const paso = curso ? pasoDeRuta(curso) + 1 : 0;
  return (
    <Modal abierto={Boolean(curso)} alCerrar={alCerrar} etiqueta="mc-titulo" id="modal-curso">
      {curso && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar detalle" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">{`Módulo ${paso} de ${PILOTO.ruta.length} · ${PILOTO.nombre}`}</span>
          <h2 id="mc-titulo">{curso.titulo}</h2>
          <dl className="curso-meta">
            <div><dt>Nivel</dt><dd>{o(curso.nivel)}</dd></div>
            <div><dt>Duración</dt><dd>{semanas(curso.duracion)}</dd></div>
            <div><dt>Modalidad</dt><dd>{o(curso.modalidad)}</dd></div>
            <div><dt>Dónde</dt><dd>Barranquilla</dd></div>
            <div><dt>Edad mínima</dt><dd>{edad > 0 ? `${edad} años` : "Sin mínimo específico"}</dd></div>
          </dl>
          <h3>De qué trata</h3>
          <p>{o(curso.descripcion)}</p>
          <h3>Lo que lograrás</h3>
          <p>{o(curso.objetivo)}</p>
          <h3>Clases del módulo</h3>
          <p className="modal-sub">{`${clases.length} clases presenciales, una por semana. Cada clase tiene sus temas y una práctica, y entre clase y clase hay un reto corto para la casa.`}</p>
          <div className="modulos-lista">
            {clases.length ? clases.map((m, i) => (
              <details className="modulo" open={i === 0} key={m.numero}>
                <summary>
                  <span className="modulo-num">{m.numero}</span>
                  <span className="modulo-titulo"><small>{`Semana ${m.numero}`}</small>{m.titulo}</span>
                  <span className="modulo-cuenta">{`${m.temas.length} ${m.temas.length === 1 ? "tema" : "temas"}`}</span>
                </summary>
                <div className="modulo-cuerpo">
                  <ul className="modulo-temas">{m.temas.map((t) => <li key={t}>{t}</li>)}</ul>
                  {m.actividades.length > 0 && <><p className="modulo-sub">Lo que harás</p><ul className="modulo-acts">{m.actividades.map((a) => <li key={a}>{a}</li>)}</ul></>}
                  {m.evidencia && <p className="modulo-evidencia"><strong>Entregas:</strong> {m.evidencia}</p>}
                </div>
              </details>
            )) : <p>El contenido de este módulo se publicará pronto.</p>}
          </div>
          <h3>Proyecto del módulo</h3>
          <p>{o(curso.proyecto)}</p>
          <p className="aviso-piloto" role="note"><strong>Estamos en planeación.</strong> La solicitud es a la ruta completa: empiezas por el módulo 1 y sigues en orden. El equipo revisa cada solicitud y, si quedas, te avisamos por correo la fecha y el horario de tu grupo en Barranquilla (2027). Al terminar recibes una constancia de participación.</p>
          <div className="modal-acciones">
            <button type="button" className="btn btn-primary" id="mc-inscribirme" disabled={!puedeInscribirse} onClick={alInscribirse}>
              {puedeInscribirse ? "Solicitar mi cupo" : "Solicitudes pronto"}
            </button>
            <button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button>
          </div>
        </article>
      )}
    </Modal>
  );
}
