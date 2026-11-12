/* comunes.jsx - Piezas del portal que usan estudiantes y docentes */
import Icono from "../../componentes/Icono.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { sesionesDe } from "../../lib/cursos.js";
import { Barra, Pill, PillModulo, TipoIcono, colorNota, fecha, nota } from "../../componentes/app/ui.jsx";
import { usePortal } from "./PortalContexto.jsx";

/* Avance por módulo de un estudiante (lo ven el estudiante y su docente) */
export function ListaModulos({ correo, cursoId, docente = false, abierto = 0 }) {
  const { modelo: D } = useDatos();
  const { abrirActividad, abrirCalificar } = usePortal();
  const modulos = D.progresoModulos(correo, cursoId);
  if (!modulos.length) return <div className="modulos-avance"><p>Este curso todavía no tiene módulos.</p></div>;
  return (
    <div className="modulos-avance">
      {modulos.map((m) => (
        <details className={`mod-av mod-${m.estado}`} key={m.numero} open={abierto === m.numero}>
          <summary>
            <span className="mod-av-num" style={{ "--pct": m.porcentaje }}><span>{m.numero}</span></span>
            <span className="mod-av-info">
              <strong>{m.titulo}</strong>
              <small>{m.total ? (
                <>{`${m.hechas}/${m.total} ${m.total === 1 ? "actividad" : "actividades"}`}
                  {m.promedio != null && <>{" · promedio "}<b className={colorNota(m.promedio)}>{m.promedio.toFixed(1)}</b></>}
                  {m.vencidas ? <>{" · "}<b className="nota-baja">{`${m.vencidas} sin entregar`}</b></> : null}</>
              ) : "Aún sin actividades publicadas"}</small>
              {m.total > 0 && <Barra pct={m.porcentaje} etiqueta={"Avance del módulo " + m.numero} />}
            </span>
            <PillModulo estado={m.estado} />
          </summary>
          <div className="mod-av-cuerpo">
            {m.temas.length > 0 && <><p className="mod-av-sub">Temas</p><ul className="temas-chips">{m.temas.map((t) => <li key={t}>{t}</li>)}</ul></>}
            {m.actividades.length > 0 && <><p className="mod-av-sub">Lo que harás en este módulo</p><ul className="modulo-acts">{m.actividades.map((t) => <li key={t}>{t}</li>)}</ul></>}
            {m.evidencia && <p className="modulo-evidencia"><strong>Evidencia del módulo:</strong> {m.evidencia}</p>}
            <p className="mod-av-sub">Actividades publicadas</p>
            {m.actividades_publicadas.length ? (
              <ul className="lista-filas mod-av-acts">
                {m.actividades_publicadas.map((a) => {
                  const e = D.entregaDe(a.id, correo), est = D.estadoPara(a, correo);
                  return (
                    <li key={a.id}>
                      <TipoIcono tipo={a.tipo} />
                      <span><strong>{a.titulo}</strong><small>{`${fecha(a.fecha_limite)} · ${e ? "entregada el " + fecha(e.creado) : D.textoVence(a.fecha_limite)}`}</small></span>
                      {e?.nota != null && <span className={`nota-chip ${colorNota(e.nota)}`}>{nota(e.nota)}</span>}
                      <Pill estado={est} />
                      {docente
                        ? e && <button type="button" className={`btn ${e.estado === "entregada" ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => abrirCalificar(e.id)}>{e.estado === "entregada" ? "Calificar" : "Ver"}</button>
                        : <button type="button" className="btn btn-outline btn-sm" onClick={() => abrirActividad(a.id)}>Abrir</button>}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="form-ayuda">{docente ? "Todavía no has publicado actividades en este módulo." : "Tu docente aún no ha publicado actividades en este módulo."}</p>}
          </div>
        </details>
      ))}
    </div>
  );
}

/* Guía de clase del módulo (docentes): dos sesiones de 90 minutos del plan de cursos */
export function GuiaClase({ curso, modulo }) {
  const { abrirFormActividad } = usePortal();
  const g = curso.guia || {};
  return (
    <details className="guia-clase">
      <summary><Icono nombre="pizarra" tam={16} /> Guía de clase · 2 sesiones de 90 min</summary>
      <div className="guia-clase-cuerpo">
        {sesionesDe(curso, modulo).map((ses) => (
          <div className="sesion" key={ses.nombre}>
            <h4>{ses.nombre}</h4>
            <ol className="sesion-pasos">
              {ses.pasos.map(([n, min, t]) => <li key={n}><span className="sesion-min">{`${min}′`}</span><div><strong>{n}</strong><p>{t}</p></div></li>)}
            </ol>
          </div>
        ))}
        {g.modalidad && <p className="guia-nota"><Icono nombre="brujula" tam={15} /> <span>{g.modalidad}</span></p>}
        {g.nota && <p className="guia-nota guia-nota-alerta"><Icono nombre="escudo" tam={15} /> <span>{g.nota}</span></p>}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirFormActividad({ cursoId: curso.id, modulo: modulo.numero, plan: true })}><Icono nombre="mas" tam={15} /> Publicar la actividad de este módulo</button>
      </div>
    </details>
  );
}

/* Actividad lista para publicar a partir del plan del módulo */
export function actividadDelPlan(c, m, totalModulos) {
  const g = c.guia || {}, acto = m.actividades[0] || "";
  return {
    tipo: m.numero === totalModulos ? "Proyecto" : "Práctica",
    titulo: `Módulo ${m.numero}: ${m.titulo}`.slice(0, 90),
    objetivo: `Comprender y aplicar ${(m.temasTexto || m.temas.join(", ")).replace(/^./, (x) => x.toLowerCase())}.`.slice(0, 160),
    descripcion: [`1. ${acto}`, g.reto ? `2. Reto: ${g.reto}` : "", m.evidencia ? `${g.reto ? 3 : 2}. Entrega: ${m.evidencia}` : ""].filter(Boolean).join("\n").slice(0, 2000),
  };
}

/* Cifras de un curso para el docente */
export function statsCurso(D, c) {
  const est = D.estudiantesDeCurso(c.id), acts = D.actividadesDeCurso(c.id);
  const ent = acts.flatMap((a) => D.entregasDeActividad(a.id));
  const notas = ent.map((e) => e.nota).filter((n) => n !== null && n !== undefined).map(Number);
  const esperadas = acts.reduce((n, a) => n + D.destinatarios(a).length, 0);
  return { estudiantes: est.length, actividades: acts.length, cumplimiento: esperadas ? Math.min(100, Math.round((ent.length / esperadas) * 100)) : 0, promedio: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null };
}
/* Entregas que esperan nota del docente, de la más antigua a la más nueva */
export function porRevisar(D, nombreDocente) {
  const mapa = new Map(D.actividadesDeDocente(nombreDocente).map((a) => [String(a.id), a]));
  return D.entregas().filter((e) => mapa.has(String(e.actividad_id)) && e.estado === "entregada").map((e) => ({ ...e, actividad: mapa.get(String(e.actividad_id)) })).sort((a, b) => String(a.creado).localeCompare(String(b.creado)));
}
/* Actividades del estudiante con su estado, su entrega y su curso */
export const misActividades = (D, correo) => D.actividadesDeEstudiante(correo).map((a) => ({ ...a, estado: D.estadoPara(a, correo), entrega: D.entregaDe(a.id, correo), curso: D.curso(a.curso_id) }));
export const pendientes = (acts) => acts.filter((a) => a.estado === "pendiente" || a.estado === "vencida");
