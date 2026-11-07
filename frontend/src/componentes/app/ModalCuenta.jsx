/* ==========================================================
   ModalCuenta.jsx - "Seguridad de tu cuenta" (portal y panel)
   - Cambiar la contraseña pidiendo la actual (PUT /api/auth/clave).
     El servidor cierra las sesiones de los demás equipos y devuelve
     un token nuevo para este navegador.
   - Cerrar la sesión en todos los equipos (POST /api/auth/cerrar-sesiones),
     por ejemplo después de usar un computador público.
   ========================================================== */
import { useState } from "react";
import Modal from "../Modal.jsx";
import BotonCarga from "../BotonCarga.jsx";
import { pedir } from "../../lib/api.js";
import { borrarSesion, guardarSesion, leerSesion } from "../../lib/sesion.js";
import { ir } from "../../lib/rutas.js";
import { problemaClave, toast } from "../../lib/utils.js";
import { useValidacion } from "../../lib/validacion.jsx";
import { BotonDosToques } from "./ui.jsx";

export default function ModalCuenta({ abierto, alCerrar }) {
  const { validar, error, invalido } = useValidacion();
  const [enviando, setEnviando] = useState(false);
  const [problema, setProblema] = useState("");
  const [cerrando, setCerrando] = useState(false);

  async function cambiarClave(e) {
    e.preventDefault(); setProblema("");
    const sesion = leerSesion() || {};
    const ok = validar(e.currentTarget, {
      actual: (v) => (v ? "" : "Escribe tu contraseña actual."),
      nueva: (v, f) => problemaClave(f.elements.nueva.value, sesion.correo) || (f.elements.nueva.value === f.elements.actual.value ? "Debe ser distinta de la actual." : ""),
      confirmar: (v, f) => (f.elements.confirmar.value !== f.elements.nueva.value ? "Las contraseñas no coinciden." : ""),
    });
    if (!ok) return;
    const f = e.currentTarget.elements;
    setEnviando(true);
    try {
      const { token, usuario } = await pedir("PUT", "/auth/clave", { actual: f.actual.value, nueva: f.nueva.value });
      // Este navegador sigue con sesión: se guarda el token nuevo (el anterior ya no sirve)
      guardarSesion({ ...sesion, ...usuario, puesto: sesion.puesto || usuario.puesto, token });
      alCerrar();
      toast("Contraseña actualizada. Cerramos tu sesión en los demás equipos.");
    } catch (p) { setProblema(p.message); } finally { setEnviando(false); }
  }
  async function cerrarTodo() {
    setCerrando(true);
    try { await pedir("POST", "/auth/cerrar-sesiones"); borrarSesion(); ir("admin/login.html"); }
    catch (p) { toast(p.message, "error"); setCerrando(false); }
  }

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} etiqueta="cuenta-titulo" id="modal-cuenta">
      <form className="modal-contenido form" id="form-clave" noValidate onSubmit={cambiarClave}>
        <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={alCerrar}>&times;</button>
        <span className="eyebrow">TU CUENTA</span>
        <h2 id="cuenta-titulo">Seguridad de tu cuenta</h2>
        <fieldset>
          <legend className="subtitulo">Cambiar la contraseña</legend>
          <div className="campo"><label htmlFor="cc-actual">Contraseña actual</label><input id="cc-actual" name="actual" type="password" autoComplete="current-password" required maxLength="72" aria-invalid={invalido("actual")} />{error("actual")}</div>
          <div className="campo"><label htmlFor="cc-nueva">Contraseña nueva</label><input id="cc-nueva" name="nueva" type="password" autoComplete="new-password" required minLength="8" maxLength="72" aria-invalid={invalido("nueva")} /><small className="form-ayuda">Mínimo 8 caracteres, con letras y números.</small>{error("nueva")}</div>
          <div className="campo"><label htmlFor="cc-confirmar">Confirma la contraseña nueva</label><input id="cc-confirmar" name="confirmar" type="password" autoComplete="new-password" required maxLength="72" aria-invalid={invalido("confirmar")} />{error("confirmar")}</div>
          {problema && <p className="error" role="alert">{problema}</p>}
          <div className="modal-acciones"><BotonCarga cargando={enviando}>Cambiar contraseña</BotonCarga></div>
          <p className="form-ayuda">Al cambiarla se cierra tu sesión en los demás equipos y te enviamos un correo de aviso.</p>
        </fieldset>
        <hr className="separador" />
        <h3 className="subtitulo">¿Usaste un computador público?</h3>
        <p className="form-ayuda">Cierra tu sesión en todos los equipos, incluido este. Tendrás que volver a ingresar.</p>
        <div className="modal-acciones">
          <BotonDosToques className="btn btn-outline" disabled={cerrando} alConfirmar={cerrarTodo} textoConfirmar="¿Seguro? Toca de nuevo para cerrar todo">Cerrar sesión en todos los equipos</BotonDosToques>
        </div>
      </form>
    </Modal>
  );
}
