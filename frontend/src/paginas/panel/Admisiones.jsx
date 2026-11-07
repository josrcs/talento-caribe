/* ==========================================================
   Admisiones.jsx - Inscripciones y mensajes de contacto
   - Inscripciones: filtrar, cambiar el estado (PATCH /api/inscripciones/:id) y ver
     los datos del estudiante (GET /api/estudiantes/:correo, solo admisiones).
   - Mensajes: leer el mensaje (lo marca como leído) y responder por correo.
   ========================================================== */
import { useState } from "react";
import Modal from "../../componentes/Modal.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { toast } from "../../lib/utils.js";
import { FilaVacia, fechaDia, intentar } from "./comunes.jsx";
import { usePanel } from "./PanelContexto.jsx";

function DatosEstudiante({ cuenta, alCerrar }) {
  const v = (x) => x || "No informado";
  const c = cuenta || {};
  return (
    <Modal abierto={Boolean(cuenta)} alCerrar={alCerrar} etiqueta="mf-nombre" id="modal-ficha-estudiante">
      {cuenta && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">DATOS PARA ADMISIONES</span>
          <h2 id="mf-nombre">{v(c.nombre)}</h2>
          <dl className="curso-meta">
            <div><dt>Correo</dt><dd>{v(c.correo)}</dd></div>
            <div><dt>Documento</dt><dd>{v([c.tipo_documento, c.numero_documento].filter(Boolean).join(" · "))}</dd></div>
            <div><dt>Fecha de nacimiento</dt><dd>{v(c.fecha_nacimiento)}</dd></div>
            <div><dt>Teléfono</dt><dd>{v(c.telefono)}</dd></div>
            <div><dt>Dirección</dt><dd>{v(c.direccion)}</dd></div>
            <div><dt>Ciudad y país</dt><dd>{v([c.ciudad, c.region, c.pais].filter(Boolean).join(", "))}</dd></div>
            <div><dt>Nivel de estudios</dt><dd>{v(c.ultimo_estudio)}</dd></div>
            <div><dt>Soportes indicados</dt><dd>{v((c.documentos_disponibles || []).join(", "))}</dd></div>
            <div><dt>Acudiente</dt><dd>{v([c.acudiente_nombre, c.acudiente_telefono, c.acudiente_correo].filter(Boolean).join(" · "))}</dd></div>
          </dl>
          <p className="nota-requisitos">Datos personales protegidos: el servidor solo los entrega a los cargos con permiso de admisiones.</p>
        </article>
      )}
    </Modal>
  );
}

