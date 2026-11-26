/* ==========================================================
   Seguimiento.jsx - Monitoría: el avance de los jóvenes de la ruta
   La ven el cargo Monitor(a) y el Director(a) general (permiso "seguimiento").
   - Cifras: jóvenes en la ruta, quiénes necesitan apoyo, sin contacto reciente.
   - Cada joven: módulo en el que va, entregas, promedio, último ingreso, alertas,
     botones para escribirle por WhatsApp o correo (a él o a su acudiente) y el
     historial de contactos del equipo.
   - Sus actividades: cuáles entregó (con la respuesta, el enlace, la nota y el comentario)
     y cuáles le faltan, marcando las vencidas.
   - "Registrar contacto" guarda una nota (POST /api/seguimiento/:id/contactos).
   Los datos llegan de GET /api/seguimiento (no de /api/datos: solo este permiso los ve).
   ========================================================== */
import { useEffect, useMemo, useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import Modal from "../../componentes/Modal.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { Barra } from "../../componentes/app/ui.jsx";
import { pedir } from "../../lib/api.js";
import { edadDe, toast } from "../../lib/utils.js";
import { PILOTO, pasoDeRuta } from "../../lib/piloto.js";
import { fechaHora } from "./comunes.jsx";

const TIPOS = ["WhatsApp", "Llamada", "Correo", "Presencial", "Otro"];
const DIA = 86400000;
const diasDesde = (fecha) => (fecha ? Math.floor((Date.now() - new Date(fecha).getTime()) / DIA) : null);
const haceDias = (n) => (n === null ? "Nunca" : n === 0 ? "Hoy" : n === 1 ? "Ayer" : `Hace ${n} días`);
/* Número para WhatsApp: solo dígitos y, si es un celular colombiano de 10 dígitos, con el 57 adelante */
const whatsapp = (tel) => { const d = String(tel || "").replace(/\D/g, ""); return d.length === 10 && d.startsWith("3") ? "57" + d : d; };
const iniciales = (nombre) => String(nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

/* Lo que el equipo debería mirar de cada joven */
function alertasDe(e) {
  const lista = [], ingreso = diasDesde(e.ultimo_ingreso), contacto = diasDesde(e.contactos[0]?.creado_en);
  if (!e.activo || e.bloqueado_en) lista.push(["Cuenta bloqueada", "no"]);
  if (ingreso === null) lista.push(["Nunca ha entrado", "no"]);
  else if (ingreso > 14) lista.push([`Sin entrar hace ${ingreso} días`, "no"]);
  const pendientes = Math.max(0, e.actividades - e.entregadas);
  if (pendientes >= 2) lista.push([`${pendientes} entregas pendientes`, "pendiente"]);
  if (e.promedio !== null && e.promedio < 3) lista.push([`Promedio ${e.promedio.toFixed(1)}`, "no"]);
  if (contacto === null || contacto > 14) lista.push([contacto === null ? "Sin contactar" : `Último contacto hace ${contacto} días`, "pendiente"]);
  return lista;
}
/* El módulo más avanzado de la ruta en el que tiene cupo */
function moduloActual(e) {
  const pasos = e.modulos.map((m) => ({ ...m, paso: pasoDeRuta(m) })).filter((m) => m.paso >= 0).sort((a, b) => b.paso - a.paso);
  return pasos[0] || e.modulos[0] || null;
}

function RegistrarContacto({ estudiante, alCerrar, alGuardar }) {
  const [tipo, setTipo] = useState("WhatsApp");
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function guardar(ev) {
    ev.preventDefault();
    if (nota.trim().length < 3) { toast("Escribe una nota corta sobre el contacto.", "error"); return; }
    setOcupado(true);
    try {
      const nuevo = await pedir("POST", `/seguimiento/${estudiante.id}/contactos`, { tipo, nota: nota.trim() });
      alGuardar(estudiante.id, nuevo);
      toast("Contacto registrado");
      alCerrar();
    } catch (error) { toast(error.message || "No se pudo guardar.", "error"); }
    finally { setOcupado(false); }
  }
  return (
    <Modal abierto={Boolean(estudiante)} alCerrar={alCerrar} etiqueta="seg-contacto-titulo" id="modal-seg-contacto">
      {estudiante && (
        <form className="modal-contenido form" noValidate onSubmit={guardar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">MONITORÍA</span>
          <h2 id="seg-contacto-titulo">Registrar contacto</h2>
          <p className="modal-sub">{`Con ${estudiante.nombre} o su acudiente.`}</p>
          <fieldset className="campo">
            <legend>¿Cómo fue el contacto?</legend>
            <div className="chips-filtro" role="radiogroup">
              {TIPOS.map((t) => <button type="button" key={t} role="radio" aria-checked={tipo === t} className={"chip-filtro" + (tipo === t ? " activo" : "")} onClick={() => setTipo(t)}>{t}</button>)}
            </div>
          </fieldset>
          <div className="campo">
            <label htmlFor="seg-nota">¿Qué hablaron?</label>
            <textarea id="seg-nota" rows="4" maxLength="1000" required value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Le escribí porque no vino a la clase del sábado. Dice que estuvo enfermo y vuelve la próxima semana." />
            <small className="form-ayuda">Queda en el historial del joven. Lo ven la monitoría y la dirección general.</small>
          </div>
          <div className="modal-acciones"><BotonCarga cargando={ocupado} id="seg-guardar">Guardar contacto</BotonCarga><button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button></div>
        </form>
      )}
    </Modal>
  );
}

/* Las actividades del joven: entregadas (con su trabajo) y pendientes */
const hoy = () => new Date().toISOString().slice(0, 10);
function Tareas({ tareas }) {
  if (!tareas?.length) return <p className="seg-joven-sub">Todavía no hay actividades publicadas en sus módulos.</p>;
  const hechas = tareas.filter((t) => t.estado).length;
  return (
    <details className="seg-historial seg-tareas">
      <summary>{`Actividades: entregó ${hechas} de ${tareas.length}`}</summary>
      <ol>
        {tareas.map((t) => {
          const vencida = !t.estado && t.limite && t.limite < hoy();
          return (
            <li key={t.id}>
              <div className="seg-tarea-top">
                <strong>{t.titulo}</strong>
                {t.estado === "revisada" ? <span className={"pill " + (t.nota >= 3 ? "pill-ok" : "pill-no")}>{`Nota ${Number(t.nota).toFixed(1)}`}</span>
                  : t.estado ? <span className="pill pill-pendiente">Entregada · sin calificar</span>
                  : <span className={"pill " + (vencida ? "pill-no" : "")}>{vencida ? "Vencida" : "Pendiente"}</span>}
              </div>
              <small>{`${t.tipo} · ${t.curso} · Clase ${t.modulo}${t.limite ? " · vence " + t.limite : ""}`}</small>
              {t.estado && (
                <div className="seg-entrega">
                  {t.respuesta && <p data-no-traducir>{t.respuesta}</p>}
                  {t.enlace && <a href={t.enlace} target="_blank" rel="noopener noreferrer">Abrir lo que entregó →</a>}
                  {t.comentario && <p className="seg-comentario"><strong>Retroalimentación:</strong> <span data-no-traducir>{t.comentario}</span></p>}
                  <small>{`Entregada el ${fechaHora(t.entregada)}`}</small>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function TarjetaJoven({ e, alRegistrar }) {
  const actual = moduloActual(e);
  const paso = actual ? pasoDeRuta(actual) : -1;
  const pct = e.actividades ? Math.round((Math.min(e.entregadas, e.actividades) / e.actividades) * 100) : 0;
  const alertas = alertasDe(e);
  const edad = edadDe(e.fecha_nacimiento);
  const menor = edad !== null && edad < 18;
  const wa = whatsapp(e.telefono), waAcudiente = whatsapp(e.acudiente_telefono);
  const saludo = encodeURIComponent(`Hola, ${String(e.nombre).split(" ")[0]}. Te escribo de Talento Caribe para saber cómo vas con la ruta.`);
  return (
    <article className="tarjeta seg-joven">
      <header className="seg-joven-top">
        <span className="avatar" aria-hidden="true">{iniciales(e.nombre)}</span>
        <div>
          <h3>{e.nombre}</h3>
          <p className="seg-joven-sub">{[edad !== null ? `${edad} años` : "", e.ciudad, menor ? "Menor de edad" : ""].filter(Boolean).join(" · ")}</p>
        </div>
        <span className={"pill " + (alertas.length ? "pill-pendiente" : "pill-ok")}>{alertas.length ? "Necesita apoyo" : "Al día"}</span>
      </header>

      <div className="seg-joven-ruta">
        <p className="seg-joven-etiqueta">{paso >= 0 ? `Módulo ${paso + 1} de ${PILOTO.ruta.length}` : "Módulo"}</p>
        <p className="seg-joven-modulo">{actual ? actual.titulo : "Sin módulo"}{actual?.ficha ? <small>{` · Ficha ${actual.ficha}`}</small> : null}</p>
        <ol className="seg-pasos" aria-label="Avance en la ruta">
          {PILOTO.ruta.map((r, i) => <li key={r.titulo} className={i < paso ? "hecho" : i === paso ? "actual" : ""} title={r.corto}><span className="sr-only">{r.corto}</span></li>)}
        </ol>
      </div>

      <dl className="seg-joven-datos">
        <div><dt>Entregas</dt><dd>{e.actividades ? `${e.entregadas}/${e.actividades}` : "Sin actividades"}</dd></div>
        <div><dt>Promedio</dt><dd>{e.promedio === null ? "—" : e.promedio.toFixed(1)}</dd></div>
        <div><dt>Último ingreso</dt><dd>{haceDias(diasDesde(e.ultimo_ingreso))}</dd></div>
      </dl>
      {e.actividades > 0 && <Barra pct={pct} etiqueta={`Entregas de ${e.nombre}`} />}

      {alertas.length > 0 && <ul className="seg-alertas">{alertas.map(([t, c]) => <li key={t} className={"pill pill-" + c}>{t}</li>)}</ul>}

      <div className="seg-contacto">
        <p className="seg-joven-etiqueta">Contacto</p>
        <div className="portal-actions">
          {wa && <a className="btn btn-outline btn-sm" href={`https://wa.me/${wa}?text=${saludo}`} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" tam={15} /> WhatsApp</a>}
          {e.correo && <a className="btn btn-outline btn-sm" href={`mailto:${e.correo}`}><Icono nombre="sobre" tam={15} /> Correo</a>}
          {waAcudiente && <a className="btn btn-outline btn-sm" href={`https://wa.me/${waAcudiente}`} target="_blank" rel="noopener noreferrer" title={e.acudiente_nombre || "Acudiente"}><Icono nombre="usuarios" tam={15} /> Acudiente</a>}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => alRegistrar(e)}><Icono nombre="mas" tam={15} /> Registrar contacto</button>
        </div>
        <p className="seg-joven-sub">{[e.telefono, e.acudiente_nombre ? `Acudiente: ${e.acudiente_nombre}${e.acudiente_telefono ? " · " + e.acudiente_telefono : ""}` : ""].filter(Boolean).join(" · ")}</p>
      </div>

      <Tareas tareas={e.tareas} />

      <details className="seg-historial">
        <summary>{e.contactos.length ? `Historial de contactos (${e.contactos.length})` : "Todavía no hay contactos registrados"}</summary>
        {e.contactos.length > 0 && (
          <ol>
            {e.contactos.map((c) => (
              <li key={c.id}><span className="pill">{c.tipo}</span> <small>{`${fechaHora(c.creado_en)} · ${c.autor}`}</small><p data-no-traducir>{c.nota}</p></li>
            ))}
          </ol>
        )}
      </details>
    </article>
  );
}

const FILTROS = [["todos", "Todos"], ["apoyo", "Necesitan apoyo"], ["sin-contacto", "Sin contacto reciente"], ["al-dia", "Al día"]];

export default function Seguimiento() {
  const [estado, setEstado] = useState({ cargando: true, error: null, estudiantes: [] });
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");
  const [registrando, setRegistrando] = useState(null);

  const cargar = () => pedir("GET", "/seguimiento")
    .then((r) => setEstado({ cargando: false, error: null, estudiantes: r.estudiantes || [] }))
    .catch((error) => setEstado((s) => ({ ...s, cargando: false, error })));
  useEffect(() => { cargar(); }, []);

  const conAlertas = useMemo(() => estado.estudiantes.map((e) => ({ e, alertas: alertasDe(e) })), [estado.estudiantes]);
  const sinContacto = (e) => { const d = diasDesde(e.contactos[0]?.creado_en); return d === null || d > 14; };
  const q = buscar.trim().toLocaleLowerCase("es");
  const lista = conAlertas.filter(({ e, alertas }) =>
    (!q || `${e.nombre} ${e.correo} ${e.telefono || ""}`.toLocaleLowerCase("es").includes(q)) &&
    (filtro === "todos" || (filtro === "apoyo" && alertas.length) || (filtro === "al-dia" && !alertas.length) || (filtro === "sin-contacto" && sinContacto(e))));
  const agregarContacto = (id, nuevo) => setEstado((s) => ({ ...s, estudiantes: s.estudiantes.map((e) => (e.id === id ? { ...e, contactos: [nuevo, ...e.contactos] } : e)) }));

  const kpis = [
    ["usuarios", "Jóvenes en la ruta", estado.estudiantes.length],
    ["campana", "Necesitan apoyo", conAlertas.filter((x) => x.alertas.length).length],
    ["reloj", "Sin contacto reciente", estado.estudiantes.filter(sinContacto).length],
    ["check", "Al día", conAlertas.filter((x) => !x.alertas.length).length],
  ];

  return (
    <>
      <div className="seccion-cabecera">
        <div>
          <span className="eyebrow">MONITORÍA</span>
          <h1 id="t-seguimiento">Seguimiento de la ruta</h1>
          <p className="seccion-texto">Cómo va cada joven de «{PILOTO.nombre}»: en qué módulo está, si entrega a tiempo y cuándo entró por última vez. Escríbele a él o a su acudiente y deja registrado cada contacto.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => { setEstado((s) => ({ ...s, cargando: true })); cargar(); }}>Actualizar</button>
      </div>

      {estado.cargando ? <div className="estado" role="status"><span className="spinner" aria-hidden="true"></span> Cargando el seguimiento...</div>
        : estado.error ? (
          <div className="estado estado-error" role="alert"><p>{estado.error.message}</p><button type="button" className="btn btn-outline" onClick={cargar}>Reintentar</button></div>
        ) : (
          <>
            <dl className="kpis">{kpis.map(([i, t, v]) => <div className="kpi" key={t}><dt><Icono nombre={i} tam={18} />{" " + t}</dt><dd>{v}</dd></div>)}</dl>
            <div className="seg-filtros">
              <div className="chips-filtro" role="tablist" aria-label="Filtrar jóvenes">
                {FILTROS.map(([id, texto]) => <button type="button" key={id} role="tab" aria-selected={filtro === id} className={"chip-filtro" + (filtro === id ? " activo" : "")} onClick={() => setFiltro(id)}>{texto}</button>)}
              </div>
              <div className="campo"><label htmlFor="seg-buscar" className="sr-only">Buscar joven</label><input id="seg-buscar" type="search" placeholder="Buscar por nombre, correo o teléfono" value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
            </div>
            {!estado.estudiantes.length ? (
              <div className="estado"><p>Todavía no hay jóvenes con cupo aprobado en la ruta. Cuando apruebes solicitudes en Inscripciones, aparecerán aquí.</p></div>
            ) : !lista.length ? (
              <div className="estado"><p>Nadie coincide con ese filtro.</p></div>
            ) : (
              <div className="seg-grid">{lista.map(({ e }) => <TarjetaJoven key={e.id} e={e} alRegistrar={setRegistrando} />)}</div>
            )}
          </>
        )}
      <RegistrarContacto key={registrando?.id || "nadie"} estudiante={registrando} alCerrar={() => setRegistrando(null)} alGuardar={agregarContacto} />
    </>
  );
}
