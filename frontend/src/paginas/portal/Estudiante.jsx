/* ==========================================================
   Estudiante.jsx - Secciones del portal para estudiantes
   Inicio didáctico, mis cursos, actividades, logros y encuestas.
   ========================================================== */
import { useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import { enLinea } from "../../componentes/ChatIA.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { GLOSARIO, L, QUIZ, quizVista } from "../../lib/asistente.js";
import { guardarLocal, leerLocal, toast } from "../../lib/utils.js";
import { Barra, EncabezadoSeccion, Pill, TipoIcono, Vacio, colorNota, etiquetaModulo, fecha, iniciales, nota } from "../../componentes/app/ui.jsx";
import logoEmblema from "../../assets/img/logo-emblema.png";
import { ListaModulos, misActividades, pendientes } from "./comunes.jsx";
import { usePortal } from "./PortalContexto.jsx";

function TarjetaActividad({ a }) {
  const { modelo: D } = useDatos();
  const { abrirActividad } = usePortal();
  const urgente = a.estado === "pendiente" && D.diasRestantes(a.fecha_limite) <= 2;
  const porEntregar = a.estado === "pendiente" || a.estado === "vencida";
  return (
    <article className={`act-card ${a.estado === "revisada" ? "is-complete" : ""}`}>
      <div className="act-top"><TipoIcono tipo={a.tipo} /><div><span className="act-curso">{(a.curso?.titulo || "") + etiquetaModulo(a)}</span><h3>{a.titulo}</h3></div></div>
      <p>{a.objetivo || a.descripcion.split("\n")[0]}</p>
      <div className="act-meta">
        <Pill estado={a.estado} />
        <span className={`act-vence ${urgente ? "is-urgente" : ""}`}><Icono nombre="reloj" tam={14} />{" " + (a.estado === "revisada" || a.estado === "entregada" ? "Entregada el " + fecha(a.entrega.creado) : D.textoVence(a.fecha_limite))}</span>
        {a.entrega?.nota != null && <span className={`nota-chip ${colorNota(a.entrega.nota)}`}>{nota(a.entrega.nota)}</span>}
      </div>
      <button type="button" className={`btn ${porEntregar ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => abrirActividad(a.id)}>
        {a.estado === "revisada" ? "Ver retroalimentación" : a.estado === "entregada" ? "Ver o editar entrega" : "Abrir y entregar"}
      </button>
    </article>
  );
}

/* Reto del día: una pregunta del banco del asistente; los aciertos suman a los logros */
function RetoDelDia({ correo }) {
  const hoy = new Date();
  const reto = quizVista(QUIZ[(hoy.getDate() + hoy.getMonth()) % QUIZ.length]);
  const [elegida, setElegida] = useState(null);
  const responder = (i) => {
    setElegida(i);
    guardarLocal("tc_retos_" + correo, (leerLocal("tc_retos_" + correo, 0) || 0) + (i === reto.c ? 1 : 0));
  };
  const ok = elegida === reto.c;
  return (
    <article className="tarjeta reto" id="reto-dia" data-guia="reto">
      <h2 className="tarjeta-titulo"><Icono nombre="pregunta" tam={18} /> Reto del día</h2>
      <p className="reto-pregunta">{reto.p}</p>
      <div className="reto-opciones">
        {reto.o.map((o, i) => (
          <button type="button" key={i} disabled={elegida !== null} onClick={() => responder(i)}
            className={"reto-opcion" + (elegida !== null && i === reto.c ? " is-correcta" : "") + (elegida === i && !ok ? " is-incorrecta" : "")}>
            <span>{"ABC"[i]}</span>{o}
          </button>
        ))}
      </div>
      {elegida !== null && (
        <p className="reto-feedback" role="status">
          {ok ? "🎉 " : "💪 "}<strong>{ok ? L("¡Correcto!", "Correct!") : L("Casi.", "Almost.")}</strong> {enLinea(reto.e)}
        </p>
      )}
    </article>
  );
}

export function InicioEstudiante() {
  const { modelo: D } = useDatos();
  const { s, abrirActividad, preguntarIA } = usePortal();
  const acts = misActividades(D, s.correo), pend = pendientes(acts), cursos = D.cursosDeEstudiante(s.correo);
  const notas = acts.map((a) => a.entrega?.nota).filter((n) => n !== null && n !== undefined).map(Number);
  const prom = notas.length ? notas.reduce((x, y) => x + y, 0) / notas.length : null;
  const siguiente = pend.filter((a) => a.estado === "pendiente")[0] || pend[0];
  const hoy = new Date();
  const tipG = GLOSARIO[hoy.getDate() % GLOSARIO.length], tip = { termino: L(tipG.termino[0], tipG.termino[1]), def: L(tipG.def[0], tipG.def[1]) };
  const solicitudes = D.matriculas(s.correo).filter((m) => m.estado === "pendiente");
  const sugeridos = D.cursos().filter((c) => c.fase === "Lanzamiento" && !D.matriculas(s.correo).some((m) => Number(m.curso_id) === Number(c.id))).slice(0, 2);
  return (
    <>
      <div className="bienvenida" data-guia="bienvenida">
        <div>
          <span className="eyebrow">Estudiante</span>
          <h1>{`¡Hola, ${(s.nombre || "").split(" ")[0]}! 🌴`}</h1>
          <p>{pend.length ? <>Tienes <strong>{pend.length}</strong>{` ${pend.length === 1 ? "actividad pendiente" : "actividades pendientes"}. ¡Vamos paso a paso!`}</> : "Estás al día con tus actividades. ¡Sigue así!"}</p>
        </div>
        <img src={logoEmblema} alt="" width="150" height="112" className="bienvenida-arte" />
      </div>
      <dl className="kpis" data-guia="kpis">
        <div className="kpi"><dt><Icono nombre="libro" tam={18} /> Cursos activos</dt><dd>{cursos.length}</dd></div>
        <div className="kpi"><dt><Icono nombre="reloj" tam={18} /> Pendientes</dt><dd>{pend.length}</dd></div>
        <div className="kpi"><dt><Icono nombre="check" tam={18} /> Entregadas</dt><dd>{acts.filter((a) => a.entrega).length}</dd></div>
        <div className="kpi"><dt><Icono nombre="estrella" tam={18} /> Promedio</dt><dd>{prom == null ? "—" : prom.toFixed(1)}</dd></div>
      </dl>
      <div className="grid-2">
        <article className="tarjeta" data-guia="siguiente">
          <h2 className="tarjeta-titulo"><Icono nombre="flecha" tam={18} /> Tu siguiente paso</h2>
          {siguiente ? (
            <>
              <div className="siguiente-paso">
                <TipoIcono tipo={siguiente.tipo} />
                <div>
                  <span className="act-curso">{siguiente.curso?.titulo}</span>
                  <h3>{siguiente.titulo}</h3>
                  <p className={`act-vence ${D.diasRestantes(siguiente.fecha_limite) <= 2 ? "is-urgente" : ""}`}><Icono nombre="reloj" tam={14} />{" " + D.textoVence(siguiente.fecha_limite)}</p>
                </div>
              </div>
              <div className="fila-botones">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirActividad(siguiente.id)}>Empezar ahora</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => preguntarIA(`Ayúdame con "${siguiente.titulo}"`)}>Pedir ayuda al tutor</button>
              </div>
            </>
          ) : cursos.length ? <Vacio icono="check" titulo="¡Todo al día!" texto="No tienes actividades pendientes." />
            : <Vacio icono="libro" titulo="Aún no tienes cursos" texto={solicitudes.length ? `Tienes ${solicitudes.length} solicitud(es) en revisión. Te avisaremos al aprobarla.` : "Inscríbete a un curso para recibir actividades."}><a className="btn btn-primary btn-sm" href="cursos.html">Explorar cursos</a></Vacio>}
        </article>
        <RetoDelDia correo={s.correo} />
      </div>
      <article className="tarjeta" data-guia="ruta">
        <h2 className="tarjeta-titulo"><Icono nombre="mapa" tam={18} /> Tu ruta de aprendizaje</h2>
        <p className="seccion-texto">Cada curso es una parada. Completa sus actividades para avanzar a la siguiente.</p>
        <ol className="ruta">
          {cursos.map((c) => { const p = D.progreso(s.correo, c.id); return <li key={c.id} className={`ruta-parada ${p.porcentaje === 100 ? "is-completa" : "is-activa"}`}><span className="ruta-punto" style={{ "--pct": p.porcentaje }}><span>{`${p.porcentaje}%`}</span></span><strong>{c.titulo}</strong><small>{`${p.hechas}/${p.total} actividades`}</small></li>; })}
          {solicitudes.map((m) => <li key={"s" + m.curso_id} className="ruta-parada is-espera"><span className="ruta-punto"><Icono nombre="reloj" tam={18} /></span><strong>{D.curso(m.curso_id)?.titulo || "Curso"}</strong><small>Solicitud en revisión</small></li>)}
          {sugeridos.map((c) => <li key={"g" + c.id} className="ruta-parada is-sugerida"><span className="ruta-punto"><Icono nombre="mas" tam={18} /></span><strong>{c.titulo}</strong><small><a href="cursos.html">Siguiente sugerido</a></small></li>)}
        </ol>
      </article>
      <div className="grid-2">
        <article className="tarjeta sabias" data-guia="sabias">
          <h2 className="tarjeta-titulo"><Icono nombre="foco" tam={18} /> ¿Sabías que…?</h2>
          <h3>{tip.termino}</h3><p>{tip.def.replace(/\*\*/g, "")}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => preguntarIA(L("¿Qué es " + tip.termino.toLowerCase() + "?", "What is " + tip.termino + "?"))}>Explícamelo con un ejemplo</button>
        </article>
        <article className="tarjeta">
          <h2 className="tarjeta-titulo"><Icono nombre="usuarios" tam={18} /> Tus datos de inscripción</h2>
          <p>{(s.numero_documento ? `Documento ${s.tipo_documento || ""} terminado en ${String(s.numero_documento).slice(-4)}.` : "Completa tus datos de identidad para solicitar cupos.") + " " + [s.correo, s.telefono].filter(Boolean).join(" · ")}</p>
          <a className="btn btn-outline btn-sm" href="registro.html?completar=1">Revisar mis datos</a>
        </article>
      </div>
    </>
  );
}

export function CursosEstudiante() {
  const { modelo: D } = useDatos();
  const { s, navegar } = usePortal();
  const cursos = D.cursosDeEstudiante(s.correo), solicitudes = D.matriculas(s.correo).filter((m) => m.estado !== "aprobada");
  return (
    <>
      <EncabezadoSeccion eyebrow="Aprende haciendo" titulo="Mis cursos" texto="Tu avance en cada curso, módulo por módulo. Abre un módulo para ver sus temas y actividades.">
        <a className="btn btn-outline" href="cursos.html">Explorar catálogo</a>
      </EncabezadoSeccion>
      {cursos.length ? (
        <div className="lista-cursos-portal">
          {cursos.map((c) => {
            const p = D.progreso(s.correo, c.id), f = D.ficha(D.fichaDe(s.correo, c.id));
            return (
              <article className="tarjeta curso-portal curso-portal-ancho" key={c.id}>
                <div className="curso-portal-top"><span className="tag">{c.area}</span><span className="tag">{c.modalidad}</span>{f && <span className="ficha-chip" title={f.jornada}>{`Ficha ${f.numero}`}</span>}</div>
                <h2>{c.titulo}</h2>
                <p className="docente-linea"><span className="avatar avatar-sm">{iniciales(c.instructor)}</span>{" " + c.instructor + (f ? ` · Jornada ${f.jornada.toLowerCase()}` : "")}</p>
                <Barra pct={p.porcentaje} etiqueta="Avance del curso" />
                <div className="curso-portal-datos"><span>{`${p.hechas}/${p.total} actividades · ${D.modulos(c).length} módulos`}</span><span>Promedio: <strong className={colorNota(p.promedio)}>{p.promedio == null ? "—" : p.promedio.toFixed(1)}</strong></span></div>
                <ListaModulos correo={s.correo} cursoId={c.id} />
                <p className="proyecto-linea"><Icono nombre="cohete" tam={16} /> <span><strong>Proyecto final:</strong> {c.proyecto || "Por definir"}</span></p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navegar("actividades", { curso: c.id })}>Ver actividades</button>
              </article>
            );
          })}
        </div>
      ) : <Vacio icono="libro" titulo="Aún no tienes cursos aprobados" texto="Cuando admisiones apruebe tu solicitud, el curso y sus actividades aparecerán aquí."><a className="btn btn-primary btn-sm" href="cursos.html">Explorar cursos</a></Vacio>}
      {solicitudes.length > 0 && (
        <>
          <h2 className="subtitulo">Solicitudes</h2>
          <ul className="lista-filas tarjeta">
            {solicitudes.map((m) => {
              const rechazada = m.estado === "rechazada", ficha = D.fichaDeInscripcion(m);
              return (
                <li key={m.curso_id}>
                  <Icono nombre={rechazada ? "salir" : "reloj"} tam={18} />
                  <span><strong>{D.curso(m.curso_id)?.titulo || "Curso"}</strong><small>{(ficha ? `Ficha ${ficha} · ` : "") + (rechazada ? "No aprobada · escríbenos si tienes dudas" : "En revisión por admisiones")}</small></span>
                  <Pill estado={rechazada ? "vencida" : "pendiente"} texto={rechazada ? "Rechazada" : "En revisión"} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

export function ActividadesEstudiante() {
  const { modelo: D } = useDatos();
  const { s, filtros, setFiltros } = usePortal();
  const [filtro, setFiltro] = useState("todas");
  const cursos = D.cursosDeEstudiante(s.correo);
  const lista = misActividades(D, s.correo).filter((a) => (filtro === "todas" || a.estado === filtro || (filtro === "pendiente" && a.estado === "vencida")) && (!filtros.curso || String(a.curso_id) === filtros.curso));
  return (
    <>
      <EncabezadoSeccion eyebrow="Lo que dejan tus docentes" titulo="Actividades" texto="Ábrelas, entrégalas y recibe retroalimentación. Puedes editar tu entrega mientras no esté calificada." />
      <div className="filtros-barra">
        <div className="chips-filtro" role="tablist" aria-label="Filtrar por estado">
          {[["todas", "Todas"], ["pendiente", "Pendientes"], ["entregada", "Entregadas"], ["revisada", "Calificadas"]].map(([v, t]) => (
            <button type="button" role="tab" key={v} className={`chip-filtro ${v === filtro ? "activo" : ""}`} aria-selected={v === filtro} onClick={() => setFiltro(v)}>{t}</button>
          ))}
        </div>
        <label className="select-mini"><span className="sr-only">Curso</span>
          <select value={filtros.curso} onChange={(e) => setFiltros({ curso: e.target.value })}>
            <option value="">Todos los cursos</option>
            {cursos.map((c) => <option key={c.id} value={String(c.id)}>{c.titulo}</option>)}
          </select>
        </label>
      </div>
      <div className="grid-tarjetas" id="lista-actividades">
        {lista.length ? lista.map((a) => <TarjetaActividad a={a} key={a.id} />)
          : <Vacio icono="portapapeles" titulo="Nada por aquí" texto={cursos.length ? "No hay actividades con este filtro." : "Cuando tengas un curso aprobado, tus docentes te dejarán actividades aquí."} />}
      </div>
    </>
  );
}

export function Logros() {
  const { modelo: D } = useDatos();
  const { s } = usePortal();
  const acts = misActividades(D, s.correo), entregadas = acts.filter((a) => a.entrega);
  const notas = acts.map((a) => a.entrega?.nota).filter((n) => n !== null && n !== undefined).map(Number);
  const aTiempo = entregadas.filter((a) => String(a.entrega.creado).slice(0, 10) <= (a.fecha_limite || "9999")).length;
  const retos = leerLocal("tc_retos_" + s.correo, 0) || 0;
  const LOGROS = [
    ["cohete", "Primer despegue", "Entrega tu primera actividad.", entregadas.length >= 1],
    ["estrella", "Constancia caribe", "Entrega 3 actividades.", entregadas.length >= 3],
    ["reloj", "Puntual", "Entrega 2 actividades antes de la fecha límite.", aTiempo >= 2],
    ["trofeo", "Nota de oro", "Obtén una nota de 4.5 o más.", notas.some((n) => n >= 4.5)],
    ["libro", "Explorador", "Ten 2 o más cursos activos.", D.cursosDeEstudiante(s.correo).length >= 2],
    ["pregunta", "Mente curiosa", "Acierta un reto del día.", retos >= 1],
    ["usuarios", "Perfil completo", "Completa tus datos de inscripción.", !!s.numero_documento],
    ["chat", "Conversador", "Haz 3 preguntas al tutor IA.", (leerLocal("tc_chat_" + s.correo, []) || []).filter((m) => m.de === "yo").length >= 3],
  ];
  const ganados = LOGROS.filter((l) => l[3]).length;
  return (
    <>
      <EncabezadoSeccion eyebrow="Celebra tu avance" titulo="Logros" texto="Cada logro es una muestra de constancia. ¡Colecciónalos todos!" />
      <article className="tarjeta logros-resumen"><div><strong>{ganados}</strong>{` de ${LOGROS.length} logros`}</div><Barra pct={Math.round((ganados / LOGROS.length) * 100)} etiqueta="Logros obtenidos" /></article>
      <div className="grid-logros">
        {LOGROS.map(([icono, t, d, ok]) => (
          <article className={`logro ${ok ? "is-ganado" : ""}`} key={t}>
            <span className="logro-icono"><Icono nombre={icono} tam={26} /></span><h3>{t}</h3><p>{d}</p>
            <span className={`pill ${ok ? "pill-ok" : ""}`}>{ok ? "¡Obtenido!" : "Por lograr"}</span>
          </article>
        ))}
      </div>
    </>
  );
}

/* Encuestas: una respuesta por encuesta. El equipo ve los resultados agrupados, sin nombres. */
function FormEncuesta({ encuesta, alCancelar, alEnviar }) {
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar(ev) {
    ev.preventDefault();
    const form = ev.currentTarget, datos = new FormData(form);
    const falta = encuesta.preguntas.find((p) => p.tipo !== "texto" && !datos.get(`p-${p.id}`));
    if (falta) { setAviso("Responde las preguntas que no son opcionales para enviar."); form.querySelector(`[name="p-${falta.id}"]`)?.focus(); return; }
    const respuestas = Object.fromEntries(encuesta.preguntas.map((p) => [p.id, p.tipo === "escala" ? Number(datos.get(`p-${p.id}`)) : String(datos.get(`p-${p.id}`) || "").trim()]));
    setEnviando(true);
    try { await alEnviar(respuestas); } catch (error) { setAviso(error.message || "No se pudo enviar. Inténtalo de nuevo."); setEnviando(false); }
  }
  return (
    <form className="encuesta-form" noValidate onSubmit={enviar}>
      {encuesta.preguntas.map((p, i) => {
        const nombre = `p-${p.id}`;
        // El número va aparte para que el traductor reconozca la pregunta completa
        const titulo = <><span className="pregunta-num">{`${i + 1}.`}</span> {p.texto}</>;
        if (p.tipo === "escala") return (
          <fieldset className="pregunta" key={p.id}><legend>{titulo}</legend>
            <div className="escala">{[1, 2, 3, 4, 5].map((n) => <label key={n}><input type="radio" name={nombre} value={n} autoFocus={i === 0 && n === 1} /><span>{n}</span></label>)}</div>
            <div className="escala-extremos"><small>Muy poco</small><small>Excelente</small></div>
          </fieldset>
        );
        if (p.tipo === "opciones") return (
          <fieldset className="pregunta" key={p.id}><legend>{titulo}</legend>
            <div className="opciones">{p.opciones.map((o, j) => <label key={o}><input type="radio" name={nombre} value={o} autoFocus={i === 0 && j === 0} /><span>{o}</span></label>)}</div>
          </fieldset>
        );
        return <div className="campo pregunta" key={p.id}><label htmlFor={nombre}>{titulo} <small>(opcional)</small></label><textarea id={nombre} name={nombre} rows="2" maxLength="500"></textarea></div>;
      })}
      {aviso && <p className="form-estado estado-error" role="alert">{aviso}</p>}
      <div className="fila-botones">
        <button type="submit" className="btn btn-primary btn-sm" disabled={enviando}>Enviar respuestas</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={alCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
export function Encuestas() {
  const { modelo: D, acciones } = useDatos();
  const [abierta, setAbierta] = useState("");
  return (
    <>
      <EncabezadoSeccion eyebrow="Tu opinión cuenta" titulo="Encuestas" texto="Responder toma un minuto. El equipo ve los resultados agrupados, sin tu nombre." />
      <div className="grid-tarjetas encuestas-lista">
        {D.encuestas().map((e) => {
          const hecha = D.encuestaRespondida(e.id), abiertaAqui = !hecha && abierta === e.id;
          return (
            <article key={e.id} className={`tarjeta encuesta ${hecha ? "is-hecha" : ""} ${abiertaAqui ? "is-abierta" : ""}`}>
              <div className="encuesta-cabecera"><span className="tag">{e.dept}</span>{hecha ? <span className="pill pill-ok">Respondida</span> : <span className="pill pill-pendiente">Pendiente</span>}</div>
              <h3>{e.titulo}</h3><p className="form-ayuda">{`${e.preguntas.length} preguntas · 1 minuto`}</p>
              {hecha ? <p className="encuesta-gracias"><Icono nombre="check" tam={16} /> ¡Gracias por responder!</p>
                : abiertaAqui ? <FormEncuesta encuesta={e} alCancelar={() => setAbierta("")} alEnviar={async (r) => { await acciones.responderEncuesta(e.id, r); toast("¡Gracias! Tu respuesta quedó guardada."); setAbierta(""); }} />
                : <button type="button" className="btn btn-primary btn-sm" onClick={() => setAbierta(e.id)}>Responder</button>}
            </article>
          );
        })}
      </div>
    </>
  );
}
