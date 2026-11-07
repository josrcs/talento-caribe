/* ==========================================================
   Panel.jsx - Panel administrativo (admin/panel.html)
   Cada cargo ve solo las secciones de su área (perfiles.js). El servidor
   vuelve a revisar los permisos en cada petición: ocultar una sección es
   comodidad, no seguridad.
   ========================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { leerSesion } from "../../lib/sesion.js";
import { ir } from "../../lib/rutas.js";
import Icono from "../../componentes/Icono.jsx";
import ChatIA from "../../componentes/ChatIA.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import AppHeader from "../../componentes/app/AppHeader.jsx";
import Guia, { iniciarGuia } from "../../componentes/app/Guia.jsx";
import Intro from "../../componentes/app/Intro.jsx";
import { PanelContexto, usePanel } from "./PanelContexto.jsx";
import { construirPerfil } from "./perfiles.js";
import Resumen from "./Resumen.jsx";
import Area from "./Area.jsx";
import Academico from "./Academico.jsx";
import Cursos from "./Cursos.jsx";
import { Inscripciones, Mensajes } from "./Admisiones.jsx";
import Encuestas from "./Encuestas.jsx";
import ConfigIA from "./ConfigIA.jsx";
import Seguridad, { contarSospechosas } from "./Seguridad.jsx";
import Cuentas from "./Cuentas.jsx";

const sesion = leerSesion();
// Solo el equipo administrativo entra al panel
if (!sesion || sesion.rol !== "administrativo") ir("admin/login.html");

function Asistente() {
  const { perfil } = usePanel();
  return (
    <>
      <div className="seccion-cabecera"><div><span className="eyebrow">TU ASISTENTE DE GESTIÓN</span><h1 id="t-asistente">Asistente IA</h1><p className="seccion-texto">Pregúntale por indicadores, inscripciones pendientes, demanda de cursos o las funciones de tu cargo.</p></div></div>
      <ChatIA modo="completo" className="chat-completo" panel={perfil} />
    </>
  );
}

/* Orden del menú: [sección, ícono, texto, componente] */
const SECCIONES = [
  ["resumen", "casa", "Inicio", Resumen], ["area", "maletin", "Mi departamento", Area], ["academico", "birrete", "Actividad académica", Academico],
  ["cursos", "libro", "Cursos", Cursos], ["inscripciones", "portapapeles", "Inscripciones", Inscripciones], ["mensajes", "sobre", "Mensajes", Mensajes],
  ["encuestas", "chat", "Encuestas", Encuestas], ["asistente", "destello", "Asistente IA", Asistente], ["ia", "engranaje", "Configurar IA", ConfigIA],
  ["seguridad", "escudo", "Seguridad", Seguridad], ["cuentas", "usuarios", "Cuentas", Cuentas],
];
const GUIA = [
  { sel: "#panel-nav", titulo: "Tu menú por cargo", texto: "Solo ves las secciones que corresponden a tu cargo. El número rojo indica pendientes." },
  { sel: "[data-guia=kpis]", titulo: "Indicadores", texto: "Cifras agregadas de la plataforma: cursos, estudiantes, solicitudes y actividad docente." },
  { sel: "[data-guia=accesos]", titulo: "Accesos rápidos", texto: "Las tareas principales de tu cargo, a un clic." },
  { sel: "[data-guia=grafica]", titulo: "Demanda de cursos", texto: "Qué cursos piden más. Puedes verlo también como tabla." },
  { sel: ".tc-chat-launch", titulo: "Asistente de gestión", texto: "Pregúntale “Resumen de la plataforma” o “¿Qué hace mi cargo?”." },
];

export default function Panel() {
  if (!sesion || sesion.rol !== "administrativo") return null;
  return <PanelApp s={sesion} />;
}

