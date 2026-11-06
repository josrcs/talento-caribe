/* Secciones informativas del inicio: cifras, rutas, ritmo de cada módulo, proceso,
   cursos abiertos, mentores, nosotros, preguntas frecuentes y cierre. */
import { AREAS, SEMANAS, PROCESO, MENTORES, HISTORIA, PILARES, PREGUNTAS } from "./contenido.js";
import { cursos, t } from "../../lib/plataforma.js";

export function Cifras({ totalCursos, totalModulos }) {
  const cifras = [
    [totalCursos, "cursos gratuitos"],
    [totalModulos, "módulos prácticos"],
    [MENTORES.length, "mentores que te acompañan"],
    [0, "pesos de matrícula"],
  ];
  return (
    <section className="cifras" aria-label="Talento Caribe en cifras">
      <div className="container cifras-grid">
        {cifras.map(([numero, texto]) => (
          <div className="cifra" key={texto}><strong>{numero}</strong><span>{texto}</span></div>
        ))}
      </div>
    </section>
  );
}

/* Cursos de cada área ordenados de básico a intermedio */
const nivel = (c) => (c.nivel === "Básico" ? 0 : c.nivel === "Intermedio" ? 1 : 2);

export function Rutas() {
  return (
    <section id="rutas" className="section section-alt" aria-labelledby="rutas-titulo">
      <div className="container">
        <div className="section-cabecera" data-revelar="">
          <span className="eyebrow">Rutas de aprendizaje</span>
          <h2 id="rutas-titulo">Dos rutas, doce cursos</h2>
          <p className="section-intro">Cada curso tiene 8 módulos de dos semanas. Puedes tomar uno solo o seguir la ruta completa, en el orden que te sugerimos.</p>
        </div>
        <div className="rutas">
          {AREAS.map(({ area, descripcion, clase }) => {
            const lista = cursos().filter((c) => c.area === area).sort((a, b) => nivel(a) - nivel(b) || Number(a.id) - Number(b.id));
            return (
              <article className={`ruta-area ${clase || ""}`} key={area} data-revelar="">
                <header className="ruta-cabecera">
                  <h3>{area}</h3>
                  <p>{descripcion}</p>
                </header>
                <ol className="ruta-lista">
                  {lista.map((c) => {
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
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Metodo() {
  return (
    <section id="metodo" className="section" aria-labelledby="metodo-titulo">
      <div className="container">
        <div className="section-cabecera" data-revelar="">
          <span className="eyebrow">Cómo se aprende</span>
          <h2 id="metodo-titulo">Cada módulo dura dos semanas y siempre sigue el mismo ritmo</h2>
          <p className="section-intro">Una clase de 90 minutos por semana. La primera es para entender y practicar con ayuda; la segunda, para resolver un reto por tu cuenta y mostrarlo.</p>
        </div>
        <div className="semanas">
          {SEMANAS.map((semana) => (
            <article className="semana" key={semana.numero} data-revelar="">
              <h3><span>{`Semana ${semana.numero}`}</span> {semana.titulo}</h3>
              {/* Barra de 90 minutos: cada tramo mide lo que dura */}
              <div className="semana-barra" aria-hidden="true">
                {semana.pasos.map((p) => <span key={p.nombre} className={p.practica ? "practica" : undefined} style={{ "--min": p.minutos }} />)}
              </div>
              <ol className="semana-pasos">
                {semana.pasos.map((p) => (
                  <li key={p.nombre} className={p.practica ? "practica" : undefined}>
                    <strong>{p.nombre}</strong><span>{`${p.minutos} min`}</span><p>{p.texto}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        <p className="semanas-nota" data-revelar=""><span className="semana-leyenda" aria-hidden="true" /> Más de la mitad del tiempo de clase es práctica: tú con las manos en el código o en el circuito.</p>
      </div>
    </section>
  );
}

export function Proceso() {
  return (
    <section id="como-funciona" className="section section-alt" aria-labelledby="pasos-titulo">
      <div className="container">
        <div className="section-cabecera" data-revelar="">
          <span className="eyebrow">El proceso</span>
          <h2 id="pasos-titulo">De la inscripción al certificado</h2>
        </div>
        <ol className="pasos" data-escalonar="">
          {PROCESO.map((p) => (
            <li key={p.titulo}><h3>{p.titulo}</h3><p>{p.texto}</p><span className="paso-tiempo">{p.tiempo}</span></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Los primeros tres cursos con inscripciones abiertas. Mientras llegan los datos se ven tarjetas esqueleto. */
export function CursosAbiertos({ listos }) {
  const abiertos = cursos().filter((c) => c.fase === "Lanzamiento").slice(0, 3);
  return (
    <section id="cursos" className="section" aria-labelledby="cursos-titulo">
      <div className="container">
        <div className="section-cabecera section-cabecera-fila" data-revelar="">
          <div>
            <span className="eyebrow">Inscripciones abiertas</span>
            <h2 id="cursos-titulo">Empieza por uno de estos cursos</h2>
            <p className="section-intro">Cada curso termina con un proyecto que tú construyes.</p>
          </div>
          <a href="cursos.html" className="btn btn-outline btn-flecha">Ver todo el catálogo</a>
        </div>
        <div id="cursos-destacados" className="grid-cursos" aria-busy={!listos}>
          {!listos
            ? [1, 2, 3].map((n) => <div className="curso-card esqueleto" aria-hidden="true" key={n}><span /><span /><span /><span /><span /></div>)
            : abiertos.map((c) => (
              <article className="curso-card" key={c.id} data-revelar="">
                <div className="curso-etiquetas"><span className="tag">{c.area}</span><span className="tag tag-lanzamiento">Inscripciones abiertas</span></div>
                <h3>{c.titulo}</h3>
                <p className="curso-objetivo">{c.objetivo || c.descripcion}</p>
                <div className="curso-card-pie">
                  <span className="curso-duracion">{`${Number(c.duracion) || ""} semanas · ${c.modalidad}`}</span>
                  <a className="btn-texto-plano" href={`cursos.html?curso=${encodeURIComponent(c.id)}`}>Ver detalles →</a>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

export function Mentores() {
  return (
    <section id="mentores" className="section section-alt" aria-labelledby="mentores-titulo">
      <div className="container">
        <div className="section-cabecera" data-revelar="">
          <span className="eyebrow">Mentores</span>
          <h2 id="mentores-titulo">Quiénes te acompañan</h2>
          <p className="section-intro">Profesionales de la región que enseñan lo que hacen en su trabajo y revisan tus entregas.</p>
        </div>
        <ul className="mentores" data-escalonar="">
          {MENTORES.map((m) => (
            <li className="mentor" key={m.nombre}><span className="avatar" aria-hidden="true">{m.iniciales}</span><h3>{m.nombre}</h3><p>{m.perfil}</p></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Nosotros() {
  return (
    <section id="nosotros" className="section" aria-labelledby="nosotros-titulo">
      <div className="container nosotros-grid">
        <div className="nosotros-texto" data-revelar="">
          <span className="eyebrow">Nosotros</span>
          <h2 id="nosotros-titulo">Una plataforma joven con una idea clara</h2>
          {HISTORIA.map((parrafo) => <p key={parrafo.slice(0, 20)}>{parrafo}</p>)}
        </div>
        <div className="pilares" data-escalonar="">
          {PILARES.map((p) => <article className="pilar" key={p.titulo}><h3>{p.titulo}</h3><p>{p.texto}</p></article>)}
        </div>
      </div>
    </section>
  );
}

export function Preguntas({ edadHabitual }) {
  return (
    <section id="preguntas" className="section section-alt" aria-labelledby="preguntas-titulo">
      <div className="container preguntas-grid">
        <div className="section-cabecera" data-revelar="">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2 id="preguntas-titulo">Lo que casi todos preguntan antes de inscribirse</h2>
          <p className="section-intro">¿Tu duda no está aquí? Pregúntale al asistente o escríbenos.</p>
        </div>
        {/* <details> funciona con teclado y sin JavaScript extra */}
        <div className="preguntas" data-revelar="">
          {PREGUNTAS.map((p, i) => (
            <details key={p.pregunta} open={i === 0}>
              <summary>{p.pregunta}</summary>
              <p>{p.conEdad ? t(p.respuesta, { n: edadHabitual }) : p.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cierre() {
  return (
    <section className="cta-final" aria-labelledby="cta-titulo">
      <div className="container cta-final-caja" data-revelar="">
        <div>
          <h2 id="cta-titulo">Tu primer paso toma cinco minutos.</h2>
          <p>Responde el orientador o explora el catálogo. Las inscripciones de los próximos grupos ya están abiertas.</p>
        </div>
        <div className="cta-final-acciones">
          <a href="#empieza" className="btn btn-primary">Encuentra tu curso</a>
          <a href="cursos.html" className="btn btn-outline">Ver el catálogo</a>
        </div>
      </div>
    </section>
  );
}
