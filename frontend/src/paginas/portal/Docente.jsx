/* ==========================================================
   Docente.jsx - Secciones del portal para docentes
   Inicio, mis cursos (fichas, módulos y guía de clase), actividades,
   entregas por calificar y seguimiento por módulos.
   ========================================================== */
import { useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { toast } from "../../lib/utils.js";
import { Barra, BotonDosToques, EncabezadoSeccion, Pill, TipoIcono, Vacio, colorNota, etiquetaModulo, fecha, iniciales, nota, textoFicha } from "../../componentes/app/ui.jsx";
import logoEmblema from "../../assets/img/logo-emblema.png";
import { GuiaClase, porRevisar, statsCurso } from "./comunes.jsx";
import { usePortal } from "./PortalContexto.jsx";

export function InicioDocente() {
  const { modelo: D } = useDatos();
  const { s, navegar, abrirCalificar, abrirFormActividad } = usePortal();
  const cursos = D.cursosDeDocente(s.nombre), acts = D.actividadesDeDocente(s.nombre), pr = porRevisar(D, s.nombre);
  const estudiantes = new Set(cursos.flatMap((c) => D.estudiantesDeCurso(c.id).map((e) => e.correo))).size;
  return (
    <>
      <div className="bienvenida" data-guia="bienvenida">
        <div>
          <span className="eyebrow">{`Docente · ${s.especialidad || ""}`}</span>
          <h1>{`¡Hola, profe ${(s.nombre || "").split(" ")[0]}! 👋`}</h1>
          <p>{pr.length ? <>Tienes <strong>{pr.length}</strong>{` ${pr.length === 1 ? "entrega" : "entregas"} esperando tu retroalimentación.`}</> : "No hay entregas pendientes por revisar."}</p>
        </div>
        <img src={logoEmblema} alt="" width="150" height="112" className="bienvenida-arte" />
      </div>
      <dl className="kpis" data-guia="kpis">
        <div className="kpi"><dt><Icono nombre="libro" tam={18} /> Cursos que dictas</dt><dd>{cursos.length}</dd></div>
        <div className="kpi"><dt><Icono nombre="usuarios" tam={18} /> Estudiantes</dt><dd>{estudiantes}</dd></div>
        <div className="kpi"><dt><Icono nombre="portapapeles" tam={18} /> Actividades</dt><dd>{acts.length}</dd></div>
        <div className="kpi"><dt><Icono nombre="check" tam={18} /> Por revisar</dt><dd>{pr.length}</dd></div>
      </dl>
      <div className="grid-2">
        <article className="tarjeta" data-guia="revisar">
          <h2 className="tarjeta-titulo"><Icono nombre="check" tam={18} /> Por revisar</h2>
          {pr.length ? (
            <>
              <ul className="lista-filas">
                {pr.slice(0, 5).map((e) => (
                  <li key={e.id}><span className="avatar avatar-sm">{iniciales(e.nombre)}</span><span><strong>{e.nombre}</strong><small>{`${e.actividad.titulo} · ${fecha(e.creado)}`}</small></span><button type="button" className="btn btn-outline btn-sm" onClick={() => abrirCalificar(e.id)}>Revisar</button></li>
                ))}
              </ul>
              {pr.length > 5 && <button type="button" className="btn-texto-plano" onClick={() => navegar("entregas")}>{`Ver las ${pr.length}`}</button>}
            </>
          ) : <Vacio icono="check" titulo="¡Todo revisado!" texto="Cuando tus estudiantes entreguen, aparecerán aquí." />}
        </article>
        <article className="tarjeta guia-didactica" data-guia="guia">
          <h2 className="tarjeta-titulo"><Icono nombre="foco" tam={18} /> Cómo crear una buena actividad</h2>
          <ol className="pasos-mini">
            <li><strong>Un objetivo claro.</strong> Empieza con “Al terminar, podrás…”.</li>
            <li><strong>Instrucciones numeradas.</strong> Un verbo por paso: escribe, crea, explica.</li>
            <li><strong>Conexión con su realidad.</strong> Ejemplos del Caribe y de su barrio.</li>
            <li><strong>Retroalimentación útil.</strong> Qué hizo bien, qué mejorar y un siguiente paso.</li>
          </ol>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirFormActividad({})}><Icono nombre="mas" tam={16} /> Crear actividad</button>
        </article>
      </div>
      <article className="tarjeta" data-guia="cursos-resumen">
        <h2 className="tarjeta-titulo"><Icono nombre="libro" tam={18} /> Tus cursos de un vistazo</h2>
        <div className="grid-cursos-mini">
          {cursos.length ? cursos.map((c) => {
            const st = statsCurso(D, c);
            return (
              <button type="button" className="curso-mini" key={c.id} onClick={() => navegar("cursos")}>
                <span className="tag">{c.area}</span><strong>{c.titulo}</strong><small>{`${st.estudiantes} estudiantes · ${st.actividades} actividades`}</small>
                <Barra pct={st.cumplimiento} etiqueta="Cumplimiento de entregas" /><small>{`${st.cumplimiento}% de entregas recibidas`}</small>
              </button>
            );
          }) : <p>No tienes cursos asignados.</p>}
        </div>
      </article>
    </>
  );
}

