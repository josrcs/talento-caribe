/* Catalogo.jsx - La ruta del piloto 2027 en el inicio («Programación desde cero»).
   Se dibuja como un camino: las olas del logo unen los 5 módulos (soles numerados)
   y al final está la meta (palma): tu página web con su base de datos y tu constancia. */
import { useDatos } from "../../contexto/Datos.jsx";
import { PILOTO, rutaConCursos } from "../../lib/piloto.js";

export function RutaPiloto() {
  const { modelo } = useDatos();
  const pasos = rutaConCursos(modelo.cursos());
  return (
    <ol className="camino" aria-label={`La ruta ${PILOTO.nombre}, en orden`} data-escalonar>
      {pasos.map((p) => (
        <li className="camino-parada" key={p.titulo}>
          <span className="camino-marca" aria-hidden="true"><span className="camino-num">{p.numero}</span></span>
          <article className="camino-tarjeta">
            <p className="camino-etiqueta">{`Módulo ${p.numero} · ${PILOTO.semanasPorModulo} semanas`}</p>
            <h3>{p.corto}</h3>
            <p>{p.logro}</p>
            {p.curso && <a className="btn-texto-plano" href={`cursos.html?curso=${encodeURIComponent(p.curso.id)}`}>Ver el módulo →</a>}
          </article>
        </li>
      ))}
      <li className="camino-parada camino-meta">
        <span className="camino-marca" aria-hidden="true"><span className="camino-num">🏁</span></span>
        <article className="camino-tarjeta">
          <p className="camino-etiqueta">La meta</p>
          <h3>Tu página web completa</h3>
          <p>Con su base de datos, hecha por ti desde cero, y tu constancia de participación.</p>
        </article>
      </li>
    </ol>
  );
}
