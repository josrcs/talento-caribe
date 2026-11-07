/* ==========================================================
   Cuentas.jsx - Administración de cuentas
   Gerente: crea cuentas administrativas (contraseña temporal que se muestra una vez) y las elimina.
   Gerente y Coordinación de admisiones: bloquean estudiantes inactivos y los desbloquean cuando quieran.
   Todo lo valida el servidor (backend/src/rutas/cuentas.js).
   ========================================================== */
import { useCallback, useEffect, useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import { pedir } from "../../lib/api.js";
import { confirmar, toast } from "../../lib/utils.js";
import { FilaVacia, fechaLarga, intentar } from "./comunes.jsx";
import { CARGOS } from "./perfiles.js";
import { usePanel } from "./PanelContexto.jsx";

function Equipo() {
  const [equipo, setEquipo] = useState(null); // lista o { error }
  const [creada, setCreada] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const cargar = useCallback(async () => {
    try { setEquipo(await pedir("GET", "/cuentas/equipo")); } catch (error) { setEquipo({ error: error.message }); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  async function crear(e) {
    e.preventDefault(); const f = e.currentTarget; if (!f.reportValidity()) return;
    const datos = { nombre: f.elements.nombre.value.trim(), correo: f.elements.correo.value.trim().toLowerCase(), puesto: f.elements.puesto.value };
    let r = null;
    if (!(await intentar(async () => { r = await pedir("POST", "/cuentas/equipo", datos); }, setOcupado))) return;
    f.reset(); setCreada(r); toast("Cuenta creada"); cargar();
  }
  async function eliminar(u) {
    if (!(await confirmar({ titulo: "¿Eliminar la cuenta de " + u.nombre + "?", mensaje: "Cargo: " + (u.puesto || "cuenta de prueba") + ". Ya no podrá ingresar al panel. Esta acción no se puede deshacer.", aceptar: "Eliminar cuenta", peligro: true }))) return;
    if (await intentar(() => pedir("DELETE", "/cuentas/equipo/" + u.id))) { toast("Cuenta eliminada"); cargar(); }
  }
  const copiar = () => navigator.clipboard?.writeText(creada.clave).then(() => toast("Contraseña copiada"), () => toast("No se pudo copiar: selecciónala y cópiala a mano.", "error"));
  return (
    <div id="cuentas-equipo">
      <h2 className="subtitulo">Equipo administrativo</h2>
      <p className="seccion-texto">Crea la cuenta de cada persona del equipo con su cargo. La plataforma genera una contraseña temporal que se muestra una sola vez: compártela en privado y pide que la cambien en «Mi cuenta».</p>
      <form className="form tarjeta" noValidate onSubmit={crear}>
        <div className="fila-campos">
          <div className="campo"><label htmlFor="ce-nombre">Nombre completo</label><input id="ce-nombre" name="nombre" required minLength="3" maxLength="100" autoComplete="off" /></div>
          <div className="campo"><label htmlFor="ce-correo">Correo</label><input id="ce-correo" name="correo" type="email" required maxLength="120" autoComplete="off" placeholder="nombre@talentocaribe.co" /></div>
          <div className="campo"><label htmlFor="ce-cargo">Cargo</label><select id="ce-cargo" name="puesto" required>{CARGOS.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={ocupado}>Crear cuenta</button>
      </form>
      {creada && (
        <div className="clave-temporal" role="status">
          <strong>{"Cuenta creada para " + creada.cuenta.nombre}</strong>
          <p>Contraseña temporal (no se vuelve a mostrar):</p>
          <div className="clave-temporal-valor"><code data-no-traducir>{creada.clave}</code><button type="button" className="btn btn-outline btn-sm" onClick={copiar}>Copiar</button></div>
          <small>{`Para entrar: ${creada.cuenta.correo}, cuenta «Administrativo» y cargo «${creada.cuenta.puesto}». Compártela en privado y pide que la cambie en «Mi cuenta».`}</small>
        </div>
      )}
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Persona</th><th scope="col">Cargo</th><th scope="col">Último ingreso</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {!equipo ? <FilaVacia columnas={5}>Cargando…</FilaVacia>
              : equipo.error ? <FilaVacia columnas={5}>{equipo.error}</FilaVacia>
              : equipo.length ? equipo.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong>{u.yo && <>{" "}<span className="tag">Tú</span></>}<br /><small>{u.correo}</small></td>
                  <td>{u.puesto || <span className="form-ayuda">Cuenta de prueba: elige el cargo al ingresar</span>}</td>
                  <td>{u.ultimo_ingreso ? fechaLarga(u.ultimo_ingreso) : "Nunca"}</td>
                  <td><span className={"pill " + (u.activo ? "pill-ok" : "pill-no")}>{u.activo ? "Activa" : "Desactivada"}</span></td>
                  <td>{!u.yo && <button type="button" className="btn btn-outline btn-sm btn-peligro" onClick={() => eliminar(u)}>Eliminar</button>}</td>
                </tr>
              )) : <FilaVacia columnas={5}>No hay cuentas administrativas.</FilaVacia>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// La inactividad se cuenta desde lo más reciente: el último ingreso, la creación de la cuenta o el último desbloqueo
const tiempoSinUso = (u) => {
  const n = u.dias_sin_uso, cuando = n <= 0 ? "hoy" : "hace " + n + (n === 1 ? " día" : " días");
  return u.desde === "desbloqueo" ? "Desbloqueada " + cuando : u.desde === "creacion" ? "Creada " + cuando + ", sin ingresar" : n <= 0 ? "Usada hoy" : "Sin uso desde " + cuando;
};
function Estudiantes() {
  const [datos, setDatos] = useState(null); // { estudiantes, diasMinimos } o { error }
  const [mostrar, setMostrar] = useState("inactivas");
  const [dias, setDias] = useState(30);
  const [buscar, setBuscar] = useState("");
  const cargar = useCallback(async () => {
    try { setDatos(await pedir("GET", "/cuentas/estudiantes")); } catch (error) { setDatos({ error: error.message }); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const lista = datos?.estudiantes || [];
  const inactiva = (u) => u.activo && u.dias_sin_uso >= dias;
  const inactivas = lista.filter(inactiva), bloqueadas = lista.filter((u) => !u.activo), q = buscar.trim().toLowerCase();
  const visibles = lista.filter((u) => (mostrar === "inactivas" ? inactiva(u) : mostrar === "bloqueadas" ? !u.activo : mostrar === "activas" ? u.activo : true) && (!q || (u.nombre + " " + u.correo).toLowerCase().includes(q)));

  async function bloquear(u) {
    if (!(await confirmar({ titulo: "¿Bloquear la cuenta de " + u.nombre + "?", mensaje: "No podrá ingresar hasta que la desbloquees. Sus cursos y entregas se conservan y recibirá un correo.", aceptar: "Bloquear cuenta", peligro: true }))) return;
    if (await intentar(() => pedir("POST", "/cuentas/estudiantes/" + u.id + "/bloquear"))) { toast("Cuenta bloqueada"); cargar(); }
  }
  async function desbloquear(u) {
    if (await intentar(() => pedir("POST", "/cuentas/estudiantes/" + u.id + "/desbloquear"))) { toast("Cuenta desbloqueada"); cargar(); }
  }
  async function bloquearTodas() {
    const n = inactivas.length;
    if (!n || !(await confirmar({ titulo: n === 1 ? "¿Bloquear 1 cuenta inactiva?" : "¿Bloquear " + n + " cuentas inactivas?", mensaje: "Son las que no ingresan hace " + dias + " días o más. Cada estudiante recibirá un correo y podrás desbloquearlas cuando quieras.", aceptar: "Bloquear", peligro: true }))) return;
    let r = null;
    if (await intentar(async () => { r = await pedir("POST", "/cuentas/estudiantes/bloquear-inactivas", { dias }); })) { toast(r.bloqueadas === 1 ? "1 cuenta bloqueada" : r.bloqueadas + " cuentas bloqueadas"); cargar(); }
  }
  const kpis = [["usuarios", "Estudiantes", lista.length], ["reloj", `Inactivas (${dias}+ días)`, inactivas.length], ["escudo", "Bloqueadas", bloqueadas.length]];
  return (
    <div id="cuentas-estudiantes">
      <h2 className="subtitulo">Cuentas de estudiantes</h2>
      <p className="seccion-texto">Una cuenta inactiva es la que no ingresa hace 30 días o más. Al bloquearla no puede entrar y sus sesiones se cierran; sus cursos y entregas se conservan. Puedes desbloquearla en cualquier momento.</p>
      <dl className="kpis">{kpis.map(([i, t, v]) => <div className="kpi" key={i}><dt><Icono nombre={i} tam={18} />{" " + t}</dt><dd>{v}</dd></div>)}</dl>
      <div className="seguridad-filtros">
        <div className="campo"><label htmlFor="ce-mostrar">Mostrar</label><select id="ce-mostrar" value={mostrar} onChange={(e) => setMostrar(e.target.value)}><option value="inactivas">Inactivas</option><option value="bloqueadas">Bloqueadas</option><option value="activas">Activas</option><option value="">Todas</option></select></div>
        <div className="campo"><label htmlFor="ce-dias">Sin ingresar hace</label><select id="ce-dias" value={dias} onChange={(e) => setDias(Number(e.target.value))}>{[30, 60, 90, 180].map((d) => <option key={d} value={d}>{`${d} días o más`}</option>)}</select></div>
        <div className="campo"><label htmlFor="ce-buscar">Buscar</label><input id="ce-buscar" type="search" placeholder="Nombre o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
        <button type="button" className="btn btn-outline btn-peligro" disabled={!inactivas.length} onClick={bloquearTodas}>{inactivas.length ? "Bloquear " + inactivas.length + (inactivas.length === 1 ? " cuenta inactiva" : " cuentas inactivas") : "Sin cuentas inactivas"}</button>
      </div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Estudiante</th><th scope="col">Último ingreso</th><th scope="col">Cursos aprobados</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {!datos ? <FilaVacia columnas={5}>Cargando…</FilaVacia>
              : datos.error ? <FilaVacia columnas={5}>{datos.error}</FilaVacia>
              : visibles.length ? visibles.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong><br /><small>{u.correo}</small></td>
                  <td>{u.ultimo_ingreso ? fechaLarga(u.ultimo_ingreso) : "Nunca ha ingresado"}<br /><small>{tiempoSinUso(u)}</small></td>
                  <td>{u.cursos}</td>
                  <td>{!u.activo ? <><span className="pill pill-no">Bloqueada</span>{u.bloqueado_en && <><br /><small>{fechaLarga(u.bloqueado_en) + (u.bloqueado_por ? " · " + u.bloqueado_por : "")}</small></>}</>
                    : inactiva(u) ? <span className="pill pill-pendiente">Inactiva</span> : <span className="pill pill-ok">Activa</span>}</td>
                  <td>{!u.activo ? <button type="button" className="btn btn-primary btn-sm" onClick={() => desbloquear(u)}>Desbloquear</button>
                    : u.dias_sin_uso >= datos.diasMinimos ? <button type="button" className="btn btn-outline btn-sm btn-peligro" onClick={() => bloquear(u)}>Bloquear</button> : null}</td>
                </tr>
              )) : <FilaVacia columnas={5}>{mostrar === "inactivas" ? `No hay cuentas sin ingresar hace ${dias} días o más.` : mostrar === "bloqueadas" ? "No hay cuentas bloqueadas." : "No hay estudiantes con esos filtros."}</FilaVacia>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Cuentas() {
  const { perfil } = usePanel();
  return (
    <>
      <div className="seccion-cabecera"><div><span className="eyebrow">ADMINISTRACIÓN DE CUENTAS</span><h1 id="t-cuentas">Cuentas</h1>
        <p className="seccion-texto">{perfil.gestionaEquipo ? "Crea y elimina las cuentas del equipo administrativo, y bloquea o desbloquea las cuentas de estudiantes inactivos." : "Bloquea las cuentas de estudiantes que llevan tiempo sin ingresar y desbloquéalas cuando lo necesiten."}</p></div></div>
      {perfil.gestionaEquipo && <Equipo />}
      {perfil.gestionaEstudiantes && <Estudiantes />}
    </>
  );
}
