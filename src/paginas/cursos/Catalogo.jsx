/* Catalogo - Página de cursos (cursos.html): filtros, tarjetas, ficha del curso e inscripción.
   Enlaces que entiende:
     cursos.html?curso=ID     abre la ficha de ese curso (desde el inicio)
     cursos.html?ficha=25896  filtra por número de ficha
     cursos.html?continuar=ID vuelve después de crear la cuenta y sigue con la inscripción */
import { useCallback, useEffect, useMemo, useState } from "react";
import Encabezado from "../../componentes/Encabezado.jsx";
import Pie from "../../componentes/Pie.jsx";
import ModalCurso from "./ModalCurso.jsx";
import ModalInscripcion from "./ModalInscripcion.jsx";
import { cursos, fichasDe, buscarCurso, sesion } from "../../lib/plataforma.js";
import { useDatosListos, useRevelar } from "../../lib/ganchos.js";

const ENLACES = [
  { href: "index.html#nosotros", texto: "Nosotros" },
  { href: "cursos.html", texto: "Cursos", actual: true },
  { href: "index.html#mentores", texto: "Mentores" },
  { href: "index.html#asistente", texto: "Asistente IA" },
  { href: "index.html#contacto", texto: "Contacto" },
];
const ACCIONES = [
  { href: "admin/login.html", texto: "Ingresar" },
  { href: "#lista-cursos-seccion", texto: "Inscríbete", principal: true },
];
const FILTROS_VACIOS = { q: "", ficha: "", area: "", nivel: "", modalidad: "" };
const parametro = (nombre) => new URLSearchParams(location.search).get(nombre) || "";

function filtrar(lista, filtros) {
  const q = filtros.q.trim().toLocaleLowerCase("es");
  const ficha = filtros.ficha.replace(/\D/g, "");
  return lista.filter((c) => {
    const numeros = fichasDe(c.id).map((f) => f.numero);
    return (!q || `${c.titulo} ${c.descripcion} ${c.area} ${numeros.join(" ")}`.toLocaleLowerCase("es").includes(q))
      && (!ficha || numeros.some((n) => n.startsWith(ficha)))
      && (!filtros.area || c.area === filtros.area)
      && (!filtros.nivel || c.nivel === filtros.nivel)
      && (!filtros.modalidad || c.modalidad === filtros.modalidad);
  });
}

function Filtros({ filtros, cambiar, limpiar }) {
  const select = (nombre, etiqueta, todos, opciones) => (
    <div className="campo">
      <label htmlFor={`f-${nombre}`}>{etiqueta}</label>
      <select id={`f-${nombre}`} name={nombre} value={filtros[nombre]} onChange={cambiar}>
        <option value="">{todos}</option>
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <form className="filtros" role="search" aria-label="Filtrar cursos" onSubmit={(e) => e.preventDefault()} data-revelar="">
      <div className="campo">
        <label htmlFor="f-buscar">Buscar</label>
        <input id="f-buscar" name="q" type="search" placeholder="Python, Arduino, páginas web..." value={filtros.q} onChange={cambiar} />
      </div>
      <div className="campo campo-ficha">
        <label htmlFor="f-ficha">N.º de ficha</label>
        <input id="f-ficha" name="ficha" type="search" inputMode="numeric" maxLength={6} placeholder="Ej. 25896" autoComplete="off" value={filtros.ficha} onChange={cambiar} />
      </div>
      {select("area", "Área", "Todas", ["Software", "Hardware"])}
      {select("nivel", "Nivel", "Todos", ["Básico", "Intermedio"])}
      {select("modalidad", "Modalidad", "Todas", ["Virtual", "Presencial", "Híbrido"])}
      <button type="button" className="btn btn-outline" onClick={limpiar}>Limpiar filtros</button>
    </form>
  );
}

function TarjetaCurso({ curso, fichaBuscada, alAbrir }) {
  const fichas = fichasDe(curso.id);
  const abierto = curso.fase === "Lanzamiento";
  return (
    <article className="curso-card" data-revelar="rapido">
      <div className="curso-etiquetas">
        <span className="tag">{curso.area}</span>
        <span className="tag">{curso.nivel}</span>
        <span className={`tag ${abierto ? "tag-lanzamiento" : ""}`}>{abierto ? "Inscripciones abiertas" : "Próximamente"}</span>
      </div>
      <h2>{curso.titulo}</h2>
      <p>{curso.descripcion}</p>
      <p className="curso-duracion">{`${curso.duracion} semanas · ${(curso.modulos || []).length} módulos · ${curso.modalidad} · ${curso.instructor}`}</p>
      {fichas.length > 0 && (
        <p className="curso-fichas">
          <span>Fichas</span>
          {fichas.map((f) => (
            <span key={f.numero} className={`ficha-chip ${fichaBuscada && f.numero.startsWith(fichaBuscada) ? "is-encontrada" : ""}`} title={`${f.jornada} · ${f.estado}`}>{f.numero}</span>
          ))}
        </p>
      )}
      <div className="curso-card-pie"><button type="button" className="btn btn-outline" onClick={() => alAbrir(curso)}>Conocer el curso</button></div>
    </article>
  );
}

