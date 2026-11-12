/* Resumen.jsx - Inicio del panel: saludo, indicadores, accesos rápidos y demanda de cursos */
import Icono from "../../componentes/Icono.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { iniciales } from "../../componentes/app/ui.jsx";
import logoEmblema from "../../assets/img/logo-emblema.png";
import { Barras, PillEstado, fechaDia } from "./comunes.jsx";
import { usePanel } from "./PanelContexto.jsx";

export const ICONO_SECCION = { cuentas: "usuarios", resumen: "casa", area: "maletin", academico: "birrete", cursos: "libro", inscripciones: "portapapeles", mensajes: "sobre", encuestas: "chat", ia: "engranaje", asistente: "destello", seguridad: "escudo" };

export function TarjetaTarea({ tarea }) {
  const { abrirSeccion } = usePanel();
  const [titulo, texto, seccion] = tarea;
  return (
    <article className="department-card acceso-card-mini">
      <span className="acceso-icono"><Icono nombre={ICONO_SECCION[seccion] || "maletin"} tam={22} /></span>
      <h2>{titulo}</h2><p>{texto}</p>
      <button className="btn btn-outline btn-sm" type="button" onClick={() => abrirSeccion(seccion)}>{`Abrir `}<Icono nombre="flecha" tam={14} /></button>
    </article>
  );
}

export default function Resumen() {
  const { modelo: D } = useDatos();
  const { s, perfil, cursoTitulo } = usePanel();
  const insAll = D.inscripciones(), mensajes = D.mensajes(), cursos = D.cursos();
  const sinLeer = mensajes.filter((m) => !m.leido).length, pendientes = insAll.filter((i) => i.estado === "pendiente").length;
  const hora = new Date().getHours();
  const conteo = cursos.map((c) => ({ c, n: insAll.filter((i) => Number(i.curso_id) === Number(c.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const estados = [["aprobada", "Aprobadas", "check"], ["pendiente", "Pendientes", "reloj"], ["rechazada", "Rechazadas", "salir"]].map(([k, t, i]) => ({ k, t, i, n: insAll.filter((x) => x.estado === k).length }));
  const total = Math.max(1, insAll.length);
  const verNombres = perfil.permitidas.has("inscripciones");
  return (
    <>
      <div className="bienvenida" data-guia="bienvenida">
        <div>
          <span className="eyebrow">{(s.puesto || "Administrativo") + " · " + perfil.area}</span>
          <h1 id="t-resumen">{`${hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"}, ${(s.nombre || "").split(" ")[0]} 👋`}</h1>
          <p>{perfil.intro}</p>
        </div>
        <img src={logoEmblema} alt="" width="150" height="112" className="bienvenida-arte" />
      </div>
      <dl className="kpis" data-guia="kpis">
        <div className="kpi"><dt><Icono nombre="libro" tam={18} /> Cursos en catálogo</dt><dd>{cursos.length}</dd><small>{`${cursos.filter((c) => c.fase === "Lanzamiento").length} con inscripciones abiertas`}</small></div>
        <div className="kpi"><dt><Icono nombre="usuarios" tam={18} /> Estudiantes</dt><dd>{new Set(insAll.filter((i) => i.estado === "aprobada").map((i) => i.correo)).size}</dd><small>{`${new Set(insAll.map((i) => i.correo)).size} personas han solicitado cupo`}</small></div>
        <div className="kpi"><dt><Icono nombre="reloj" tam={18} /> Solicitudes pendientes</dt><dd>{pendientes}</dd><small>por revisar en admisiones</small></div>
        <div className="kpi"><dt><Icono nombre="portapapeles" tam={18} /> Actividades docentes</dt><dd>{D.actividades().length}</dd><small>{`${D.entregas().length} entregas recibidas`}</small></div>
        <div className="kpi"><dt><Icono nombre="sobre" tam={18} /> Mensajes sin leer</dt><dd>{sinLeer}</dd><small>bandeja de contacto</small></div>
      </dl>
      <h2 className="subtitulo">Tus accesos rápidos</h2>
      <div className="grid-accesos" data-guia="accesos">
        {perfil.tasks.filter((t) => t[2] !== "resumen").map((t) => <TarjetaTarea tarea={t} key={t[0]} />)}
      </div>
      <div className="grid-2">
        <article className="tarjeta" data-guia="grafica">
          <h2 className="tarjeta-titulo"><Icono nombre="grafica" tam={18} /> Solicitudes por curso</h2>
          <p className="seccion-texto">Los 6 cursos con más solicitudes de inscripción.</p>
          {conteo.length ? <Barras role="img" aria-label="Gráfica de solicitudes por curso" filas={conteo.map((x) => ({ etiqueta: x.c.titulo, valor: x.n, titulo: `${x.c.titulo}: ${x.n} solicitudes` }))} />
            : <div className="barras"><p className="seccion-texto">Aún no hay solicitudes.</p></div>}
          <details className="tabla-detalle"><summary>Ver como tabla</summary>
            <div className="tabla-wrap"><table className="tabla"><thead><tr><th>Curso</th><th>Solicitudes</th></tr></thead>
              <tbody>{conteo.map((x) => <tr key={x.c.id}><td>{x.c.titulo}</td><td>{x.n}</td></tr>)}</tbody></table></div>
          </details>
        </article>
        <article className="tarjeta">
          <h2 className="tarjeta-titulo"><Icono nombre="check" tam={18} /> Estado de las inscripciones</h2>
          <p className="seccion-texto">Cómo va el proceso de admisión.</p>
          <div>
            <div className="barra-apilada" role="img" aria-label={estados.map((e) => e.t + ": " + e.n).join(", ")}>
              {estados.filter((e) => e.n).map((e) => <span key={e.k} className={"seg seg-" + e.k} style={{ flex: e.n }} title={e.t + ": " + e.n}></span>)}
            </div>
            <ul className="leyenda">
              {estados.map((e) => <li key={e.k}><span className={"leyenda-marca seg-" + e.k}></span><Icono nombre={e.i} tam={14} />{" " + e.t + " "}<strong>{e.n}</strong> <small>{`(${Math.round((e.n / total) * 100)}%)`}</small></li>)}
            </ul>
          </div>
          <h3 className="subtitulo-mini">Últimas solicitudes</h3>
          <ul className="lista-filas">
            {insAll.length ? insAll.slice(-4).reverse().map((item) => (
              <li key={item.id}>
                <span className="avatar avatar-sm">{verNombres ? iniciales(item.nombre) : "•"}</span>
                <span><strong>{verNombres ? item.nombre : "Estudiante"}</strong><small>{`${cursoTitulo(item.curso_id)} · ${fechaDia(item)}`}</small></span>
                <PillEstado estado={item.estado} />
              </li>
            )) : <li>Aún no hay solicitudes de inscripción.</li>}
          </ul>
        </article>
      </div>
    </>
  );
}
