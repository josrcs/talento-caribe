/* Catalogo.jsx - Partes del inicio que salen del catálogo de la API:
   rutas de aprendizaje por área y cursos con inscripciones abiertas. */
import { useDatos } from "../../contexto/Datos.jsx";

const Esqueleto = () => <div className="curso-card esqueleto" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>;

/* Cursos de un área, de básico a intermedio */
export function RutaLista({ area }) {
  const { modelo } = useDatos();
  const nivel = (c) => (c.nivel === "Básico" ? 0 : c.nivel === "Intermedio" ? 1 : 2);
  const delArea = modelo.cursos().filter((c) => c.area === area).sort((a, b) => nivel(a) - nivel(b) || Number(a.id) - Number(b.id));
  return (
    <ol className="ruta-lista">
      {delArea.map((c) => {
        const abierto = c.fase === "Lanzamiento";
        return (
          <li key={c.id}>
            <a href={`cursos.html?curso=${encodeURIComponent(c.id)}`}>
              <span className="ruta-curso">{c.titulo}<small><span>{c.nivel}</span> · <span>{c.modalidad}</span></small></span>
              <span className={`tag ${abierto ? "tag-lanzamiento" : "tag-pronto"}`}>{abierto ? "Disponible" : "Próximamente"}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/* Tres cursos con inscripciones abiertas. Mientras llegan los datos se ven tarjetas esqueleto. */
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
      {modelo.cursos().filter((c) => c.fase === "Lanzamiento").slice(0, 3).map((c) => (
        <article className="curso-card" data-revelar key={c.id}>
          <div className="curso-etiquetas"><span className="tag">{c.area}</span><span className="tag tag-lanzamiento">Inscripciones abiertas</span></div>
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