export function CursosDocente() {
  const { modelo: D } = useDatos();
  const { s, navegar, abrirFormActividad, verEntregas } = usePortal();
  const cursos = D.cursosDeDocente(s.nombre);
  return (
    <>
      <EncabezadoSeccion eyebrow="Tus grupos" titulo="Mis cursos" texto="Cada curso tiene sus fichas (grupos) y está dividido en módulos. Publica actividades por módulo y para una ficha o para todas." />
      <div className="lista-cursos-portal">
        {cursos.length ? cursos.map((c) => {
          const st = statsCurso(D, c), acts = D.actividadesDeCurso(c.id), fichas = D.fichasDeCurso(c.id);
          return (
            <article className="tarjeta curso-portal curso-portal-ancho" key={c.id}>
              <div className="curso-portal-top"><span className="tag">{c.area}</span><span className="tag">{c.modalidad}</span><span className={`tag ${c.fase === "Lanzamiento" ? "tag-lanzamiento" : ""}`}>{c.fase}</span></div>
              <h2>{c.titulo}</h2>
              <div className="mini-kpis"><span><strong>{st.estudiantes}</strong> estudiantes</span><span><strong>{st.actividades}</strong> actividades</span><span><strong>{st.promedio == null ? "—" : st.promedio.toFixed(1)}</strong> promedio</span></div>
              <Barra pct={st.cumplimiento} etiqueta="Entregas recibidas" /><small className="form-ayuda">{`${st.cumplimiento}% de entregas recibidas`}</small>
              <p className="mod-av-sub">Fichas</p>
              <div className="fichas-docente">
                {fichas.length ? fichas.map((f) => (
                  <button type="button" className="ficha-boton" key={f.numero} onClick={() => navegar("estudiantes", { ficha: f.numero })}>
                    <strong>{f.numero}</strong><small>{`${f.jornada} · ${D.estudiantesDeCurso(c.id, f.numero).length} est.`}</small><span className="ficha-estado">{f.estado}</span>
                  </button>
                )) : <p className="form-ayuda">Este curso aún no tiene fichas.</p>}
              </div>
              <p className="mod-av-sub">Módulos</p>
              <div className="modulos-avance">
                {D.modulos(c).map((m) => {
                  const delModulo = acts.filter((a) => Number(a.modulo || 1) === m.numero);
                  const nueva = (e) => { e.preventDefault(); e.stopPropagation(); abrirFormActividad({ cursoId: c.id, modulo: m.numero }); };
                  return (
                    <details className="mod-av" key={m.numero}>
                      <summary>
                        <span className="mod-av-num"><span>{m.numero}</span></span>
                        <span className="mod-av-info"><strong>{m.titulo}</strong><small>{`${m.temas.length} temas · ${delModulo.length} ${delModulo.length === 1 ? "actividad publicada" : "actividades publicadas"}`}</small></span>
                        <span className="btn btn-outline btn-sm" role="button" tabIndex="0" onClick={nueva} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") nueva(e); }}><Icono nombre="mas" tam={14} /> Actividad</span>
                      </summary>
                      <div className="mod-av-cuerpo">
                        {m.temas.length > 0 && <ul className="temas-chips">{m.temas.map((t) => <li key={t}>{t}</li>)}</ul>}
                        {m.actividades.length > 0 && <><p className="mod-av-sub">Actividad del plan</p><ul className="modulo-acts">{m.actividades.map((t) => <li key={t}>{t}</li>)}</ul></>}
                        {m.evidencia && <p className="modulo-evidencia"><strong>Evidencia:</strong> {m.evidencia}</p>}
                        <GuiaClase curso={c} modulo={m} />
                        <p className="mod-av-sub">Actividades publicadas</p>
                        {delModulo.length ? (
                          <ul className="lista-filas mod-av-acts">
                            {delModulo.map((a) => (
                              <li key={a.id}><TipoIcono tipo={a.tipo} /><span><strong>{a.titulo}</strong><small>{`${textoFicha(a.ficha)} · ${fecha(a.fecha_limite)} · ${D.entregasDeActividad(a.id).length}/${D.destinatarios(a).length} entregas`}</small></span>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => verEntregas(a.id)}>Entregas</button></li>
                            ))}
                          </ul>
                        ) : <p className="form-ayuda">Sin actividades publicadas en este módulo.</p>}
                      </div>
                    </details>
                  );
                })}
              </div>
              <p className="proyecto-linea"><Icono nombre="cohete" tam={16} /> <span><strong>Proyecto final:</strong> {c.proyecto || "Por definir"}</span></p>
              <div className="fila-botones">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirFormActividad({ cursoId: c.id })}><Icono nombre="mas" tam={16} /> Nueva actividad</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => navegar("estudiantes", { ficha: fichas[0]?.numero || "" })}>Seguimiento</button>
              </div>
            </article>
          );
        }) : <Vacio icono="libro" titulo="Sin cursos asignados" texto="Pide a coordinación académica que te asigne un curso." />}
      </div>
    </>
  );
}

