/* ==========================================================
   Portal.jsx - Espacio de estudiantes y docentes (portal.html)
   Estudiante: inicio didáctico, mis cursos, actividades (entregar),
               logros, encuestas y tutor IA.
   Docente:    inicio, mis cursos, actividades (crear/editar),
               entregas (calificar), estudiantes y copiloto IA.
   Las secciones se cambian sin recargar (la dirección guarda #seccion)
   y los datos vienen de la API a través de useDatos().
   ========================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { leerSesion } from "../../lib/sesion.js";
import { ir } from "../../lib/rutas.js";
import { toast } from "../../lib/utils.js";
import Icono from "../../componentes/Icono.jsx";
import ChatIA from "../../componentes/ChatIA.jsx";
import AsistenteFlotante, { abrirAsistente } from "../../componentes/AsistenteFlotante.jsx";
import AppHeader from "../../componentes/app/AppHeader.jsx";
import Guia, { iniciarGuia } from "../../componentes/app/Guia.jsx";
import Intro from "../../componentes/app/Intro.jsx";
import { Confeti, EncabezadoSeccion } from "../../componentes/app/ui.jsx";
import { PortalContexto } from "./PortalContexto.jsx";
import { misActividades, pendientes, porRevisar } from "./comunes.jsx";
import { ActividadesEstudiante, CursosEstudiante, Encuestas, InicioEstudiante, Logros } from "./Estudiante.jsx";
import { ActividadesDocente, CursosDocente, Entregas, InicioDocente, Seguimiento } from "./Docente.jsx";
import { ModalActividad, ModalCalificar, ModalFormActividad, ModalSeguimiento } from "./Modales.jsx";

const sesion = leerSesion();
// Sin sesión se vuelve al ingreso; el equipo administrativo trabaja en el panel
if (!sesion) ir("admin/login.html");
else if (sesion.rol === "administrativo") location.replace("admin/panel.html");

function Asistente({ rol }) {
  const docente = rol === "docente";
  return (
    <>
      <EncabezadoSeccion eyebrow={docente ? "Tu copiloto" : "Tu tutor"} titulo={docente ? "Copiloto IA" : "Tutor IA"}
        texto={docente ? "Pídele ideas de actividades, rúbricas o el estado de tus grupos." : "Pregúntale por tus pendientes, pídele un plan de estudio o que te explique un concepto."} />
      <ChatIA modo="completo" className="chat-completo" />
    </>
  );
}

const SECCIONES = {
  estudiante: [["inicio", "casa", "Inicio", InicioEstudiante], ["cursos", "libro", "Mis cursos", CursosEstudiante], ["actividades", "portapapeles", "Actividades", ActividadesEstudiante], ["logros", "trofeo", "Logros", Logros], ["encuestas", "megafono", "Encuestas", Encuestas], ["asistente", "chat", "Tutor IA", Asistente]],
  docente: [["inicio", "casa", "Inicio", InicioDocente], ["cursos", "libro", "Mis cursos", CursosDocente], ["actividades", "lapiz", "Actividades", ActividadesDocente], ["entregas", "check", "Entregas", Entregas], ["estudiantes", "usuarios", "Seguimiento", Seguimiento], ["asistente", "chat", "Copiloto IA", Asistente]],
};

/* Guía de bienvenida (primera vez por rol) */
const GUIA = {
  estudiante: [
    { sel: ".app-nav", titulo: "Tu menú", texto: "Desde aquí vas a tus cursos, actividades, logros y al tutor IA. El número rojo te avisa cuántas actividades tienes pendientes." },
    { sel: "[data-guia=kpis]", titulo: "Tu resumen", texto: "Cursos activos, pendientes, entregas y tu promedio, siempre a la vista." },
    { sel: "[data-guia=siguiente]", titulo: "Tu siguiente paso", texto: "La actividad que vence primero. Ábrela, escribe tu respuesta y entrégala." },
    { sel: "[data-guia=ruta]", titulo: "Tu ruta", texto: "Cada curso es una parada. El círculo se llena a medida que entregas actividades." },
    { sel: ".tc-chat-launch", titulo: "Tu tutor IA", texto: "¿Dudas? Pregúntale por tus pendientes, pídele un plan de estudio o que te explique un concepto." },
  ],
  docente: [
    { sel: ".app-nav", titulo: "Tu menú docente", texto: "Cursos con sus fichas y módulos, actividades, entregas por revisar y el seguimiento de tus estudiantes módulo por módulo." },
    { sel: "[data-guia=revisar]", titulo: "Por revisar", texto: "Las entregas que esperan tu nota y comentario. Califica de 1.0 a 5.0." },
    { sel: "[data-guia=guia]", titulo: "Crea una actividad", texto: "Elige el curso, la ficha y el módulo, usa una plantilla didáctica y publícala: le llega a los estudiantes aprobados de esa ficha (o de todas)." },
    { sel: ".tc-chat-launch", titulo: "Tu copiloto IA", texto: "Pídele ideas de actividades para tu curso, una rúbrica o quién necesita apoyo." },
  ],
};