export function Inscripciones() {
  const { modelo: D, acciones } = useDatos();
  const { cursosVisibles, cursoTitulo, cursoEnArea } = usePanel();
  const [filtros, setFiltros] = useState({ curso: "", estado: "", q: "" });
  const [cuenta, setCuenta] = useState(null);
  const q = filtros.q.toLowerCase();
  const visibles = D.inscripciones().filter((i) => cursoEnArea(i.curso_id) && (!filtros.curso || String(i.curso_id) === filtros.curso) && (!filtros.estado || i.estado === filtros.estado) && (!q || (i.nombre + " " + i.correo + " " + D.fichaDeInscripcion(i)).toLowerCase().includes(q)));
  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  async function cambiarEstado(i, estado) {
    if (await intentar(() => acciones.cambiarEstadoInscripcion(i.id, estado))) toast("Estado actualizado");
  }
  async function verDatos(correo) {
    let datos = null;
    if (!(await intentar(async () => { datos = await acciones.fichaEstudiante(correo); }))) return;
    if (!datos) { toast("Este estudiante no tiene datos registrados.", "error"); return; }
    setCuenta(datos);
  }
  return (
    <>
      <h1 id="t-inscripciones">Inscripciones</h1>
      <form className="filtros" aria-label="Filtrar inscripciones" onSubmit={(e) => e.preventDefault()}>
        <div className="campo"><label htmlFor="fi-curso">Curso</label><select id="fi-curso" name="curso" value={filtros.curso} onChange={cambiar}><option value="">Todos</option>{cursosVisibles.map((c) => <option key={c.id} value={String(c.id)}>{c.titulo}</option>)}</select></div>
        <div className="campo"><label htmlFor="fi-estado">Estado</label><select id="fi-estado" name="estado" value={filtros.estado} onChange={cambiar}><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option></select></div>
        <div className="campo"><label htmlFor="fi-buscar">Buscar estudiante o n.º de ficha</label><input id="fi-buscar" name="q" type="search" value={filtros.q} onChange={cambiar} /></div>
      </form>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Estudiante</th><th scope="col">Correo</th><th scope="col">Curso</th><th scope="col">Fecha</th><th scope="col">Ficha</th><th scope="col">Estado</th><th scope="col">Datos</th></tr></thead>
          <tbody>
            {visibles.length ? visibles.map((i) => (
              <tr key={i.id}>
                <td>{i.nombre}</td><td>{i.correo}</td><td>{cursoTitulo(i.curso_id)}</td><td>{fechaDia(i)}</td>
                <td><span className="ficha-chip">{D.fichaDeInscripcion(i) || "—"}</span></td>
                <td><select aria-label={"Estado de " + i.nombre} value={i.estado} onChange={(e) => cambiarEstado(i, e.target.value)}>{["pendiente", "aprobada", "rechazada"].map((x) => <option key={x}>{x}</option>)}</select></td>
                <td><button type="button" className="btn btn-outline btn-sm" onClick={() => verDatos(i.correo)}>Ver datos</button></td>
              </tr>
            )) : <FilaVacia columnas={7}>No hay solicitudes con esos filtros.</FilaVacia>}
          </tbody>
        </table>
      </div>
      <DatosEstudiante cuenta={cuenta} alCerrar={() => setCuenta(null)} />
    </>
  );
}

export function Mensajes() {
  const { modelo: D, acciones } = useDatos();
  const [abierto, setAbierto] = useState(null);
  const mensajes = D.mensajes();
  function ver(m) {
    if (!m.leido) acciones.marcarLeido(m.id).catch((error) => toast(error.message, "error"));
    setAbierto(m);
  }
  return (
    <>
      <h1 id="t-mensajes">Mensajes de contacto</h1>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Interés</th><th scope="col">Asunto</th><th scope="col">Fecha</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {mensajes.length ? mensajes.slice().reverse().map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td><td>{m.correo}</td><td>{m.interes}</td><td>{m.asunto}</td><td>{fechaDia(m)}</td>
                <td><span className={"pill " + (m.leido ? "" : "pill-pendiente")}>{m.leido ? "leído" : "nuevo"}</span></td>
                <td><button className="btn btn-outline btn-sm" type="button" onClick={() => ver(m)}>Ver</button></td>
              </tr>
            )) : <FilaVacia columnas={7}>Aún no hay mensajes.</FilaVacia>}
          </tbody>
        </table>
      </div>
      <Modal abierto={Boolean(abierto)} alCerrar={() => setAbierto(null)} etiqueta="mm-asunto" id="modal-mensaje">
        {abierto && (
          <article className="modal-contenido">
            <button type="button" className="modal-cerrar" aria-label="Cerrar mensaje" onClick={() => setAbierto(null)}>&times;</button>
            <h2 id="mm-asunto" data-no-traducir>{abierto.asunto}</h2>
            <p data-no-traducir>{abierto.nombre + " (" + abierto.correo + ")" + (abierto.telefono ? ", " + abierto.telefono : "")}</p>
            <p className="mensaje-texto" data-no-traducir>{abierto.mensaje}</p>
            <div className="modal-acciones">
              <a className="btn btn-primary" href={"mailto:" + abierto.correo + "?subject=" + encodeURIComponent("Re: " + abierto.asunto)}>Responder por correo</a>
              <button type="button" className="btn btn-outline" onClick={() => setAbierto(null)}>Cerrar</button>
            </div>
          </article>
        )}
      </Modal>
    </>
  );
}
