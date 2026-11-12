/* ==========================================================
   Academico.jsx - Actividad académica: lo que publican los docentes por curso.
   La Gerencia además supervisa: puede editar o retirar actividades de cualquier
   docente y corregir notas (el servidor lo permite con PERMISOS.supervisarAcademico).
   ========================================================== */
import { useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import Modal from "../../componentes/Modal.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { confirmar, toast } from "../../lib/utils.js";
import { Barra, TipoIcono, colorNota } from "../../componentes/app/ui.jsx";
import { FilaVacia, fechaCorta, intentar } from "./comunes.jsx";
import { usePanel } from "./PanelContexto.jsx";

function EditarActividad({ actividad, alCerrar }) {
  const { acciones } = useDatos();
  const { cursoTitulo } = usePanel();
  const [ocupado, setOcupado] = useState(false);
  const a = actividad;
  async function guardar(e) {
    e.preventDefault(); const f = e.currentTarget; if (!f.reportValidity()) return;
    const v = (n) => f.elements[n].value.trim();
    const cambios = { curso_id: Number(a.curso_id), modulo: Number(a.modulo) || 1, ficha: a.ficha || "", tipo: f.elements.tipo.value, titulo: v("titulo"), objetivo: v("objetivo"), descripcion: v("descripcion"), fecha_limite: f.elements.fecha_limite.value, recurso: v("recurso") };
    if (!(await intentar(() => acciones.actualizarActividad(a.id, cambios), setOcupado))) return;
    alCerrar(); toast("Actividad actualizada");
  }
  return (
    <Modal abierto={Boolean(a)} alCerrar={alCerrar} etiqueta="mas-titulo" id="modal-actividad-sup">
      {a && (
        <form className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">SUPERVISIÓN DE GERENCIA</span>
          <h2 id="mas-titulo">Editar actividad</h2>
          <p className="modal-sub">{`Publicada por ${a.docente || "un docente"} en ${cursoTitulo(a.curso_id)}. Los estudiantes verán los cambios de inmediato.`}</p>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="mas-tipo">Tipo</label><select id="mas-tipo" name="tipo" required defaultValue={a.tipo}>{["Tarea", "Práctica", "Quiz", "Lectura", "Proyecto"].map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="campo"><label htmlFor="mas-fecha">Fecha límite</label><input id="mas-fecha" name="fecha_limite" type="date" required defaultValue={String(a.fecha_limite || "").slice(0, 10)} /></div>
          </div>
          <div className="campo"><label htmlFor="mas-nombre">Título</label><input id="mas-nombre" name="titulo" required minLength="4" maxLength="90" defaultValue={a.titulo} /></div>
          <div className="campo"><label htmlFor="mas-objetivo">Objetivo (opcional)</label><input id="mas-objetivo" name="objetivo" maxLength="160" defaultValue={a.objetivo || ""} /></div>
          <div className="campo"><label htmlFor="mas-descripcion">Instrucciones</label><textarea id="mas-descripcion" name="descripcion" rows="6" required minLength="15" maxLength="2000" defaultValue={a.descripcion || ""}></textarea></div>
          <div className="campo"><label htmlFor="mas-recurso">Enlace de apoyo (opcional)</label><input id="mas-recurso" name="recurso" type="url" maxLength="300" placeholder="https://" defaultValue={a.recurso || ""} /></div>
          <div className="modal-acciones"><button type="submit" className="btn btn-primary" disabled={ocupado}>Guardar cambios</button><button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

function FormNota({ e }) {
  const { acciones } = useDatos();
  const [ocupado, setOcupado] = useState(false);
  async function guardar(ev) {
    ev.preventDefault(); const f = ev.currentTarget; if (!f.reportValidity()) return;
    const nota = Math.round(Number(f.elements.nota.value) * 10) / 10;
    if (await intentar(() => acciones.calificar(e.id, nota, f.elements.comentario.value.trim()), setOcupado)) toast("Nota guardada");
  }
  return (
    <form className="tarjeta entrega-sup form" noValidate onSubmit={guardar}>
      <div className="entrega-sup-cabecera"><strong>{e.nombre || "Estudiante"}</strong><small>{`Entregada el ${fechaCorta(e.creado)}`}</small></div>
      {e.respuesta && <p className="mensaje-texto" data-no-traducir>{e.respuesta}</p>}
      {e.enlace && <p><a href={e.enlace} target="_blank" rel="noopener noreferrer">Abrir el enlace de la entrega</a></p>}
      <div className="fila-campos">
        <div className="campo"><label htmlFor={"nota-" + e.id}>Nota (1.0 a 5.0)</label><input id={"nota-" + e.id} name="nota" type="number" min="1" max="5" step="0.1" required defaultValue={e.nota != null ? Number(e.nota).toFixed(1) : ""} /></div>
        <div className="campo"><label htmlFor={"com-" + e.id}>Retroalimentación</label><textarea id={"com-" + e.id} name="comentario" rows="2" required minLength="5" maxLength="800" data-no-traducir defaultValue={e.comentario || ""}></textarea></div>
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={ocupado}>{e.estado === "revisada" ? "Corregir nota" : "Calificar"}</button>
    </form>
  );
}
function EntregasActividad({ actividadId, alCerrar }) {
  const { modelo: D } = useDatos();
  const { cursoTitulo } = usePanel();
  const a = actividadId ? D.actividades().find((x) => String(x.id) === String(actividadId)) : null;
  const ents = a ? D.entregasDeActividad(a.id) : [];
  return (
    <Modal abierto={Boolean(a)} alCerrar={alCerrar} etiqueta="mes-titulo" id="modal-entregas-sup">
      {a && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">SUPERVISIÓN DE GERENCIA</span>
          <h2 id="mes-titulo">{a.titulo}</h2>
          <p className="modal-sub">{`${cursoTitulo(a.curso_id)} · ${a.docente || "Docente"} · ${ents.length}${ents.length === 1 ? " entrega" : " entregas"}`}</p>
          <div className="lista-entregas-sup">
            {ents.length ? ents.map((e) => <FormNota e={e} key={e.id} />) : <p className="seccion-texto">Todavía nadie ha entregado esta actividad.</p>}
          </div>
          <div className="modal-acciones"><button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button></div>
        </article>
      )}
    </Modal>
  );
}

function Supervision() {
  const { modelo: D, acciones } = useDatos();
  const { cursoTitulo } = usePanel();
  const [docente, setDocente] = useState("");
  const [buscar, setBuscar] = useState("");
  const [editando, setEditando] = useState(null);
  const [entregas, setEntregas] = useState(null);
  const todas = D.actividades(), q = buscar.trim().toLowerCase();
  const lista = todas.filter((a) => (!docente || a.docente === docente) && (!q || (a.titulo + " " + cursoTitulo(a.curso_id)).toLowerCase().includes(q)));
  async function retirar(a) {
    const n = D.entregasDeActividad(a.id).length;
    if (!(await confirmar({ titulo: "¿Retirar esta actividad?", mensaje: "«" + a.titulo + "» de " + (a.docente || "este docente") + "." + (n ? " También se borrarán sus " + n + " entregas." : "") + " Esta acción no se puede deshacer.", aceptar: "Retirar actividad", peligro: true }))) return;
    if (await intentar(() => acciones.eliminarActividad(a.id))) toast("Actividad retirada");
  }
  return (
    <div id="supervision-academica">
      <div className="seccion-cabecera fichas-cabecera"><div><span className="eyebrow">SUPERVISIÓN DE GERENCIA</span><h2>Actividades de todos los docentes</h2><p className="seccion-texto">Revisa lo que publica cada docente. Si algo necesita corrección, puedes editar la actividad, retirarla o corregir una nota.</p></div></div>
      <div className="filtros">
        <div className="campo"><label htmlFor="sup-docente">Docente</label><select id="sup-docente" value={docente} onChange={(e) => setDocente(e.target.value)}><option value="">Todos</option>{[...new Set(todas.map((a) => a.docente).filter(Boolean))].sort().map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="campo"><label htmlFor="sup-buscar">Buscar actividad</label><input id="sup-buscar" type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
      </div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Actividad</th><th scope="col">Curso</th><th scope="col">Docente</th><th scope="col">Fecha límite</th><th scope="col">Entregas</th><th scope="col">Acciones</th></tr></thead>
          <tbody>
            {lista.length ? lista.map((a) => {
              const ents = D.entregasDeActividad(a.id), revisadas = ents.filter((e) => e.estado === "revisada").length;
              return (
                <tr key={a.id}>
                  <td><strong>{a.titulo}</strong><br /><small>{a.tipo + (a.modulo ? " · Módulo " + Number(a.modulo) : "") + (a.ficha ? " · Ficha " + a.ficha : "")}</small></td>
                  <td>{cursoTitulo(a.curso_id)}</td><td>{a.docente || "—"}</td><td>{fechaCorta(a.fecha_limite)}</td>
                  <td>{ents.length}{ents.length > 0 && <><br /><small>{`${revisadas} calificadas`}</small></>}</td>
                  <td><div className="portal-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEntregas(a.id)}>Entregas</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditando(a)}>Editar</button>
                    <button type="button" className="btn btn-outline btn-sm btn-peligro" onClick={() => retirar(a)}>Retirar</button>
                  </div></td>
                </tr>
              );
            }) : <FilaVacia columnas={6}>{todas.length ? "No hay actividades con esos filtros." : "Los docentes aún no han publicado actividades."}</FilaVacia>}
          </tbody>
        </table>
      </div>
      <EditarActividad key={editando?.id || "x"} actividad={editando} alCerrar={() => setEditando(null)} />
      <EntregasActividad actividadId={entregas} alCerrar={() => setEntregas(null)} />
    </div>
  );
}

export default function Academico() {
  const { modelo: D } = useDatos();
  const { perfil, cursosVisibles, cursoTitulo } = usePanel();
  const lista = cursosVisibles.map((c) => {
    const est = D.estudiantesDeCurso(c.id), acts = D.actividadesDeCurso(c.id), ents = acts.flatMap((a) => D.entregasDeActividad(a.id));
    const notas = ents.map((e) => e.nota).filter((n) => n !== null && n !== undefined).map(Number);
    return { c, est: est.length, acts: acts.length, ents: ents.length, esperadas: est.length * acts.length, prom: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null };
  });
  const totalActs = lista.reduce((a, x) => a + x.acts, 0), totalEnts = lista.reduce((a, x) => a + x.ents, 0), totalEsp = lista.reduce((a, x) => a + x.esperadas, 0);
  const visible = (a) => cursosVisibles.some((c) => Number(c.id) === Number(a.curso_id));
  const docentesActivos = new Set(D.actividades().filter(visible).map((a) => a.docente)).size;
  const recientes = D.actividades().filter(visible).sort((a, b) => String(b.creado || "").localeCompare(String(a.creado || ""))).slice(0, 5);
  const kpis = [["portapapeles", "Actividades publicadas", totalActs], ["check", "Entregas recibidas", totalEnts], ["grafica", "Cumplimiento", (totalEsp ? Math.round((totalEnts / totalEsp) * 100) : 0) + "%"], ["pizarra", "Docentes activos", docentesActivos]];
  return (
    <>
      <div className="seccion-cabecera"><div><span className="eyebrow">SEGUIMIENTO ACADÉMICO</span><h1 id="t-academico">Actividad académica</h1><p className="seccion-texto">Actividades publicadas por cada docente, entregas recibidas y promedio de notas por curso.</p></div></div>
      <dl className="kpis">{kpis.map(([i, t, v]) => <div className="kpi" key={t}><dt><Icono nombre={i} tam={18} />{" " + t}</dt><dd>{v}</dd></div>)}</dl>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>Curso</th><th>Docente</th><th>Estudiantes</th><th>Actividades</th><th>Entregas recibidas</th><th>Promedio</th></tr></thead>
          <tbody>
            {lista.length ? lista.map((x) => {
              const pct = x.esperadas ? Math.round((x.ents / x.esperadas) * 100) : 0;
              return (
                <tr key={x.c.id}>
                  <td>{x.c.titulo}<br /><small>{`${x.c.area} · ${x.c.fase}`}</small></td><td>{x.c.instructor}</td><td>{x.est}</td><td>{x.acts}</td>
                  <td><div className="celda-progreso"><Barra pct={pct} etiqueta="Entregas recibidas" /><small>{`${x.ents}/${x.esperadas}`}</small></div></td>
                  <td>{x.prom == null ? "—" : <span className={"nota-chip " + colorNota(x.prom)}>{x.prom.toFixed(1)}</span>}</td>
                </tr>
              );
            }) : <FilaVacia columnas={6}>No hay cursos para tu área.</FilaVacia>}
          </tbody>
        </table>
      </div>
      <h2 className="subtitulo">Últimas actividades publicadas</h2>
      <div className="lista-actividades">
        {recientes.length ? recientes.map((a) => (
          <article className="tarjeta act-docente" key={a.id}>
            <TipoIcono tipo={a.tipo} />
            <div className="act-docente-info"><span className="act-curso">{`${cursoTitulo(a.curso_id)} · ${a.tipo}`}</span><h3>{a.titulo}</h3><p className="act-vence"><Icono nombre="pizarra" tam={14} />{` ${a.docente} · ${D.textoVence(a.fecha_limite)}`}</p></div>
          </article>
        )) : <p className="seccion-texto">Los docentes aún no han publicado actividades.</p>}
      </div>
      {perfil.supervisa && <Supervision />}
    </>
  );
}
