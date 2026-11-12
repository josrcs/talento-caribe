/* ==========================================================
   Modales.jsx - Ventanas del portal
   - ModalActividad:      el estudiante abre una actividad y la entrega (o edita su entrega).
   - ModalFormActividad:  el docente crea o edita una actividad (plantillas didácticas).
   - ModalCalificar:      el docente califica una entrega de 1.0 a 5.0 con comentario.
   - ModalSeguimiento:    el docente ve el avance de un estudiante módulo por módulo.
   ========================================================== */
import { useState } from "react";
import Modal from "../../componentes/Modal.jsx";
import Icono from "../../componentes/Icono.jsx";
import { Formato } from "../../componentes/ChatIA.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { TIPOS } from "../../lib/modelo.js";
import { toast } from "../../lib/utils.js";
import { useValidacion } from "../../lib/validacion.jsx";
import { Barra, Pill, TipoIcono, celebrar, colorNota, etiquetaModulo, fecha, iniciales, nota } from "../../componentes/app/ui.jsx";
import { ListaModulos, actividadDelPlan, misActividades } from "./comunes.jsx";
import { usePortal } from "./PortalContexto.jsx";

/* Guarda bloqueando el botón mientras responde el servidor; si falla, avisa */
async function guardando(setOcupado, accion) {
  setOcupado(true);
  try { await accion(); return true; }
  catch (error) { toast(error.message || "No se pudo guardar. Inténtalo de nuevo.", "error"); return false; }
  finally { setOcupado(false); }
}
const URL_OK = (v) => (v && !/^https?:\/\//.test(v) ? "El enlace debe empezar por https://" : "");

/* ---------- Estudiante: abrir y entregar ---------- */
export function ModalActividad({ id, alCerrar }) {
  const { modelo: D, acciones } = useDatos();
  const { s, preguntarIA } = usePortal();
  const { validar, error, invalido } = useValidacion();
  const [ocupado, setOcupado] = useState(false);
  const a = id ? misActividades(D, s.correo).find((x) => String(x.id) === String(id)) : null;
  const e = a?.entrega, cerrada = e?.estado === "revisada";
  const [largo, setLargo] = useState(e?.respuesta?.length || 0);

  async function entregar(ev) {
    ev.preventDefault(); const form = ev.currentTarget;
    const ok = validar(form, { respuesta: (v) => (v.length < 10 ? "Escribe al menos 10 caracteres para que tu docente pueda revisarla." : ""), enlace: URL_OK });
    if (!ok) return;
    if (!(await guardando(setOcupado, () => acciones.entregar({ actividad_id: a.id, respuesta: form.elements.respuesta.value.trim(), enlace: form.elements.enlace.value.trim() })))) return;
    alCerrar(); toast("¡Actividad entregada! 🎉 Tu docente la revisará pronto."); celebrar();
  }
  return (
    <Modal abierto={Boolean(a)} alCerrar={alCerrar} className="modal modal-ancho" etiqueta="ma-titulo" id="modal-actividad">
      {a && (
        <div className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <div className="modal-act-cabecera"><TipoIcono tipo={a.tipo} /><div><span className="eyebrow">{`${a.tipo} · ${a.curso?.titulo || ""}`}</span><h2 id="ma-titulo">{a.titulo}</h2></div></div>
          <div className="act-meta">
            <Pill estado={a.estado} />
            <span className="act-vence"><Icono nombre="calendario" tam={14} />{` ${fecha(a.fecha_limite)} · ${D.textoVence(a.fecha_limite)}`}</span>
            <span className="act-vence"><Icono nombre="pizarra" tam={14} />{" " + a.docente}</span>
          </div>
          {a.objetivo && <div className="objetivo-caja"><Icono nombre="brujula" tam={18} /><div><strong>Objetivo</strong><p>{a.objetivo}</p></div></div>}
          <h3>Instrucciones</h3><div className="instrucciones"><Formato texto={a.descripcion} /></div>
          {a.recurso && <p><a className="btn btn-outline btn-sm" href={a.recurso} target="_blank" rel="noopener noreferrer"><Icono nombre="libro" tam={15} /> Abrir recurso de apoyo</a></p>}
          {cerrada ? (
            <>
              <div className="retro-caja"><span className={`nota-grande ${colorNota(e.nota)}`}>{nota(e.nota)}</span><div><strong>{`Retroalimentación de ${a.docente}`}</strong><p>{e.comentario}</p></div></div>
              <h3>Tu entrega</h3><div className="instrucciones" data-no-traducir><Formato texto={e.respuesta} /></div>
              {e.enlace && <p><a href={e.enlace} target="_blank" rel="noopener noreferrer">{e.enlace}</a></p>}
            </>
          ) : (
            <>
              <button type="button" className="btn-texto-plano" onClick={() => { alCerrar(); preguntarIA(`Ayúdame con "${a.titulo}"`); }}><Icono nombre="chat" tam={14} /> ¿Dudas? Pregúntale al tutor IA</button>
              <form id="form-entrega" className="form" noValidate onSubmit={entregar}>
                <div className="campo"><label htmlFor="me-respuesta">Tu respuesta</label>
                  <textarea id="me-respuesta" name="respuesta" rows="6" maxLength="3000" required placeholder="Escribe aquí tu trabajo. Puedes usar listas numeradas." defaultValue={e?.respuesta || ""} onChange={(x) => setLargo(x.target.value.length)} aria-invalid={invalido("respuesta")}></textarea>
                  <small className="form-ayuda">{`${largo}/3000 caracteres`}</small>{error("respuesta")}
                </div>
                <div className="campo"><label htmlFor="me-enlace">Enlace (opcional)</label><input id="me-enlace" name="enlace" type="url" placeholder="https://codepen.io/… o https://github.com/…" defaultValue={e?.enlace || ""} aria-invalid={invalido("enlace")} />{error("enlace")}</div>
                <div className="modal-acciones"><button type="submit" className="btn btn-primary" disabled={ocupado}>{e ? "Actualizar entrega" : "Entregar actividad"}</button><button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button></div>
              </form>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------- Docente: crear o editar ---------- */
const PLANTILLAS = [
  ["Actividad del plan", "Práctica", (c, m, total) => (m ? actividadDelPlan(c, m, total) : { titulo: c.titulo, objetivo: "", descripcion: "" })],
  ["Práctica guiada", "Práctica", (c, m) => ({ titulo: `Práctica: ${m?.titulo || c.titulo}`.slice(0, 90), objetivo: `Aplicar ${(m?.temas?.[0] || "lo visto en clase").toLowerCase()} en un caso real.`, descripcion: "1. Lee el caso que encontrarás en el recurso.\n2. Resuélvelo paso a paso, explicando cada decisión.\n3. Comprueba tu resultado con un ejemplo diferente.\n4. Escribe en 3 líneas qué aprendiste." })],
  ["Quiz rápido", "Quiz", (c, m) => ({ titulo: `Quiz: ${m?.titulo || c.titulo}`.slice(0, 90), objetivo: `Comprobar la comprensión de ${m?.temas?.length ? m.temas.slice(0, 3).join(", ").toLowerCase() : "los conceptos clave del módulo"}.`, descripcion: "Responde con tus palabras:\n1. ¿Qué es … ? Da un ejemplo.\n2. ¿En qué se diferencia … de … ?\n3. ¿Dónde usarías esto en tu vida diaria?" })],
  ["Mini proyecto", "Proyecto", (c) => ({ titulo: `Mini proyecto: ${c.proyecto?.split(" ").slice(0, 5).join(" ") || "aplica lo aprendido"}`, objetivo: "Integrar lo aprendido en un producto propio.", descripcion: `1. Elige un problema de tu barrio o de un emprendimiento.\n2. Diseña una solución usando lo visto en ${c.titulo}.\n3. Construye una primera versión.\n4. Comparte el enlace y una foto o captura.\n5. Cuenta qué mejorarías en la siguiente versión.` })],
  ["Lectura + reflexión", "Lectura", () => ({ titulo: "Lectura y reflexión", objetivo: "Comprender un tema y explicarlo con tus palabras.", descripcion: "1. Lee el recurso de apoyo.\n2. Resume las 3 ideas principales.\n3. Escribe una pregunta que te haya quedado.\n4. Explica el tema como si se lo contaras a un amigo." })],
];
const enDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

/* pedido = { cursoId, actividad, modulo, plan, fichaPreferida } (lo arma Portal.jsx al abrir la ventana) */
export function ModalFormActividad({ pedido, alCerrar }) {
  const { modelo: D, acciones } = useDatos();
  const { s } = usePortal();
  const { validar, error, invalido } = useValidacion();
  const cursos = D.cursosDeDocente(s.nombre);
  const act = pedido?.actividad || null;
  const cursoInicial = String(act?.curso_id || pedido?.cursoId || cursos[0]?.id || "");
  const moduloInicial = String(Number(act?.modulo || pedido?.modulo) || 1);
  const planInicial = pedido?.plan ? actividadDelPlan(D.curso(cursoInicial), D.modulos(D.curso(cursoInicial)).find((m) => m.numero === Number(moduloInicial)), D.modulos(D.curso(cursoInicial)).length) : null;
  const fichaInicial = act ? act.ficha || "" : (pedido?.fichaPreferida && Number(D.ficha(pedido.fichaPreferida)?.curso_id) === Number(cursoInicial) ? pedido.fichaPreferida : "");

  const [cursoId, setCursoId] = useState(cursoInicial);
  const [ficha, setFicha] = useState(fichaInicial);
  const [modulo, setModulo] = useState(moduloInicial);
  const [tipo, setTipo] = useState(planInicial?.tipo || act?.tipo || "Tarea");
  const [textos, setTextos] = useState({ titulo: planInicial?.titulo || act?.titulo || "", objetivo: planInicial?.objetivo || act?.objetivo || "", descripcion: planInicial?.descripcion || act?.descripcion || "" });
  const [ocupado, setOcupado] = useState(false);

  const curso = D.curso(cursoId), mods = D.modulos(curso), m = mods.find((x) => x.numero === Number(modulo));
  const fichas = D.fichasDeCurso(cursoId);
  const alcance = D.estudiantesDeCurso(cursoId, ficha).length;
  const cambiarTexto = (e) => setTextos((t) => ({ ...t, [e.target.name]: e.target.value }));
  function plantilla([, tipoBase, fn]) {
    const datos = fn(curso || {}, m, mods.length);
    setTipo(datos.tipo || tipoBase);
    setTextos({ titulo: datos.titulo, objetivo: datos.objetivo, descripcion: datos.descripcion });
    toast("Plantilla aplicada: ajústala a tu grupo ✍️");
  }

  async function guardar(ev) {
    ev.preventDefault(); const form = ev.currentTarget, f = form.elements;
    const ok = validar(form, { titulo: (v) => (v.length < 4 ? "Escribe un título de al menos 4 caracteres." : ""), fecha_limite: (v) => (v ? "" : "Elige una fecha límite."), descripcion: (v) => (v.length < 15 ? "Las instrucciones deben tener al menos 15 caracteres." : ""), recurso: URL_OK });
    if (!ok) return;
    const datos = { curso_id: Number(cursoId), ficha, modulo: Number(modulo) || 1, tipo, titulo: textos.titulo.trim(), objetivo: textos.objetivo.trim(), descripcion: textos.descripcion.trim(), fecha_limite: f.fecha_limite.value, recurso: f.recurso.value.trim() };
    const destinatarios = D.destinatarios(datos).length;
    if (!(await guardando(setOcupado, () => (act ? acciones.actualizarActividad(act.id, datos) : acciones.crearActividad(datos))))) return;
    if (act) toast("Actividad actualizada");
    else { toast(`Actividad publicada para ${destinatarios} estudiantes (${datos.ficha ? "ficha " + datos.ficha : "todas las fichas"}) 🚀`); celebrar(); }
    alCerrar(true);
  }

  return (
    <Modal abierto={Boolean(pedido)} alCerrar={() => alCerrar(false)} className="modal modal-ancho" etiqueta="mna-titulo" id="modal-nueva-actividad">
      {pedido && (
        <form id="form-actividad" className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={() => alCerrar(false)}>&times;</button>
          <span className="eyebrow">ESPACIO DOCENTE</span>
          <h2 id="mna-titulo">{act ? "Editar actividad" : "Nueva actividad"}</h2>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="na-curso">Curso</label>
              <select id="na-curso" name="curso_id" required value={cursoId} onChange={(e) => { setCursoId(e.target.value); setFicha(""); setModulo("1"); }}>
                {cursos.map((c) => <option key={c.id} value={String(c.id)}>{c.titulo}</option>)}
              </select>
            </div>
            <div className="campo"><label htmlFor="na-ficha">Ficha</label>
              <select id="na-ficha" name="ficha" value={ficha} onChange={(e) => setFicha(e.target.value)}>
                <option value="">Todas las fichas del curso</option>
                {fichas.map((x) => <option key={x.numero} value={x.numero}>{`Ficha ${x.numero} · ${x.jornada} (${D.estudiantesDeCurso(cursoId, x.numero).length} est.)`}</option>)}
              </select>
            </div>
          </div>
          <div className="fila-campos">
            <div className="campo"><label htmlFor="na-modulo">Módulo</label>
              <select id="na-modulo" name="modulo" required value={modulo} onChange={(e) => setModulo(e.target.value)}>
                {mods.map((x) => <option key={x.numero} value={String(x.numero)}>{`Módulo ${x.numero}: ${x.titulo}`}</option>)}
              </select>
              <small className="form-ayuda">{m?.temas.length ? "Temas: " + m.temas.join(", ") : ""}</small>
            </div>
            <div className="campo"><label htmlFor="na-fecha">Fecha límite</label>
              <input id="na-fecha" name="fecha_limite" type="date" required min={act ? undefined : new Date().toISOString().slice(0, 10)} defaultValue={act ? String(act.fecha_limite || "").slice(0, 10) : enDias(pedido.plan ? 14 : 7)} aria-invalid={invalido("fecha_limite")} />
              {error("fecha_limite")}
            </div>
          </div>
          <p className="form-ayuda na-alcance">{`La verán ${alcance} ${alcance === 1 ? "estudiante aprobado" : "estudiantes aprobados"} ${ficha ? "de la ficha " + ficha : "de todas las fichas de este curso"}.`}</p>
          <fieldset className="campo tipo-selector"><legend>Tipo de actividad</legend>
            <div className="tipo-opciones">
              {Object.keys(TIPOS).map((t) => (
                <button type="button" key={t} className={`tipo-opcion ${t === tipo ? "is-selected" : ""}`} aria-pressed={t === tipo} style={{ "--tipo": TIPOS[t].color }} onClick={() => setTipo(t)}><Icono nombre={TIPOS[t].icono} tam={18} /><span>{t}</span></button>
              ))}
            </div>
          </fieldset>
          <div className="plantillas"><span className="campo-titulo">Empieza con una plantilla didáctica</span>
            <div className="plantillas-lista">{PLANTILLAS.map((p) => <button type="button" className="chip" key={p[0]} onClick={() => plantilla(p)}>{p[0]}</button>)}</div>
          </div>
          <div className="campo"><label htmlFor="na-titulo">Título</label><input id="na-titulo" name="titulo" type="text" required maxLength="90" placeholder="Ej.: Tu primera página con 5 etiquetas" value={textos.titulo} onChange={cambiarTexto} aria-invalid={invalido("titulo")} />{error("titulo")}</div>
          <div className="campo"><label htmlFor="na-objetivo">Objetivo de aprendizaje <small>¿Qué aprenderá el estudiante?</small></label><input id="na-objetivo" name="objetivo" type="text" maxLength="160" placeholder="Ej.: Usar etiquetas HTML básicas para estructurar contenido" value={textos.objetivo} onChange={cambiarTexto} /></div>
          <div className="campo"><label htmlFor="na-descripcion">Instrucciones paso a paso</label><textarea id="na-descripcion" name="descripcion" rows="6" required maxLength="2000" placeholder={"1. …\n2. …\n3. …"} value={textos.descripcion} onChange={cambiarTexto} aria-invalid={invalido("descripcion")}></textarea>{error("descripcion")}</div>
          <div className="campo"><label htmlFor="na-recurso">Recurso de apoyo (opcional)</label><input id="na-recurso" name="recurso" type="url" placeholder="https://…" defaultValue={act?.recurso || ""} aria-invalid={invalido("recurso")} />{error("recurso")}</div>
          <div className="modal-acciones"><button type="submit" className="btn btn-primary" disabled={ocupado}>{act ? "Guardar cambios" : "Publicar actividad"}</button><button type="button" className="btn btn-outline" onClick={() => alCerrar(false)}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

/* ---------- Docente: calificar ---------- */
const FRASES = ["¡Excelente trabajo! 🎉", "Se nota tu esfuerzo.", "Revisa de nuevo las instrucciones del punto 2.", "Agrega un ejemplo propio.", "Explica con tus palabras por qué lo hiciste así.", "Siguiente paso: intenta una versión más completa."];
export function ModalCalificar({ id, alCerrar }) {
  const { modelo: D, acciones } = useDatos();
  const { validar, error, invalido } = useValidacion();
  const e = id ? D.entregas().find((x) => String(x.id) === String(id)) : null;
  const a = e ? D.actividades().find((x) => String(x.id) === String(e.actividad_id)) : null;
  const [valor, setValor] = useState(e?.nota ?? "");
  const [comentario, setComentario] = useState(e?.comentario || "");
  const [ocupado, setOcupado] = useState(false);

  async function guardar(ev) {
    ev.preventDefault();
    const ok = validar(ev.currentTarget, { nota: (v) => { const n = Number(v); return v && n >= 1 && n <= 5 ? "" : "La nota debe estar entre 1.0 y 5.0."; }, comentario: (v) => (v.length < 5 ? "Escribe una retroalimentación para el estudiante." : "") });
    if (!ok) return;
    if (!(await guardando(setOcupado, () => acciones.calificar(e.id, Math.round(Number(valor) * 10) / 10, comentario.trim())))) return;
    alCerrar(); toast("Calificación guardada ✅");
  }
  const tarde = e && a && String(e.creado).slice(0, 10) > String(a.fecha_limite).slice(0, 10);
  return (
    <Modal abierto={Boolean(e && a)} alCerrar={alCerrar} className="modal modal-ancho" etiqueta="mr-titulo" id="modal-entrega">
      {e && a && (
        <form id="form-calificar" className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <div className="modal-act-cabecera">
            <span className="avatar">{iniciales(e.nombre)}</span>
            <div>
              <span className="eyebrow">{`${D.curso(a.curso_id)?.titulo || ""} · Ficha ${D.fichaDe(e.correo, a.curso_id)}${etiquetaModulo(a)}`}</span>
              <h2 id="mr-titulo">{e.nombre}</h2>
              <p className="act-vence">{`${a.titulo} · entregada el ${fecha(e.creado)} `}{tarde ? <span className="pill pill-no">Fuera de tiempo</span> : <span className="pill pill-ok">A tiempo</span>}</p>
            </div>
          </div>
          {a.objetivo && <div className="objetivo-caja"><Icono nombre="brujula" tam={18} /><div><strong>Objetivo de la actividad</strong><p>{a.objetivo}</p></div></div>}
          <h3>Respuesta del estudiante</h3><div className="instrucciones entrega-texto" data-no-traducir><Formato texto={e.respuesta} /></div>
          {e.enlace && <p><a className="btn btn-outline btn-sm" href={e.enlace} target="_blank" rel="noopener noreferrer"><Icono nombre="ojo" tam={15} /> Abrir enlace entregado</a></p>}
          <div className="campo"><label htmlFor="mr-nota">Nota (1.0 a 5.0)</label>
            <div className="nota-rapida">
              <input id="mr-nota" name="nota" type="number" min="1" max="5" step="0.1" required value={valor} onChange={(x) => setValor(x.target.value)} aria-invalid={invalido("nota")} />
              <span>{["5.0", "4.5", "4.0", "3.5", "3.0"].map((n) => <button type="button" className="chip" key={n} onClick={() => setValor(n)}>{n}</button>)}</span>
            </div>
            {error("nota")}
          </div>
          <div className="campo"><label htmlFor="mr-comentario">Retroalimentación</label>
            <textarea id="mr-comentario" name="comentario" rows="4" maxLength="800" required placeholder="Qué hizo bien, qué puede mejorar y un siguiente paso." value={comentario} onChange={(x) => setComentario(x.target.value)} aria-invalid={invalido("comentario")}></textarea>
            <div className="frases-rapidas">{FRASES.map((f) => <button type="button" className="chip" key={f} onClick={() => setComentario((t) => (t ? t.trim() + " " : "") + f)}>{f}</button>)}</div>
            {error("comentario")}
          </div>
          <div className="modal-acciones"><button type="submit" className="btn btn-primary" disabled={ocupado}>Guardar calificación</button><button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

/* ---------- Docente: avance de un estudiante módulo por módulo ---------- */
export function ModalSeguimiento({ pedido, alCerrar }) {
  const { modelo: D } = useDatos();
  const c = pedido ? D.curso(pedido.cursoId) : null;
  const e = c ? D.estudiantesDeCurso(c.id).find((x) => x.correo.toLowerCase() === pedido.correo.toLowerCase()) : null;
  const p = e ? D.progreso(e.correo, c.id) : null;
  return (
    <Modal abierto={Boolean(e)} alCerrar={alCerrar} className="modal modal-ancho" etiqueta="ms-titulo" id="modal-seguimiento">
      {e && (
        <div className="modal-contenido">
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <div className="modal-act-cabecera"><span className="avatar">{iniciales(e.nombre)}</span>
            <div><span className="eyebrow">{`${c.titulo} · Ficha ${e.ficha}`}</span><h2 id="ms-titulo">{e.nombre}</h2>
              <p className="act-vence">{`${p.hechas}/${p.total} actividades entregadas · promedio `}<strong className={colorNota(p.promedio)}>{p.promedio == null ? "—" : p.promedio.toFixed(1)}</strong></p>
            </div>
          </div>
          <Barra pct={p.porcentaje} etiqueta="Avance total" />
          <ListaModulos correo={e.correo} cursoId={c.id} docente abierto={Number(pedido.modulo) || 1} />
          <div className="modal-acciones"><button type="button" className="btn btn-outline" onClick={alCerrar}>Cerrar</button></div>
        </div>
      )}
    </Modal>
  );
}
