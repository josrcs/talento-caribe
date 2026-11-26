/* Catalogo.jsx - La ruta del piloto 2027 en el inicio («Programación desde cero»):
   5 módulos en orden, cada uno con su enlace a la página de la ruta. */
import { useDatos } from "../../contexto/Datos.jsx";
import { PILOTO, rutaConCursos } from "../../lib/piloto.js";

export function RutaPiloto() {
  const { modelo } = useDatos();
  const pasos = rutaConCursos(modelo.cursos());
  return (
    <ol className="ruta-piloto" data-escalonar>
      {pasos.map((p) => (
        <li className="ruta-paso" key={p.titulo}>
          <span className="ruta-paso-num" aria-hidden="true">{p.numero}</span>
          <div className="ruta-paso-texto">
            <p className="ruta-paso-etiqueta">{`Módulo ${p.numero} de ${pasos.length} · ${PILOTO.semanasPorModulo} semana`}</p>
            <h3>{p.corto}</h3>
            <p>{p.logro}</p>
            {p.curso && <a className="btn-texto-plano" href={`cursos.html?curso=${encodeURIComponent(p.curso.id)}`}>Ver el módulo →</a>}
          </div>
        </li>
      ))}
    </ol>
  );
}
