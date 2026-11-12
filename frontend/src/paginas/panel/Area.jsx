/* Area.jsx - "Mi departamento": funciones del cargo y, para finanzas y gerencia, el control de gastos */
import { useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { confirmar, toast } from "../../lib/utils.js";
import { FilaVacia, fechaDia, formatoPesos, intentar } from "./comunes.jsx";
import { usePanel } from "./PanelContexto.jsx";
import { TarjetaTarea } from "./Resumen.jsx";

/* Valor en pesos: se aceptan cifras cerradas o exactas, con o sin puntos de miles ("50.000", "1.250.000", "12345").
   Mientras se escribe se agregan los puntos para leer la cifra fácil. */
const pesosDe = (texto) => Number(String(texto).replace(/\D/g, "")) || 0;
const conPuntos = (n) => (n ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n) : "");

function Finanzas() {
  const { modelo: D, acciones } = useDatos();
  const gastos = D.gastos();
  const [editando, setEditando] = useState(null); // gasto que se corrige
  const [form, setForm] = useState({ concepto: "", categoria: "Materiales", valor: "" });
  const [ocupado, setOcupado] = useState(false);

  const editar = (g) => {
    setEditando(g);
    setForm(g ? { concepto: g.concepto, categoria: g.categoria, valor: conPuntos(Number(g.valor)) } : { concepto: "", categoria: "Materiales", valor: "" });
    if (g) setTimeout(() => document.getElementById("gasto-concepto")?.focus());
  };
  function cambiarValor(e) {
    const campo = e.target;
    const digitosAntes = campo.value.slice(0, campo.selectionStart).replace(/\D/g, "").length;
    const nuevo = conPuntos(pesosDe(campo.value.slice(0, 17)));
    setForm((f) => ({ ...f, valor: nuevo }));
    campo.setCustomValidity("");
    requestAnimationFrame(() => { // deja el cursor después del mismo dígito
      let pos = 0, vistos = 0;
      while (pos < nuevo.length && vistos < digitosAntes) { if (/\d/.test(nuevo[pos])) vistos++; pos++; }
      campo.setSelectionRange(pos, pos);
    });
  }
  async function guardar(e) {
    e.preventDefault();
    const formulario = e.currentTarget, valor = pesosDe(form.valor), campo = formulario.elements.valor;
    campo.setCustomValidity(form.valor && !(valor > 0 && valor <= 1000000000) ? "Escribe un valor entre $1 y $1.000.000.000." : "");
    if (!formulario.reportValidity()) return;
    const gasto = { concepto: form.concepto.trim(), categoria: form.categoria, valor };
    if (!(await intentar(() => (editando ? acciones.actualizarGasto(editando.id, gasto) : acciones.registrarGasto(gasto)), setOcupado))) return;
    toast(editando ? "Gasto actualizado" : "Gasto registrado");
    editar(null);
  }
  async function eliminar(g) {
    if (!(await confirmar({ titulo: "¿Eliminar este gasto?", mensaje: "«" + g.concepto + "» por " + formatoPesos(g.valor) + ". Esta acción no se puede deshacer.", aceptar: "Eliminar gasto", peligro: true }))) return;
    if (!(await intentar(() => acciones.eliminarGasto(g.id)))) return;
    if (editando?.id === g.id) editar(null);
    toast("Gasto eliminado");
  }
  return (
    <section id="finanzas-panel" className="finance-panel">
      <h2>Control de gastos del departamento</h2>
      <p>Movimientos guardados en la base de datos. Cada persona de finanzas y la gerencia puede corregirlos.</p>
      <dl className="tarjetas-resumen">
        <div className="tarjeta-dato"><dt>Total registrado</dt><dd>{formatoPesos(gastos.reduce((t, g) => t + Number(g.valor || 0), 0))}</dd></div>
        <div className="tarjeta-dato"><dt>Movimientos</dt><dd>{gastos.length}</dd></div>
      </dl>
      <form id="form-gasto" className="form finance-form" onSubmit={guardar}>
        <div className="fila-campos">
          <div className="campo"><label htmlFor="gasto-concepto">Concepto</label><input id="gasto-concepto" name="concepto" required maxLength="100" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} /></div>
          <div className="campo"><label htmlFor="gasto-categoria">Categoría</label>
            <select id="gasto-categoria" name="categoria" required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {["Materiales", "Conectividad", "Transporte", "Servicios", "Otro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="campo"><label htmlFor="gasto-valor">Valor (COP)</label><input id="gasto-valor" name="valor" type="text" inputMode="numeric" autoComplete="off" required maxLength="17" placeholder="Ej. 50.000" aria-describedby="gasto-valor-ayuda" value={form.valor} onChange={cambiarValor} /><small className="form-ayuda" id="gasto-valor-ayuda">Pesos sin centavos. Puedes escribir 50000 o 50.000.</small></div>
        </div>
        <div className="portal-actions">
          <button type="submit" className="btn btn-primary" disabled={ocupado}>{editando ? "Guardar cambios" : "Registrar gasto"}</button>
          {editando && <button type="button" className="btn btn-outline" onClick={() => editar(null)}>Cancelar edición</button>}
        </div>
      </form>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>Concepto</th><th>Categoría</th><th>Valor</th><th>Fecha</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {gastos.length ? gastos.slice().reverse().map((g) => (
              <tr key={g.id}>
                <td>{g.concepto}</td><td>{g.categoria}</td><td>{formatoPesos(g.valor)}</td><td>{fechaDia({ creado: g.creado })}</td>
                <td><div className="portal-actions"><button type="button" className="btn btn-outline btn-sm" onClick={() => editar(g)}>Editar</button><button type="button" className="btn btn-outline btn-sm btn-peligro" onClick={() => eliminar(g)}>Eliminar</button></div></td>
              </tr>
            )) : <FilaVacia columnas={5}>Aún no hay movimientos registrados.</FilaVacia>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Area() {
  const { perfil } = usePanel();
  return (
    <>
      <span className="eyebrow">{perfil.area}</span>
      <h1 id="area-titulo">{perfil.title}</h1>
      <p>{perfil.intro}</p>
      <div className="department-grid">{perfil.tasks.map((t) => <TarjetaTarea tarea={t} key={t[0]} />)}</div>
      {perfil.finanzas && <Finanzas />}
    </>
  );
}