export function ActividadesDocente() {
  const { modelo: D, acciones } = useDatos();
  const { s, filtros, setFiltros, abrirFormActividad, verEntregas } = usePortal();
  const cursos = D.cursosDeDocente(s.nombre);
  const lista = D.actividadesDeDocente(s.nombre)
    .filter((a) => (!filtros.curso || String(a.curso_id) === filtros.curso) && (!filtros.ficha || (Number(D.ficha(filtros.ficha)?.curso_id) === Number(a.curso_id) && D.llegaA(a, filtros.ficha))))
    .sort((a, b) => String(b.creado || "").localeCompare(String(a.creado || "")));
  const eliminar = (a) => acciones.eliminarActividad(a.id).then(() => toast("Actividad eliminada"), (error) => toast(error.message, "error"));
  return (
    <>
      <EncabezadoSeccion eyebrow="Lo que dejas a tus grupos" titulo="Actividades" texto="Publica actividades por módulo, para una ficha o para todas las fichas del curso.">
        <button type="button" className="btn btn-primary" data-guia="nueva" onClick={() => abrirFormActividad({})}><Icono nombre="mas" tam={18} /> Nueva actividad</button>
      </EncabezadoSeccion>
      <div className="filtros-barra">
        <label className="select-mini"><span className="sr-only">Curso</span>
          <select value={filtros.curso} onChange={(e) => setFiltros({ curso: e.target.value })}>
            <option value="">Todos mis cursos</option>
            {cursos.map((c) => <option key={c.id} value={String(c.id)}>{c.titulo}</option>)}
          </select>
        </label>
        <label className="select-mini"><span className="sr-only">Ficha</span>
          <select value={filtros.ficha} onChange={(e) => setFiltros({ ficha: e.target.value })}>
            <option value="">Todas las fichas</option>
            {D.fichasDeDocente(s.nombre).map((f) => <option key={f.numero} value={f.numero}>{`Ficha ${f.numero} · ${D.curso(f.curso_id)?.titulo || ""}`}</option>)}
          </select>
        </label>
      </div>
      <div className="lista-actividades" id="lista-actividades">
        {lista.length ? lista.map((a) => {
          const total = D.destinatarios(a).length, ent = D.entregasDeActividad(a.id), rev = ent.filter((e) => e.estado === "revisada").length;
          const pct = total ? Math.min(100, Math.round((ent.length / total) * 100)) : 0, dias = D.diasRestantes(a.fecha_limite);
          return (
            <article className="tarjeta act-docente" key={a.id}>
              <TipoIcono tipo={a.tipo} />
              <div className="act-docente-info">
                <span className="act-curso">{`${D.curso(a.curso_id)?.titulo || ""} · ${a.tipo}${etiquetaModulo(a)} · ${textoFicha(a.ficha)}`}</span>
                <h3>{a.titulo}</h3>
                <p className={`act-vence ${dias < 0 ? "" : dias <= 2 ? "is-urgente" : ""}`}><Icono nombre="calendario" tam={14} />{` ${fecha(a.fecha_limite)} · ${D.textoVence(a.fecha_limite)}`}</p>
              </div>
              <div className="act-docente-progreso"><small>{`${ent.length}/${total} entregas · ${rev} calificadas`}</small><Barra pct={pct} etiqueta="Entregas recibidas" /></div>
              <div className="fila-botones">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => verEntregas(a.id)}><Icono nombre="ojo" tam={15} /> Entregas</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => abrirFormActividad({ actividad: a })}><Icono nombre="editar" tam={15} /> Editar</button>
                <BotonDosToques className="btn btn-outline btn-sm btn-peligro" aria-label={`Eliminar ${a.titulo}`} alConfirmar={() => eliminar(a)}><Icono nombre="basura" tam={15} /></BotonDosToques>
              </div>
            </article>
          );
        }) : (
          <Vacio icono="lapiz" titulo="Aún no has publicado actividades" texto="Crea la primera: usa una plantilla y estará lista en un minuto.">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirFormActividad({})}><Icono nombre="mas" tam={16} /> Crear actividad</button>
          </Vacio>
        )}
      </div>
    </>
  );
}

