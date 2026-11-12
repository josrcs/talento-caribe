/* ==========================================================
   Seguridad.jsx - Registro de seguridad (GET /api/seguridad/eventos)
   Lo arma el servidor (tabla eventos_seguridad). Las conexiones con 5 o más
   fallos en 24 horas se destacan arriba como posibles ataques de fuerza bruta.
   ========================================================== */
import { useCallback, useEffect, useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import { pedir } from "../../lib/api.js";
import { FilaVacia, fechaHora } from "./comunes.jsx";

const EVENTOS = {
  ingreso: ["Ingreso", "pill-ok"], ingreso_fallido: ["Intento fallido", "pill-pendiente"], bloqueo: ["Bloqueo", "pill-no"],
  clave_cambiada: ["Contraseña cambiada", ""], recuperacion_pedida: ["Pidió recuperar la contraseña", ""], clave_restablecida: ["Contraseña restablecida", ""],
  sesiones_cerradas: ["Cerró todas sus sesiones", ""], registro: ["Cuenta nueva", "pill-ok"],
  cuenta_creada: ["Cuenta creada", "pill-ok"], cuenta_eliminada: ["Cuenta eliminada", "pill-no"], cuenta_bloqueada: ["Cuenta bloqueada", "pill-pendiente"], cuenta_desbloqueada: ["Cuenta desbloqueada", "pill-ok"],
};
const TIPOS = [["", "Todos"], ["ingreso", "Ingresos"], ["ingreso_fallido", "Intentos fallidos"], ["bloqueo", "Bloqueos"], ["clave_cambiada", "Contraseñas cambiadas"], ["cuenta_creada", "Cuentas creadas"], ["cuenta_eliminada", "Cuentas eliminadas"], ["cuenta_bloqueada", "Cuentas bloqueadas"], ["cuenta_desbloqueada", "Cuentas desbloqueadas"], ["recuperacion_pedida", "Recuperaciones pedidas"], ["clave_restablecida", "Contraseñas restablecidas"], ["sesiones_cerradas", "Sesiones cerradas"], ["registro", "Cuentas nuevas"]];

/* Cuántas conexiones sospechosas hay (para la insignia del menú) */
export const contarSospechosas = () => pedir("GET", "/seguridad/eventos?tipo=").then((r) => r.sospechosas.length, () => 0);

export default function Seguridad({ alSospechosas }) {
  const [tipo, setTipo] = useState("");
  const [datos, setDatos] = useState(null); // { eventos, resumen, sospechosas } o { error }
  const cargar = useCallback(async () => {
    setDatos(null);
    try {
      const r = await pedir("GET", "/seguridad/eventos?tipo=" + encodeURIComponent(tipo));
      setDatos(r); alSospechosas?.(r.sospechosas.length);
    } catch (error) { setDatos({ error: error.message }); }
  }, [tipo, alSospechosas]);
  useEffect(() => { cargar(); }, [cargar]);
  const n = (t) => datos?.resumen?.[t] || 0;
  const kpis = [["check", "Ingresos (24 h)", n("ingreso")], ["reloj", "Intentos fallidos (24 h)", n("ingreso_fallido") + n("bloqueo")], ["escudo", "Bloqueos (24 h)", n("bloqueo")], ["usuarios", "Cuentas nuevas (24 h)", n("registro")]];
  return (
    <>
      <div className="seccion-cabecera">
        <div><span className="eyebrow">PROTECCIÓN DE LA PLATAFORMA</span><h1 id="t-seguridad">Registro de seguridad</h1><p className="seccion-texto">Ingresos, intentos fallidos, bloqueos y cambios de contraseña de los últimos 90 días. Muchos fallos seguidos desde una misma conexión pueden ser un ataque: el servidor la bloquea 15 minutos.</p></div>
        <button type="button" className="btn btn-outline btn-sm" onClick={cargar}><span data-icono><Icono nombre="reiniciar" tam={18} /></span> Actualizar</button>
      </div>
      {datos?.resumen && <dl className="kpis">{kpis.map(([i, t, v]) => <div className="kpi" key={t}><dt><Icono nombre={i} tam={18} />{" " + t}</dt><dd>{v}</dd></div>)}</dl>}
      {datos?.sospechosas?.length > 0 && (
        <div className="seguridad-aviso" role="status">
          <Icono nombre="escudo" tam={20} />
          <div>
            <strong>Conexiones con muchos intentos fallidos en las últimas 24 horas</strong>
            <ul>{datos.sospechosas.map((x) => <li key={x.ip}>{`${x.ip}: ${x.fallos} fallos contra ${x.cuentas} cuenta(s), el último ${fechaHora(x.ultimo)}`}</li>)}</ul>
            <small>El servidor ya las frena: tras 10 fallos una conexión queda bloqueada 15 minutos, y tras 8 fallos también la cuenta atacada.</small>
          </div>
        </div>
      )}
      <div className="seguridad-filtros"><div className="campo"><label htmlFor="seguridad-tipo">Tipo de evento</label><select id="seguridad-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div></div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th scope="col">Fecha</th><th scope="col">Evento</th><th scope="col">Cuenta</th><th scope="col">Conexión (IP)</th><th scope="col">Detalle</th></tr></thead>
          <tbody>
            {!datos ? <FilaVacia columnas={5}>Cargando…</FilaVacia>
              : datos.error ? <FilaVacia columnas={5}>{datos.error}</FilaVacia>
              : datos.eventos.length ? datos.eventos.map((e, i) => {
                const [texto, clase] = EVENTOS[e.tipo] || [e.tipo, ""];
                return (
                  <tr key={e.id || i}>
                    <td>{fechaHora(e.creado)}</td><td><span className={"pill " + clase}>{texto}</span></td>
                    <td>{e.nombre && <>{e.nombre}<br /></>}<small>{e.correo || "—"}</small></td>
                    <td>{e.ip || "—"}<div className="celda-agente" title={e.agente || ""}>{e.agente || ""}</div></td>
                    <td>{e.detalle || ""}</td>
                  </tr>
                );
              }) : <FilaVacia columnas={5}>Todavía no hay eventos de este tipo.</FilaVacia>}
          </tbody>
        </table>
      </div>
    </>
  );
}