export default function Portal() {
  if (!sesion || sesion.rol === "administrativo") return null;
  return <PortalApp s={sesion} />;
}

function PortalApp({ s }) {
  const { cargando, error, modelo: D, acciones } = useDatos();
  const rol = s.rol === "docente" ? "docente" : "estudiante";
  const secciones = SECCIONES[rol];
  const desdeHash = () => { const h = location.hash.slice(1); return secciones.some((x) => x[0] === h) ? h : "inicio"; };
  const [seccion, setSeccion] = useState(desdeHash);
  const [visita, setVisita] = useState(0); // cambia en cada navegación: la sección entra con animación
  const [menu, setMenu] = useState(false);
  const [filtros, setFiltrosEstado] = useState({ curso: "", ficha: "", actividad: "", estadoEntrega: "entregada" });
  const [actividadAbierta, setActividadAbierta] = useState(null);
  const [calificando, setCalificando] = useState(null);
  const [formActividad, setFormActividad] = useState(null);
  const [seguimiento, setSeguimiento] = useState(null);
  const main = useRef(null);
  const setFiltros = useCallback((cambios) => setFiltrosEstado((f) => ({ ...f, ...cambios })), []);

  const navegar = useCallback((id, opciones = {}) => {
    if (!secciones.some((x) => x[0] === id)) return false;
    const cambios = {};
    if (opciones.curso !== undefined) cambios.curso = String(opciones.curso);
    if (opciones.ficha !== undefined) cambios.ficha = String(opciones.ficha);
    setFiltros(cambios);
    setSeccion(id); setVisita((v) => v + 1); setMenu(false);
    history.replaceState(null, "", "#" + id);
    if (!opciones.sinFoco) main.current?.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }, [secciones, setFiltros]);

  useEffect(() => {
    const alCambiar = () => { const h = location.hash.slice(1); if (h !== seccion && secciones.some((x) => x[0] === h)) navegar(h); };
    addEventListener("hashchange", alCambiar);
    return () => removeEventListener("hashchange", alCambiar);
  }, [seccion, secciones, navegar]);
  // La guía de bienvenida aparece la primera vez, cuando ya cargaron los datos
  useEffect(() => { if (!cargando) setTimeout(() => iniciarGuia(GUIA[rol], "tc_guia_" + rol), 900); }, [cargando, rol]);

  const contexto = useMemo(() => ({
    s, rol, navegar, filtros, setFiltros,
    abrirActividad: setActividadAbierta,
    abrirCalificar: (id) => { setSeguimiento(null); setCalificando(id); },
    abrirSeguimiento: (correo, cursoId, modulo) => setSeguimiento({ correo, cursoId, modulo }),
    abrirFormActividad: ({ cursoId, actividad, modulo, plan } = {}) => {
      if (!D.cursosDeDocente(s.nombre).length) { toast("No tienes cursos asignados.", "error"); return; }
      setFormActividad({ cursoId, actividad, modulo, plan, fichaPreferida: filtros.ficha, n: Date.now() });
    },
    verEntregas: (actividadId) => { setFiltros({ actividad: String(actividadId), estadoEntrega: "" }); navegar("entregas"); },
    preguntarIA: (texto) => abrirAsistente(texto),
  }), [s, rol, navegar, filtros, setFiltros, D]);

  const insignia = (id) => {
    if (rol === "estudiante" && id === "actividades") return pendientes(misActividades(D, s.correo)).length;
    if (rol === "estudiante" && id === "encuestas") return D.encuestas().filter((e) => !D.encuestaRespondida(e.id)).length;
    if (rol === "docente" && id === "entregas") return porRevisar(D, s.nombre).length;
    return 0;
  };
  const [, titulo, , Seccion] = secciones.find((x) => x[0] === seccion);

  return (
    <PortalContexto.Provider value={contexto}>
      <Intro />
      <a className="skip-link" href="#app-main">Saltar al contenido</a>
      <AppHeader nombre={s.nombre || "Mi espacio"} subtitulo={rol === "docente" ? "Docente · " + (s.especialidad || "") : "Estudiante"}
        menuAbierto={menu} alMenu={() => setMenu(!menu)} idNav="app-nav" tituloGuia="Ver la guía de esta página"
        alGuia={() => { if (seccion !== "inicio") navegar("inicio"); setTimeout(() => iniciarGuia(GUIA[rol], null, true), 250); }} />
      <div className="app-layout">
        <nav id="app-nav" className={"app-nav" + (menu ? " is-abierto" : "")} aria-label="Secciones de mi espacio">
          <div className="app-nav-rol"><span className="eyebrow">{rol === "docente" ? "Espacio docente" : "Espacio estudiante"}</span></div>
          {secciones.map(([id, icono, texto]) => {
            const n = cargando ? 0 : insignia(id);
            return (
              <button type="button" key={id} className={`app-link ${id === seccion ? "activo" : ""}`} aria-current={id === seccion ? "page" : undefined} onClick={() => navegar(id)}>
                <Icono nombre={icono} tam={19} /><span>{texto}</span>{n ? <span className="badge">{n}</span> : null}
              </button>
            );
          })}
          <div className="app-nav-tip"><Icono nombre="foco" tam={18} /><p>{rol === "docente" ? "Tip: las actividades con objetivo claro reciben mejores entregas." : "Tip: entregar a tiempo suma a tus logros."}</p></div>
        </nav>
        <main id="app-main" className="app-main" tabIndex="-1" ref={main}>
          {cargando ? <div className="vacio"><span className="spinner" aria-hidden="true"></span><p>Cargando tu espacio…</p></div>
            : error ? (
              <div className="vacio"><Icono nombre="escudo" tam={30} /><h3>No pudimos cargar tu espacio</h3><p>{error.message}</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => acciones.recargar().catch(() => {})}>Reintentar</button></div>
            ) : (
              <section className={"app-seccion" + (visita ? " cambia" : "")} key={seccion + visita} id={"sec-" + seccion} aria-label={titulo}>
                <Seccion rol={rol} />
              </section>
            )}
        </main>
      </div>

      <ModalActividad key={"a" + actividadAbierta} id={actividadAbierta} alCerrar={() => setActividadAbierta(null)} />
      <ModalCalificar key={"c" + calificando} id={calificando} alCerrar={() => setCalificando(null)} />
      <ModalFormActividad key={"f" + (formActividad?.n || 0)} pedido={formActividad}
        alCerrar={(guardo) => { setFormActividad(null); if (guardo && seccion !== "cursos") navegar("actividades", { sinFoco: true }); }} />
      <ModalSeguimiento pedido={seguimiento} alCerrar={() => setSeguimiento(null)} />

      <Guia />
      <Confeti />
      <AsistenteFlotante navegar={(id) => navegar(id)} />
    </PortalContexto.Provider>
  );
}