export function Entregas() {
  const { modelo: D } = useDatos();
  const { s, filtros, setFiltros, abrirCalificar } = usePortal();
  const acts = D.actividadesDeDocente(s.nombre), mapa = new Map(acts.map((a) => [String(a.id), a]));
  const lista = D.entregas().filter((e) => mapa.has(String(e.actividad_id)) && (!filtros.actividad || String(e.actividad_id) === filtros.actividad) && (!filtros.estadoEntrega || e.estado === filtros.estadoEntrega))
    .sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  return (
    <>
      <EncabezadoSeccion eyebrow="Retroalimenta" titulo="Entregas" texto="Revisa el trabajo de tus estudiantes y califica de 1.0 a 5.0 con un comentario." />
      <div className="filtros-barra">
        <div className="chips-filtro">
          {[["entregada", "Por revisar"], ["revisada", "Calificadas"], ["", "Todas"]].map(([v, t]) => (
            <button type="button" key={v || "todas"} className={`chip-filtro ${v === filtros.estadoEntrega ? "activo" : ""}`} onClick={() => setFiltros({ estadoEntrega: v })}>{t}</button>
          ))}
        </div>
        <label className="select-mini"><span className="sr-only">Actividad</span>
          <select value={filtros.actividad} onChange={(e) => setFiltros({ actividad: e.target.value })}>
            <option value="">Todas las actividades</option>
            {acts.map((a) => <option key={a.id} value={String(a.id)}>{a.titulo}</option>)}
          </select>
        </label>
      </div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>Estudiante</th><th>Actividad</th><th>Entregada</th><th>Estado</th><th>Nota</th><th><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>
            {lista.length ? lista.map((e) => {
              const a = mapa.get(String(e.actividad_id));
              return (
                <tr key={e.id}>
                  <td><span className="celda-persona"><span className="avatar avatar-sm">{iniciales(e.nombre)}</span><span>{e.nombre}<br /><small>{`Ficha ${D.fichaDe(e.correo, a.curso_id)}`}</small></span></span></td>
                  <td>{a.titulo}<br /><small>{(D.curso(a.curso_id)?.titulo || "") + etiquetaModulo(a)}</small></td>
                  <td>{fecha(e.creado)}</td>
                  <td><Pill estado={e.estado} /></td>
                  <td><span className={`nota-chip ${colorNota(e.nota)}`}>{nota(e.nota)}</span></td>
                  <td><button type="button" className={`btn ${e.estado === "entregada" ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => abrirCalificar(e.id)}>{e.estado === "entregada" ? "Calificar" : "Ver"}</button></td>
                </tr>
              );
            }) : <tr><td colSpan="6">{filtros.estadoEntrega === "entregada" ? "🎉 No hay entregas por revisar." : "No hay entregas con este filtro."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* Seguimiento: avance de cada estudiante por módulo, ficha por ficha */
export function Seguimiento() {
  const { modelo: D } = useDatos();
  const { s, filtros, setFiltros, abrirSeguimiento } = usePortal();
  const fichas = D.fichasDeDocente(s.nombre);
  const [busqueda, setBusqueda] = useState("");
  const numero = fichas.some((f) => f.numero === filtros.ficha) ? filtros.ficha : (fichas.find((f) => D.estudiantesDeFicha(f.numero).length) || fichas[0])?.numero || "";
  const f = D.ficha(numero);
  const buscar = (valor) => {
    setBusqueda(valor);
    const q = valor.replace(/\D/g, ""); if (!q) return;
    const encontrada = fichas.find((x) => x.numero.startsWith(q)); if (encontrada) setFiltros({ ficha: encontrada.numero });
  };

  let tabla;
  if (!f) tabla = <Vacio icono="usuarios" titulo="Sin fichas" texto="Cuando coordinación te asigne una ficha, aparecerá aquí." />;
  else {
    const c = D.curso(f.curso_id), mods = D.modulos(c), est = D.estudiantesDeFicha(f.numero);
    const filas = est.map((e) => ({ e, p: D.progreso(e.correo, c.id), m: D.progresoModulos(e.correo, c.id) }));
    const alerta = (p) => p.total && (p.porcentaje < 50 || (p.promedio != null && p.promedio < 3));
    const grupo = mods.map((_, i) => { const con = filas.filter((x) => x.m[i].total); return con.length ? Math.round(con.reduce((n, x) => n + x.m[i].porcentaje, 0) / con.length) : null; });
    tabla = (
      <article className="tarjeta">
        <div className="seguimiento-cabecera">
          <div><span className="eyebrow">{`Ficha ${f.numero} · ${f.jornada} · ${f.estado}`}</span><h2 className="tarjeta-titulo"><Icono nombre="libro" tam={18} />{" " + c.titulo}</h2></div>
          <div className="mini-kpis"><span><strong>{est.length}</strong> estudiantes</span><span><strong>{mods.length}</strong> módulos</span><span><strong>{filas.filter((x) => alerta(x.p)).length}</strong> 🔔</span></div>
        </div>
        {est.length ? (
          <>
            <div className="tabla-wrap">
              <table className="tabla tabla-seguimiento">
                <thead><tr><th>Estudiante</th>{mods.map((m) => <th className="th-mod" title={m.titulo} key={m.numero}><span>{`M${m.numero}`}</span><small>{m.titulo}</small></th>)}<th>Total</th><th>Promedio</th><th>Estado</th></tr></thead>
                <tbody>
                  {filas.map(({ e, p, m }) => (
                    <tr key={e.correo}>
                      <td><button type="button" className="celda-persona persona-boton" onClick={() => abrirSeguimiento(e.correo, c.id)}><span className="avatar avatar-sm">{iniciales(e.nombre)}</span><span>{e.nombre}<br /><small>Ver detalle</small></span></button></td>
                      {m.map((x) => (
                        <td key={x.numero}>
                          <button type="button" className={`celda-mod mod-${x.estado}`} style={x.estado === "sin-actividades" ? undefined : { "--pct": x.porcentaje }} onClick={() => abrirSeguimiento(e.correo, c.id, x.numero)}
                            title={`Módulo ${x.numero}: ${x.total ? `${x.hechas}/${x.total} entregas` : "sin actividades"}${x.promedio != null ? ` · promedio ${x.promedio.toFixed(1)}` : ""}`}>
                            {x.total ? <><strong>{`${x.porcentaje}%`}</strong><small>{`${x.hechas}/${x.total}`}</small></> : "—"}
                          </button>
                        </td>
                      ))}
                      <td><div className="celda-progreso"><Barra pct={p.porcentaje} etiqueta="Avance total" /><small>{`${p.porcentaje}%`}</small></div></td>
                      <td><span className={`nota-chip ${colorNota(p.promedio)}`}>{p.promedio == null ? "—" : p.promedio.toFixed(1)}</span></td>
                      <td>{alerta(p) ? <span className="pill pill-pendiente">🔔 Necesita apoyo</span> : p.total ? <span className="pill pill-ok">Al día</span> : <span className="pill pill-gris">Sin actividades</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><th scope="row">Promedio del grupo</th>{grupo.map((g, i) => <td key={i}>{g == null ? "—" : <span className="grupo-pct">{`${g}%`}</span>}</td>)}<td colSpan="3"></td></tr></tfoot>
              </table>
            </div>
            <p className="leyenda-mod"><span className="mod-completo">Completo</span><span className="mod-en-curso">En curso</span><span className="mod-sin-iniciar">Sin iniciar</span><span className="mod-sin-actividades">Sin actividades</span></p>
          </>
        ) : <p>Aún no hay estudiantes aprobados en esta ficha.</p>}
      </article>
    );
  }

  return (
    <>
      <EncabezadoSeccion eyebrow="Acompaña a cada persona" titulo="Seguimiento por módulos" texto="Elige una ficha para ver cuánto ha avanzado cada estudiante en cada módulo. Toca un estudiante para ver el detalle. 🔔 marca a quien podría necesitar apoyo." />
      <div className="filtros-barra seguimiento-filtros">
        <div className="chips-filtro chips-fichas" role="tablist" aria-label="Fichas">
          {fichas.map((x) => (
            <button type="button" role="tab" key={x.numero} className={`chip-filtro ${x.numero === numero ? "activo" : ""}`} aria-selected={x.numero === numero} onClick={() => setFiltros({ ficha: x.numero })}>
              {x.numero + " "}<small>{D.curso(x.curso_id)?.titulo || ""}</small>
            </button>
          ))}
        </div>
        <label className="buscar-ficha"><span className="sr-only">Buscar ficha</span><Icono nombre="buscar" tam={16} /><input type="search" inputMode="numeric" maxLength="6" placeholder="Buscar n.º de ficha" value={busqueda} onChange={(e) => buscar(e.target.value)} /></label>
      </div>
      <div id="seguimiento-tabla">{tabla}</div>
    </>
  );
}
