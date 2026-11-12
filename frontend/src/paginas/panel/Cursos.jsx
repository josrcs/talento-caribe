/* ==========================================================
   Cursos.jsx - Cursos y fichas del panel
   Crear y editar cursos (POST/PUT /api/cursos) y fichas (POST/PUT /api/fichas).
   Solo los cargos con permiso editarCursos ven los botones; el servidor lo vuelve a revisar.
   ========================================================== */
import { useState } from "react";
import Modal from "../../componentes/Modal.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { modulosDe } from "../../lib/cursos.js";
import { toast } from "../../lib/utils.js";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { FilaVacia, intentar } from "./comunes.jsx";
import { usePanel } from "./PanelContexto.jsx";

function FormCurso({ pedido, alCerrar }) {
  const { modelo: D, acciones } = useDatos();
  const { perfil } = usePanel();
  const [ocupado, setOcupado] = useState(false);
  const curso = pedido?.curso || null;
  // Si los módulos salen del temario se muestran tal cual; si se escribieron aparte, como "Nombre: tema, tema"
  const mods = curso ? D.modulos(curso) : [], derivados = mods.every((m, i) => m.titulo === (curso?.temario || [])[i]);
  const temario = curso ? (derivados ? (curso.temario || []).join("\n") : mods.map((m) => m.titulo + (m.temas.length ? ": " + (m.temasTexto || m.temas.join(", ")) : "")).join("\n")) : "";

  async function guardar(e) {
    e.preventDefault();
    if (!perfil.editaCursos) { toast("Tu cargo no tiene permiso para editar cursos.", "error"); return; }
    const f = e.currentTarget; if (!f.reportValidity()) return;
    const v = (n) => f.elements[n].value.trim();
    const id = curso?.id || Math.max(0, ...D.cursos().map((c) => Number(c.id))) + 1;
    const nuevo = { id, titulo: v("titulo"), area: perfil.courseArea || f.elements.area.value, nivel: f.elements.nivel.value, duracion: Number(f.elements.duracion.value), modalidad: f.elements.modalidad.value, fase: f.elements.fase.value, instructor: v("instructor"), edadMinima: Number(f.elements.edad_minima.value), descripcion: v("descripcion"), objetivo: v("objetivo"), temario: f.elements.temario.value.split("\n").map((l) => l.trim()).filter(Boolean), proyecto: v("proyecto") };
    // Cada línea es un módulo; si el módulo conserva su título, también conserva la actividad y la evidencia del plan
    nuevo.modulos = modulosDe({ temario: nuevo.temario }).map((m, i) => { const a = mods[i]?.titulo === m.titulo ? mods[i] : null; return { titulo: m.titulo, temas: m.temas, temasTexto: m.temasTexto, actividades: a?.actividades || [], evidencia: a?.evidencia || "" }; });
    if (curso?.guia) nuevo.guia = curso.guia;
    if (!(await intentar(() => acciones.guardarCurso(nuevo), setOcupado))) return;
    alCerrar(); toast("Curso guardado en la base de datos");
  }
  return (
    <Modal abierto={Boolean(pedido)} alCerrar={alCerrar} etiqueta="mcf-titulo" id="modal-curso-form">
      {pedido && (
        <form id="form-curso" className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar formulario" onClick={alCerrar}>&times;</button>
          <h2 id="mcf-titulo">{curso ? "Editar curso" : "Crear curso"}</h2>
          <div className="campo"><label htmlFor="fc-titulo">Nombre del curso</label><input id="fc-titulo" name="titulo" type="text" required maxLength="100" defaultValue={curso?.titulo} /></div>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="fc-area">Área</label><select id="fc-area" name="area" required disabled={Boolean(perfil.courseArea)} defaultValue={curso?.area || perfil.courseArea || "Software"}><option value="Software">Software</option><option value="Hardware">Hardware</option></select></div>
            <div className="campo"><label htmlFor="fc-nivel">Nivel</label><select id="fc-nivel" name="nivel" required defaultValue={curso?.nivel || "Básico"}><option value="Básico">Básico</option><option value="Intermedio">Intermedio</option></select></div>
            <div className="campo"><label htmlFor="fc-duracion">Duración (semanas)</label><input id="fc-duracion" name="duracion" type="number" min="1" max="52" required defaultValue={curso?.duracion} /></div>
          </div>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="fc-modalidad">Modalidad</label><select id="fc-modalidad" name="modalidad" required defaultValue={curso?.modalidad || "Virtual"}><option value="Virtual">Virtual</option><option value="Presencial">Presencial</option><option value="Híbrido">Híbrido</option></select></div>
            <div className="campo"><label htmlFor="fc-fase">Fase</label><select id="fc-fase" name="fase" required defaultValue={curso?.fase || "Próximamente"}><option value="Lanzamiento">Lanzamiento</option><option value="Próximamente">Próximamente</option></select></div>
            <div className="campo"><label htmlFor="fc-instructor">Instructor</label><input id="fc-instructor" name="instructor" type="text" required defaultValue={curso?.instructor} /></div>
          </div>
          <div className="campo"><label htmlFor="fc-edad-minima">Edad mínima del programa</label><input id="fc-edad-minima" name="edad_minima" type="number" min="0" max="100" required defaultValue={curso?.edadMinima ?? 14} /><small className="form-ayuda">La mayoría de cursos parte de los 14 años. Usa 0 si el programa no tiene mínimo de edad.</small></div>
          <div className="campo"><label htmlFor="fc-descripcion">Descripción</label><textarea id="fc-descripcion" name="descripcion" rows="4" required defaultValue={curso?.descripcion}></textarea></div>
          <div className="campo"><label htmlFor="fc-objetivo">Objetivo</label><textarea id="fc-objetivo" name="objetivo" rows="2" defaultValue={curso?.objetivo}></textarea></div>
          <div className="campo"><label htmlFor="fc-temario">Módulos (uno por línea)</label><textarea id="fc-temario" name="temario" rows="6" placeholder={"Fundamentos: variables, tipos de datos y operadores\nDecisiones: condicionales y ciclos"} defaultValue={temario}></textarea><small className="form-ayuda">Escribe «Nombre del módulo: tema 1, tema 2, tema 3». Cada línea es un módulo.</small></div>
          <div className="campo"><label htmlFor="fc-proyecto">Proyecto final</label><input id="fc-proyecto" name="proyecto" type="text" defaultValue={curso?.proyecto} /></div>
          <div className="modal-acciones"><BotonCarga cargando={ocupado} id="curso-guardar">Guardar curso</BotonCarga><button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

function DetalleCurso({ curso, alCerrar }) {
  const { modelo: D } = useDatos();
  const edad = Number(curso?.edadMinima ?? 14);
  return (
    <Modal abierto={Boolean(curso)} alCerrar={alCerrar} etiqueta="mcd-titulo" id="modal-curso-detalle">
      {curso && (
        <article className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar detalle" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">{curso.area}</span>
          <h2 id="mcd-titulo">{curso.titulo}</h2>
          <p>{curso.descripcion}</p>
          <dl className="curso-meta">
            <div><dt>Nivel</dt><dd>{curso.nivel}</dd></div><div><dt>Duración</dt><dd>{curso.duracion + " semanas"}</dd></div>
            <div><dt>Modalidad</dt><dd>{curso.modalidad}</dd></div><div><dt>Instructor</dt><dd>{curso.instructor}</dd></div>
            <div><dt>Edad mínima</dt><dd>{edad > 0 ? edad + " años" : "Sin mínimo específico"}</dd></div>
          </dl>
          <h3>Lo que lograrán</h3><p>{curso.objetivo || "Por definir"}</p>
          <h3>Módulos</h3>
          <div className="modulos-lista">
            {D.modulos(curso).length ? D.modulos(curso).map((m) => (
              <details className="modulo" key={m.numero}>
                <summary><span className="modulo-num">{m.numero}</span><span className="modulo-titulo"><small>{"Módulo " + m.numero}</small>{m.titulo}</span><span className="modulo-cuenta">{m.temas.length + " temas"}</span></summary>
                <div className="modulo-cuerpo">
                  <ul className="modulo-temas">{m.temas.map((t) => <li key={t}>{t}</li>)}</ul>
                  {m.actividades.length > 0 && <><p className="modulo-sub">Actividad</p><ul className="modulo-acts">{m.actividades.map((a) => <li key={a}>{a}</li>)}</ul></>}
                  {m.evidencia && <p className="modulo-evidencia"><strong>Evidencia:</strong> {m.evidencia}</p>}
                </div>
              </details>
            )) : <p>Sin módulos definidos.</p>}
          </div>
          <h3>Fichas</h3>
          <div className="fichas-lista">
            {D.fichasDeCurso(curso.id).length ? D.fichasDeCurso(curso.id).map((f) => (
              <div className="ficha-opcion" key={f.numero}><span className="ficha-numero"><small>Ficha</small>{f.numero}</span>
                <span className="ficha-datos"><strong>{f.jornada}</strong><small>{`Inicia ${f.inicio || "por definir"} · ${D.estudiantesDeCurso(curso.id, f.numero).length}/${Number(f.cupos) || "—"} inscritos`}</small></span><span className="tag">{f.estado}</span></div>
            )) : <p className="modal-sub">Este curso aún no tiene fichas.</p>}
          </div>
          <h3>Proyecto final</h3><p>{curso.proyecto || "Por definir"}</p>
          <div className="modal-acciones"><button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button></div>
        </article>
      )}
    </Modal>
  );
}

function FormFicha({ pedido, alCerrar }) {
  const { modelo: D, acciones } = useDatos();
  const { cursosVisibles } = usePanel();
  const [ocupado, setOcupado] = useState(false);
  const f = pedido?.ficha || null;
  async function guardar(e) {
    e.preventDefault(); const form = e.currentTarget; if (!form.reportValidity()) return;
    const el = form.elements, numero = el.numero.value.trim();
    if (!f && D.ficha(numero)) { toast("Ya existe una ficha con el número " + numero + ".", "error"); return; }
    const datos = { numero, curso_id: Number(el.curso_id.value), jornada: el.jornada.value, inicio: el.inicio.value, cupos: Number(el.cupos.value), estado: el.estado.value, existente: Boolean(f) };
    if (!(await intentar(() => acciones.guardarFicha(datos), setOcupado))) return;
    alCerrar(); toast("Ficha " + numero + " guardada");
  }
  return (
    <Modal abierto={Boolean(pedido)} alCerrar={alCerrar} etiqueta="mff-titulo" id="modal-ficha-form">
      {pedido && (
        <form id="form-ficha" className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">GRUPOS</span>
          <h2 id="mff-titulo">{f ? "Editar ficha " + f.numero : "Nueva ficha"}</h2>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="ff-numero">Número de ficha</label><input id="ff-numero" name="numero" type="text" inputMode="numeric" pattern="[0-9]{4,6}" maxLength="6" required readOnly={Boolean(f)} defaultValue={f?.numero || D.siguienteFicha()} /><small className="form-ayuda">De 4 a 6 dígitos. Te sugerimos el siguiente libre.</small></div>
            <div className="campo"><label htmlFor="ff-curso">Curso</label><select id="ff-curso" name="curso_id" required defaultValue={String(f?.curso_id || cursosVisibles[0]?.id || "")}>{cursosVisibles.map((c) => <option key={c.id} value={String(c.id)}>{c.titulo}</option>)}</select></div>
          </div>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="ff-jornada">Jornada</label><select id="ff-jornada" name="jornada" required defaultValue={f?.jornada || "Mañana"}>{["Mañana", "Tarde", "Noche", "Sábados"].map((j) => <option key={j}>{j}</option>)}</select></div>
            <div className="campo"><label htmlFor="ff-inicio">Fecha de inicio</label><input id="ff-inicio" name="inicio" type="date" required defaultValue={f?.inicio || ""} /></div>
          </div>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="ff-cupos">Cupos</label><input id="ff-cupos" name="cupos" type="number" min="1" max="200" required defaultValue={f?.cupos || 25} /></div>
            <div className="campo"><label htmlFor="ff-estado-f">Estado</label><select id="ff-estado-f" name="estado" required defaultValue={f?.estado || "Inscripciones abiertas"}>{["Inscripciones abiertas", "En formación", "Próximamente", "Finalizada"].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="modal-acciones"><button type="submit" className="btn btn-primary" disabled={ocupado}>Guardar ficha</button><button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

const CLASE_FICHA = { "Inscripciones abiertas": "pill-ok", "En formación": "", "Próximamente": "pill-pendiente", Finalizada: "pill-gris" };

export default function Cursos() {
  const { modelo: D } = useDatos();
  const { perfil, cursosVisibles, cursoTitulo, cursoEnArea } = usePanel();
  const [formCurso, setFormCurso] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [formFicha, setFormFicha] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const q = buscar.replace(/\D/g, "");
  const fichas = D.fichas().filter((f) => cursoEnArea(f.curso_id) && (!q || f.numero.includes(q)) && (!estado || f.estado === estado)).sort((a, b) => a.numero.localeCompare(b.numero));
  return (
    <>
      <div className="seccion-cabecera">
        <h1 id="t-cursos">Cursos</h1>
        {perfil.editaCursos && <button type="button" className="btn btn-primary" onClick={() => setFormCurso({ curso: null, n: Date.now() })}>Nuevo curso</button>}
      </div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Curso</th><th scope="col">Área</th><th scope="col">Nivel</th><th scope="col">Modalidad</th><th scope="col">Instructor</th><th scope="col">Fichas</th><th scope="col">Fase</th><th scope="col">Acciones</th></tr></thead>
          <tbody>
            {cursosVisibles.length ? cursosVisibles.map((c) => (
              <tr key={c.id}>
                <td>{c.titulo}<br /><small>{D.modulos(c).length + " módulos"}</small></td><td>{c.area}</td><td>{c.nivel}</td><td>{c.modalidad}</td><td>{c.instructor}</td>
                <td><span className="fichas-celda">{D.fichasDeCurso(c.id).length ? D.fichasDeCurso(c.id).map((f) => <span className="ficha-chip" key={f.numero} title={f.jornada + " · " + f.estado}>{f.numero}</span>) : "—"}</span></td>
                <td><span className={"pill " + (c.fase === "Lanzamiento" ? "pill-ok" : "")}>{c.fase}</span></td>
                <td><div className="portal-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetalle(c)}>Ver información</button>
                  {perfil.editaCursos && <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormCurso({ curso: c, n: Date.now() })}>Editar</button>}
                </div></td>
              </tr>
            )) : <FilaVacia columnas={8}>No hay cursos para este departamento.</FilaVacia>}
          </tbody>
        </table>
      </div>

      <div className="seccion-cabecera fichas-cabecera">
        <div><span className="eyebrow">GRUPOS</span><h2 id="t-fichas">Fichas</h2><p className="seccion-texto">Cada ficha es un grupo de un curso con su número, jornada y fecha de inicio. Los estudiantes se inscriben en una ficha y los docentes la usan para publicar actividades y hacer seguimiento.</p></div>
        {perfil.editaCursos && <button type="button" className="btn btn-primary" onClick={() => setFormFicha({ ficha: null, n: Date.now() })}>Nueva ficha</button>}
      </div>
      <div className="filtros fichas-filtros">
        <div className="campo"><label htmlFor="ff-buscar">Buscar ficha</label><input id="ff-buscar" type="search" inputMode="numeric" maxLength="6" placeholder="Ej. 25896" value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
        <div className="campo"><label htmlFor="ff-estado">Estado</label><select id="ff-estado" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos</option>{Object.keys(CLASE_FICHA).map((x) => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Ficha</th><th scope="col">Curso</th><th scope="col">Jornada</th><th scope="col">Inicio</th><th scope="col">Cupos</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
          <tbody>
            {fichas.length ? fichas.map((f) => {
              const n = D.estudiantesDeCurso(f.curso_id, f.numero).length;
              const pend = D.inscripciones().filter((i) => Number(i.curso_id) === Number(f.curso_id) && D.fichaDeInscripcion(i) === f.numero && i.estado === "pendiente").length;
              return (
                <tr key={f.numero}>
                  <td><span className="ficha-chip">{f.numero}</span></td>
                  <td>{cursoTitulo(f.curso_id)}<br /><small>{D.curso(f.curso_id)?.instructor || ""}</small></td>
                  <td>{f.jornada}</td><td>{f.inicio || "—"}</td>
                  <td>{`${n}/${Number(f.cupos) || "—"}`}{pend > 0 && <><br /><small>{`${pend} en revisión`}</small></>}</td>
                  <td><span className={"pill " + (CLASE_FICHA[f.estado] || "")}>{f.estado}</span></td>
                  <td>{perfil.editaCursos ? <button type="button" className="btn btn-outline btn-sm" onClick={() => setFormFicha({ ficha: f, n: Date.now() })}>Editar</button> : "—"}</td>
                </tr>
              );
            }) : <FilaVacia columnas={7}>{q ? "No hay fichas con ese número." : "No hay fichas para tu área."}</FilaVacia>}
          </tbody>
        </table>
      </div>
      <FormCurso key={"c" + (formCurso?.n || 0)} pedido={formCurso} alCerrar={() => setFormCurso(null)} />
      <DetalleCurso curso={detalle} alCerrar={() => setDetalle(null)} />
      <FormFicha key={"f" + (formFicha?.n || 0)} pedido={formFicha} alCerrar={() => setFormFicha(null)} />
    </>
  );
}
