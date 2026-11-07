/* ==========================================================
   Cursos.jsx - Catálogo de cursos (cursos.html)
   Filtros (texto, número de ficha, área, nivel, modalidad), tarjetas,
   detalle del curso con sus fichas y preinscripción.
   Enlaces que entiende:  ?curso=ID abre ese curso · ?ficha=25896 filtra por ficha
                          ?continuar=ID vuelve del registro o del ingreso y sigue con la inscripción
   ========================================================== */
import { useEffect, useRef, useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { leerSesion } from "../../lib/sesion.js";
import { parametros } from "../../lib/rutas.js";
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import DetalleCurso from "./DetalleCurso.jsx";
import FormInscripcion from "./FormInscripcion.jsx";

const ENLACES = [
  { href: "index.html#nosotros", texto: "Nosotros" },
  { href: "cursos.html", texto: "Cursos", actual: true },
  { href: "index.html#mentores", texto: "Mentores" },
  { href: "index.html#asistente", texto: "Asistente IA" },
  { href: "index.html#contacto", texto: "Contacto" },
  { href: "#lista-cursos-seccion", texto: "Inscríbete", className: "btn btn-primary" },
];
const FILTROS_VACIOS = { q: "", ficha: "", area: "", nivel: "", modalidad: "" };
const Esqueleto = () => <div className="curso-card esqueleto" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>;

export default function Cursos() {
  const { cargando, error, modelo, acciones } = useDatos();
  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_VACIOS, ficha: parametros().get("ficha") || "" }));
  const [detalle, setDetalle] = useState(null); // curso abierto
  const [fichaElegida, setFichaElegida] = useState("");
  const [inscripcion, setInscripcion] = useState(null); // { curso, ficha, sesion }
  const yaAbrio = useRef(false);

  const cursos = modelo.cursos();
  const fichaBuscada = filtros.ficha.replace(/\D/g, "");
  const q = filtros.q.trim().toLocaleLowerCase("es");
  const resultado = cursos.filter((c) => {
    const fichas = modelo.fichasDeCurso(c.id);
    return (!q || `${c.titulo} ${c.descripcion} ${c.area} ${fichas.map((f) => f.numero).join(" ")}`.toLocaleLowerCase("es").includes(q)) &&
      (!fichaBuscada || fichas.some((f) => f.numero.startsWith(fichaBuscada))) &&
      (!filtros.area || c.area === filtros.area) && (!filtros.nivel || c.nivel === filtros.nivel) && (!filtros.modalidad || c.modalidad === filtros.modalidad);
  });
  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  function abrirCurso(id) {
    const curso = modelo.curso(id);
    if (!curso) return;
    const abiertas = modelo.fichasDeCurso(curso.id).filter((f) => f.estado === "Inscripciones abiertas");
    setFichaElegida((abiertas.find((f) => fichaBuscada && f.numero.startsWith(fichaBuscada)) || abiertas[0])?.numero || "");
    setDetalle(curso);
  }
  function inscribirse(curso = detalle, ficha = fichaElegida) {
    if (!curso || curso.fase !== "Lanzamiento" || !ficha) return;
    const sesion = leerSesion();
    if (!sesion || sesion.rol !== "estudiante") { location.href = `registro.html?curso=${encodeURIComponent(curso.id)}`; return; }
    if (!sesion.numero_documento || !sesion.fecha_nacimiento || !sesion.pais || !sesion.telefono) {
      location.href = `registro.html?completar=1&curso=${encodeURIComponent(curso.id)}`; return;
    }
    setDetalle(null);
    setInscripcion({ curso, ficha, sesion });
  }

  // Cuando llega el catálogo: ?continuar=ID sigue con la inscripción; ?curso=ID abre el detalle
  useEffect(() => {
    if (cargando || yaAbrio.current || !cursos.length) return;
    yaAbrio.current = true;
    const continuar = Number(parametros().get("continuar")), enlace = Number(parametros().get("curso"));
    if (continuar > 0) {
      const curso = modelo.curso(continuar);
      const ficha = modelo.fichasDeCurso(continuar).find((f) => f.estado === "Inscripciones abiertas")?.numero;
      if (curso && ficha && leerSesion()) inscribirse(curso, ficha); else abrirCurso(continuar);
    } else if (enlace > 0) abrirCurso(enlace);
  }); // se revisa en cada pintada hasta que el catálogo está listo

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li><a href="admin/login.html" className="btn btn-outline">Ingresar</a></li>} />
      <main id="contenido">
        <section className="page-intro">
          <div className="container">
            <h1 data-revelar="titulo">Catálogo de cursos</h1>
            <p data-revelar>Todos son gratuitos y puedes empezar sin experiencia previa. Aprende desde cero, a tu ritmo y con acompañamiento.</p>
          </div>
        </section>

        <section id="lista-cursos-seccion" className="section" aria-label="Catálogo">
          <div className="container">
            <form id="filtros" className="filtros" role="search" aria-label="Filtrar cursos" data-revelar onSubmit={(e) => e.preventDefault()}>
              <div className="campo">
                <label htmlFor="f-buscar">Buscar</label>
                <input id="f-buscar" name="q" type="search" placeholder="Python, Arduino, páginas web..." value={filtros.q} onChange={cambiar} />
              </div>
              <div className="campo campo-ficha">
                <label htmlFor="f-ficha">N.º de ficha</label>
                <input id="f-ficha" name="ficha" type="search" inputMode="numeric" maxLength="6" placeholder="Ej. 25896" autoComplete="off" value={filtros.ficha} onChange={cambiar} />
              </div>
              <div className="campo">
                <label htmlFor="f-area">Área</label>
                <select id="f-area" name="area" value={filtros.area} onChange={cambiar}>
                  <option value="">Todas</option><option value="Software">Software</option><option value="Hardware">Hardware</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="f-nivel">Nivel</label>
                <select id="f-nivel" name="nivel" value={filtros.nivel} onChange={cambiar}>
                  <option value="">Todos</option><option value="Básico">Básico</option><option value="Intermedio">Intermedio</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="f-modalidad">Modalidad</label>
                <select id="f-modalidad" name="modalidad" value={filtros.modalidad} onChange={cambiar}>
                  <option value="">Todas</option><option value="Virtual">Virtual</option><option value="Presencial">Presencial</option><option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <button type="button" className="btn btn-outline" id="f-limpiar" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</button>
            </form>

            <p id="resumen-resultados" className="resumen-resultados" role="status" aria-live="polite">
              {cargando ? "" : `${resultado.length} ${resultado.length === 1 ? "curso encontrado" : "cursos encontrados"}`}
            </p>
            {error && !cursos.length ? (
              <div className="estado estado-error" role="alert">
                <p>No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.</p>
                <p className="form-ayuda">{error.message}</p>
                <button type="button" className="btn btn-outline" onClick={() => acciones.recargar().catch(() => {})}>Reintentar</button>
              </div>
            ) : cargando ? (
              <div className="grid-cursos" aria-busy="true"><Esqueleto /><Esqueleto /><Esqueleto /></div>
            ) : (
              <>
                {!resultado.length && <div className="estado"><p>No hay cursos con esos filtros. Prueba quitando alguno.</p></div>}
                <div id="lista-cursos" className="grid-cursos">
                  {resultado.map((c) => {
                    const fichas = modelo.fichasDeCurso(c.id);
                    return (
                      <article className="curso-card" data-revelar="rapido" key={c.id}>
                        <div className="curso-etiquetas"><span className="tag">{c.area}</span><span className="tag">{c.nivel}</span><span className={`tag ${c.fase === "Lanzamiento" ? "tag-lanzamiento" : ""}`}>{c.fase === "Lanzamiento" ? "Inscripciones abiertas" : "Próximamente"}</span></div>
                        <h2>{c.titulo}</h2><p>{c.descripcion}</p>
                        <p className="curso-duracion">{`${c.duracion} semanas · ${(c.modulos || []).length} módulos · ${c.modalidad} · ${c.instructor}`}</p>
                        {fichas.length > 0 && (
                          <p className="curso-fichas"><span>Fichas</span>
                            {fichas.map((f) => <span key={f.numero} className={`ficha-chip ${fichaBuscada && f.numero.startsWith(fichaBuscada) ? "is-encontrada" : ""}`} title={`${f.jornada} · ${f.estado}`}>{f.numero}</span>)}
                          </p>
                        )}
                        <div className="curso-card-pie"><button type="button" className="btn btn-outline" onClick={() => abrirCurso(c.id)}>Conocer el curso</button></div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <DetalleCurso curso={detalle} fichas={detalle ? modelo.fichasDeCurso(detalle.id) : []} fichaElegida={fichaElegida}
        alElegirFicha={setFichaElegida} alInscribirse={() => inscribirse()} alCerrar={() => setDetalle(null)} />
      <FormInscripcion key={inscripcion ? inscripcion.curso.id : "nada"} curso={inscripcion?.curso} ficha={inscripcion?.ficha} sesion={inscripcion?.sesion} alCerrar={() => setInscripcion(null)} />

      <PiePublico />
      <AsistenteFlotante />
    </>
  );
}