export default function Catalogo() {
  const listos = useDatosListos();
  const [filtros, setFiltros] = useState({ ...FILTROS_VACIOS, ficha: parametro("ficha") });
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const [inscripcion, setInscripcion] = useState(null); // { curso, ficha }
  const fichaBuscada = filtros.ficha.replace(/\D/g, "");
  const resultado = useMemo(() => (listos ? filtrar(cursos(), filtros) : []), [listos, filtros]);
  const lista = useRevelar([resultado]);
  const cabecera = useRevelar([]);

  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  const cerrarCurso = useCallback(() => setCursoAbierto(null), []);
  const cerrarInscripcion = useCallback(() => setInscripcion(null), []);

  /* Sin cuenta de estudiante → crear cuenta; con perfil incompleto → completarlo; si no, formulario */
  const inscribirse = useCallback((curso, ficha) => {
    const s = sesion();
    if (!s || s.rol !== "estudiante") { location.href = `registro.html?curso=${encodeURIComponent(curso.id)}`; return; }
    if (!s.numero_documento || !s.fecha_nacimiento || !s.pais || !s.telefono) { location.href = `registro.html?completar=1&curso=${encodeURIComponent(curso.id)}`; return; }
    setCursoAbierto(null);
    setInscripcion({ curso, ficha });
  }, []);

  // Enlaces que llegan con ?curso= o ?continuar= (este último sigue directo con la inscripción si ya hay sesión)
  useEffect(() => {
    if (!listos) return;
    const continuar = buscarCurso(parametro("continuar"));
    const enlazado = buscarCurso(parametro("curso"));
    if (continuar) {
      const abierta = fichasDe(continuar.id).find((f) => f.estado === "Inscripciones abiertas");
      if (sesion() && abierta && continuar.fase === "Lanzamiento") inscribirse(continuar, abierta.numero);
      else setCursoAbierto(continuar);
    } else if (enlazado) setCursoAbierto(enlazado);
  }, [listos, inscribirse]);

  return (
    <>
      <Encabezado enlaces={ENLACES} acciones={ACCIONES} />
      <main id="contenido">
        <section className="page-intro" ref={cabecera}>
          <div className="container">
            <h1 data-revelar="titulo">Catálogo de cursos</h1>
            <p data-revelar="">Todos son gratuitos y puedes empezar sin experiencia previa. Aprende desde cero, a tu ritmo y con acompañamiento.</p>
          </div>
        </section>
        <section id="lista-cursos-seccion" className="section" aria-label="Catálogo">
          <div className="container" ref={lista}>
            <Filtros filtros={filtros} cambiar={cambiar} limpiar={() => setFiltros(FILTROS_VACIOS)} />
            <p className="resumen-resultados" role="status" aria-live="polite">
              {listos && `${resultado.length} ${resultado.length === 1 ? "curso encontrado" : "cursos encontrados"}`}
            </p>
            {listos && resultado.length === 0 && <div className="estado"><p>No hay cursos con esos filtros. Prueba quitando alguno.</p></div>}
            <div id="lista-cursos" className="grid-cursos" aria-busy={!listos}>
              {!listos
                ? [1, 2, 3].map((n) => <div className="curso-card esqueleto" aria-hidden="true" key={n}><span /><span /><span /><span /><span /></div>)
                : resultado.map((c) => <TarjetaCurso key={c.id} curso={c} fichaBuscada={fichaBuscada} alAbrir={setCursoAbierto} />)}
            </div>
          </div>
        </section>
      </main>
      <Pie />
      <ModalCurso key={cursoAbierto?.id ?? "cerrado"} curso={cursoAbierto} fichaBuscada={fichaBuscada} alCerrar={cerrarCurso} alInscribirse={inscribirse} />
      <ModalInscripcion key={inscripcion ? `${inscripcion.curso.id}-${inscripcion.ficha}` : "cerrada"} inscripcion={inscripcion} alCerrar={cerrarInscripcion} />
    </>
  );
}