function PanelApp({ s }) {
  const { cargando, error, modelo: D, acciones } = useDatos();
  const perfil = useMemo(() => construirPerfil(s.puesto), [s.puesto]);
  const desdeHash = () => { const h = location.hash.slice(1); return perfil.permitidas.has(h) ? h : "resumen"; };
  const [seccion, setSeccion] = useState(desdeHash);
  const [visita, setVisita] = useState(0);
  const [menu, setMenu] = useState(false);
  const [sospechosas, setSospechosas] = useState(0);
  const main = useRef(null);

  const abrirSeccion = useCallback((nombre) => {
    if (!perfil.permitidas.has(nombre)) return false;
    setSeccion(nombre); setVisita((v) => v + 1); setMenu(false);
    history.replaceState(null, "", "#" + nombre);
    scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }, [perfil]);

  // Los enlaces con #seccion (por ejemplo desde el asistente) también abren la sección
  useEffect(() => {
    const alCambiar = () => { const h = location.hash.slice(1); if (h !== seccion) abrirSeccion(h); };
    addEventListener("hashchange", alCambiar);
    return () => removeEventListener("hashchange", alCambiar);
  }, [seccion, abrirSeccion]);
  // Para mostrar en el menú si hay conexiones sospechosas
  useEffect(() => { if (perfil.permitidas.has("seguridad")) contarSospechosas().then(setSospechosas); }, [perfil]);
  useEffect(() => { if (!cargando) setTimeout(() => iniciarGuia(GUIA, "tc_guia_admin"), 900); }, [cargando]);

  // Catálogo visible para el cargo (las direcciones académica y de tecnología ven solo su área)
  const cursosVisibles = D.cursos().filter((c) => !perfil.courseArea || c.area === perfil.courseArea);
  const contexto = useMemo(() => ({
    s, perfil, abrirSeccion, cursosVisibles,
    cursoTitulo: (id) => D.curso(id)?.titulo || "Curso",
    cursoEnArea: (id) => !perfil.courseArea || D.curso(id)?.area === perfil.courseArea,
  }), [s, perfil, abrirSeccion, cursosVisibles, D]);

  const insignia = (id) => {
    if (cargando) return 0;
    if (id === "inscripciones") return D.inscripciones().filter((i) => i.estado === "pendiente").length;
    if (id === "mensajes") return D.mensajes().filter((m) => !m.leido).length;
    if (id === "seguridad") return sospechosas;
    return 0;
  };
  const [, , titulo, Seccion] = SECCIONES.find((x) => x[0] === seccion);

  return (
    <PanelContexto.Provider value={contexto}>
      <Intro />
      <AppHeader nombre={s.nombre || "Administrador"} subtitulo={s.puesto || "Administrativo"} menuAbierto={menu} alMenu={() => setMenu(!menu)}
        idNav="panel-nav" etiquetaMenu="Abrir menú del panel" tituloGuia="Ver la guía del panel"
        alGuia={() => { abrirSeccion("resumen"); setTimeout(() => iniciarGuia(GUIA, null, true), 300); }} />
      <div className="panel-layout app-layout">
        <nav id="panel-nav" className={"panel-nav app-nav" + (menu ? " is-abierto" : "")} aria-label="Secciones del panel">
          <div className="app-nav-rol"><span className="eyebrow">{perfil.area}</span></div>
          {SECCIONES.filter(([id]) => perfil.permitidas.has(id)).map(([id, icono, texto]) => {
            const n = insignia(id);
            return (
              <button type="button" key={id} className={"panel-link app-link" + (id === seccion ? " activo" : "")} aria-current={id === seccion ? "page" : undefined} onClick={() => abrirSeccion(id)}>
                <span data-icono><Icono nombre={icono} tam={18} /></span><span className="lbl">{id === "area" ? perfil.area : texto}</span>{n ? <span className="badge">{n}</span> : null}
              </button>
            );
          })}
          <div className="app-nav-tip"><span data-icono><Icono nombre="escudo" tam={18} /></span><p>Cada cargo ve solo las secciones de su área. Los datos personales quedan en admisiones.</p></div>
        </nav>
        <main className="panel-main app-main" id="contenido" tabIndex="-1" ref={main}>
          {cargando ? <div className="estado" role="status"><span className="spinner" aria-hidden="true"></span> Cargando datos...</div>
            : error ? (
              <div className="estado estado-error" role="alert">
                <p>{error.message}</p>
                <button type="button" className="btn btn-outline" onClick={() => acciones.recargar().catch(() => {})}>Reintentar</button>
              </div>
            ) : (
              <section className={"panel-seccion app-seccion" + (visita ? " cambia" : "")} key={seccion + visita} id={"sec-" + seccion} aria-label={titulo}>
                <Seccion alSospechosas={setSospechosas} />
              </section>
            )}
        </main>
      </div>
      <Guia />
      <AsistenteFlotante navegar={abrirSeccion} panel={perfil} />
    </PanelContexto.Provider>
  );
}
