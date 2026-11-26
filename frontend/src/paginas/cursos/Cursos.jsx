/* ==========================================================
   Cursos.jsx - La ruta del piloto 2027 (cursos.html)
   «Programación desde cero»: solo se muestran los 5 módulos de la ruta, en orden
   (los demás cursos que sigan en la base no aparecen en la página pública).
   La inscripción es a la ruta: se hace en el primer módulo (Lógica de programación).
   Enlaces que entiende:  ?curso=ID abre ese módulo · ?ficha=27101 filtra por ficha
                          ?inscribirme=1 empieza la inscripción a la ruta
                          ?continuar=ID vuelve del registro o del ingreso y sigue con la inscripción
   ========================================================== */
import { useEffect, useRef, useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { leerSesion } from "../../lib/sesion.js";
import { parametros } from "../../lib/rutas.js";
import { PILOTO, pasoDeRuta, semanas, soloRuta } from "../../lib/piloto.js";
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import DetalleCurso from "./DetalleCurso.jsx";
import FormInscripcion from "./FormInscripcion.jsx";

const ENLACES = [
  { href: "index.html#nosotros", texto: "Nosotros" },
  { href: "cursos.html", texto: "La ruta", actual: true },
  { href: "index.html#calendario", texto: "Calendario" },
  { href: "index.html#sumate", texto: "Súmate" },
  { href: "index.html#contacto", texto: "Contacto" },
];
const FILTROS_VACIOS = { q: "", ficha: "" };
const Esqueleto = () => <div className="curso-card esqueleto" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>;
const fichaAbierta = (modelo, curso) => modelo.fichasDeCurso(curso.id).find((f) => f.estado === "Inscripciones abiertas")?.numero || "";

export default function Cursos() {
  const { cargando, error, modelo, acciones } = useDatos();
  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_VACIOS, ficha: parametros().get("ficha") || "" }));
  const [detalle, setDetalle] = useState(null); // módulo abierto
  const [inscripcion, setInscripcion] = useState(null); // { curso, ficha, sesion }
  const yaAbrio = useRef(false);

  const ruta = soloRuta(modelo.cursos());
  const primero = ruta.find((c) => pasoDeRuta(c) === 0) || null; // la inscripción a la ruta se hace aquí
  const fichaBuscada = filtros.ficha.replace(/\D/g, "");
  const q = filtros.q.trim().toLocaleLowerCase("es");
  const resultado = ruta.filter((c) => {
    const fichas = modelo.fichasDeCurso(c.id).filter((f) => f.estado !== "Finalizada");
    return (!q || `${c.titulo} ${c.descripcion} ${fichas.map((f) => f.numero).join(" ")}`.toLocaleLowerCase("es").includes(q)) &&
      (!fichaBuscada || fichas.some((f) => f.numero.startsWith(fichaBuscada)));
  });
  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  function abrirCurso(id) {
    const curso = modelo.curso(id);
    if (curso && pasoDeRuta(curso) >= 0) setDetalle(curso);
  }
  /* Inscribirse a la ruta = pedir cupo en el primer módulo (el equipo de admisiones lo aprueba) */
  function inscribirse() {
    const curso = primero, ficha = curso ? fichaAbierta(modelo, curso) : "";
    if (!curso || curso.fase !== "Lanzamiento" || !ficha) return;
    const sesion = leerSesion();
    if (!sesion || sesion.rol !== "estudiante") { location.href = `registro.html?curso=${encodeURIComponent(curso.id)}`; return; }
    if (!sesion.numero_documento || !sesion.fecha_nacimiento || !sesion.pais || !sesion.telefono) {
      location.href = `registro.html?completar=1&curso=${encodeURIComponent(curso.id)}`; return;
    }
    setDetalle(null);
    setInscripcion({ curso, ficha, sesion });
  }
  const puedeInscribirse = Boolean(primero && primero.fase === "Lanzamiento" && fichaAbierta(modelo, primero));

  // Cuando llega la ruta: ?inscribirme=1 o ?continuar=ID sigue con la inscripción; ?curso=ID abre el módulo
  useEffect(() => {
    if (cargando || yaAbrio.current || !ruta.length) return;
    yaAbrio.current = true;
    const p = parametros(), continuar = Number(p.get("continuar")), enlace = Number(p.get("curso"));
    if (p.get("inscribirme") === "1" || (continuar > 0 && leerSesion())) inscribirse();
    else if (continuar > 0) abrirCurso(continuar);
    else if (enlace > 0) abrirCurso(enlace);
  }); // se revisa en cada pintada hasta que la ruta está lista

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li><a href="admin/login.html" className="btn btn-outline">Ingresar</a></li>} />
      <main id="contenido">
        <section className="page-intro">
          <div className="container">
            <h1 data-revelar="titulo">{`La ruta: ${PILOTO.nombre}`}</h1>
            <p data-revelar>Cinco módulos gratuitos y presenciales en Barranquilla para aprender a programar sin saber nada. En la fase piloto cada módulo dura 1 semana (normalmente dura 2).</p>
            <p className="aviso-piloto" data-revelar role="note"><strong>Por ahora, solo Colombia.</strong> Los grupos se harán en el primer y el segundo trimestre de 2027. Te avisaremos por correo la fecha y el horario de tu grupo. Al terminar recibes una constancia de participación.</p>
            <div className="ruta-acciones" data-revelar>
              <button type="button" className="btn btn-primary btn-flecha" disabled={!puedeInscribirse} onClick={inscribirse}>{puedeInscribirse ? "Inscribirme en la ruta" : "Inscripciones pronto"}</button>
            </div>
          </div>
        </section>

        <section id="lista-cursos-seccion" className="section" aria-label="Módulos de la ruta">
          <div className="container">
            <form id="filtros" className="filtros" role="search" aria-label="Buscar en la ruta" data-revelar onSubmit={(e) => e.preventDefault()}>
              <div className="campo">
                <label htmlFor="f-buscar">Buscar</label>
                <input id="f-buscar" name="q" type="search" placeholder="Lógica, Git, HTML, SQL..." value={filtros.q} onChange={cambiar} />
              </div>
              <div className="campo campo-ficha">
                <label htmlFor="f-ficha">N.º de ficha</label>
                <input id="f-ficha" name="ficha" type="search" inputMode="numeric" maxLength="6" placeholder="Ej. 27101" autoComplete="off" value={filtros.ficha} onChange={cambiar} />
              </div>
              <button type="button" className="btn btn-outline" id="f-limpiar" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar</button>
            </form>

            <p id="resumen-resultados" className="resumen-resultados" role="status" aria-live="polite">
              {cargando ? "" : `${resultado.length} ${resultado.length === 1 ? "módulo" : "módulos"} de ${PILOTO.ruta.length}`}
            </p>
            {error && !ruta.length ? (
              <div className="estado estado-error" role="alert">
                <p>No pudimos cargar la ruta. Revisa tu conexión e inténtalo de nuevo.</p>
                <p className="form-ayuda">{error.message}</p>
                <button type="button" className="btn btn-outline" onClick={() => acciones.recargar().catch(() => {})}>Reintentar</button>
              </div>
            ) : cargando ? (
              <div className="grid-cursos" aria-busy="true"><Esqueleto /><Esqueleto /><Esqueleto /></div>
            ) : (
              <>
                {!resultado.length && <div className="estado"><p>No hay módulos con esa búsqueda.</p></div>}
                <div id="lista-cursos" className="grid-cursos">
                  {resultado.map((c) => (
                    <article className="curso-card" data-revelar="rapido" key={c.id}>
                      <div className="curso-etiquetas"><span className="tag">{c.nivel}</span><span className="tag">{c.modalidad}</span></div>
                      <p className="ruta-paso-etiqueta">{`Módulo ${pasoDeRuta(c) + 1} de ${PILOTO.ruta.length}`}</p>
                      <h2>{c.titulo}</h2><p>{c.descripcion}</p>
                      <p className="curso-duracion">{`${semanas(c.duracion)} en el piloto · ${(c.modulos || []).length} clases`}</p>
                      <div className="curso-card-pie"><button type="button" className="btn btn-outline" onClick={() => abrirCurso(c.id)}>Ver el módulo</button></div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <DetalleCurso curso={detalle} puedeInscribirse={puedeInscribirse} alInscribirse={inscribirse} alCerrar={() => setDetalle(null)} />
      <FormInscripcion key={inscripcion ? inscripcion.curso.id : "nada"} curso={inscripcion?.curso} ficha={inscripcion?.ficha} sesion={inscripcion?.sesion} alCerrar={() => setInscripcion(null)} />

      <PiePublico />
      <AsistenteFlotante />
    </>
  );
}
