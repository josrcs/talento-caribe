/* Catalogo.jsx - Partes del inicio que salen del catálogo de la API:
   la ruta del piloto 2027 y los cursos con preinscripción abierta. */
import { useDatos } from "../../contexto/Datos.jsx";
import { ordenarPorRuta, rutaConCursos } from "../../lib/piloto.js";

const Esqueleto = () => <div className="curso-card esqueleto" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>;

/* La ruta del piloto: 4 cursos en orden, de cero a una página web completa */
export function RutaPiloto() {
  const { modelo } = useDatos();
  const pasos = rutaConCursos(modelo.cursos());
  return (
    <ol className="ruta-piloto" data-escalonar>
      {pasos.map((p) => (
        <li className="ruta-paso" key={p.titulo}>
          <span className="ruta-paso-num" aria-hidden="true">{p.numero}</span>
          <div className="ruta-paso-texto">
            <p className="ruta-paso-etiqueta">{`Curso ${p.numero} de ${pasos.length} · 2 semanas`}</p>
            <h3>{p.corto}</h3>
            <p>{p.logro}</p>
            {p.curso && <a className="btn-texto-plano" href={`cursos.html?curso=${encodeURIComponent(p.curso.id)}`}>Ver el curso →</a>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* Los cursos de la ruta con preinscripción abierta. Mientras llegan los datos se ven tarjetas esqueleto. */
export function Destacados() {
  const { cargando, error, modelo, acciones } = useDatos();
  if (error && !modelo.cursos().length) {
    return (
      <div className="estado estado-error" role="alert">
        <p>No pudimos cargar los cursos. Revisa tu conexión e inténtalo de nuevo.</p>
        <p className="form-ayuda">{error.message}</p>
        <button type="button" className="btn btn-outline" onClick={() => acciones.recargar().catch(() => {})}>Reintentar</button>
      </div>
    );
  }
  if (cargando) return <div className="grid-cursos" aria-busy="true"><Esqueleto /><Esqueleto /><Esqueleto /></div>;
  return (
    <div id="cursos-destacados" className="grid-cursos">
      {ordenarPorRuta(modelo.cursos().filter((c) => c.fase === "Lanzamiento")).slice(0, 4).map((c) => (
        <article className="curso-card" data-revelar key={c.id}>
          <div className="curso-etiquetas"><span className="tag">{c.nivel}</span><span className="tag tag-lanzamiento">Preinscripción abierta</span></div>
          <h3>{c.titulo}</h3><p className="curso-objetivo">{c.objetivo || c.descripcion}</p>
          <div className="curso-card-pie">
            <span className="curso-duracion">{Number(c.duracion) || ""} semanas · {c.modalidad}</span>
            <a className="btn-texto-plano" href={`cursos.html?curso=${encodeURIComponent(c.id)}`}>Ver detalles →</a>
          </div>
        </article>
      ))}
    </div>
  );
}
