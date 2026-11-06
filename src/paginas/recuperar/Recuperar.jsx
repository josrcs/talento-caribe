/* Recuperar - Recuperar la contraseña (recuperar.html).
   1. Sin token: se pide el correo y el servidor envía un enlace (POST /api/auth/recuperar).
      La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.
   2. Con ?token= (el enlace del correo): se crea la contraseña nueva (POST /api/auth/restablecer).
   En modo demostración no hay servidor que envíe correos: se explica. */
import { useEffect, useState } from "react";
import PanelMarca from "../../componentes/PanelMarca.jsx";
import { config, enviarApi, problemaClave, EMAIL } from "../../lib/plataforma.js";
import { useRevelar } from "../../lib/ganchos.js";

// El enlace se lee una vez y se quita de la barra de direcciones: así no queda en el historial ni en capturas
const TOKEN = new URLSearchParams(location.search).get("token") || "";

function BotonCarga({ cargando, children }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={cargando}>
      {cargando ? <span className="spinner" aria-hidden="true" /> : children}
    </button>
  );
}

export default function Recuperar() {
  const demo = config().MODO_DEMO;
  const [error, setError] = useState({});
  const [estado, setEstado] = useState(null); // { texto, error }
  const [cargando, setCargando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const revelar = useRevelar([]);

  useEffect(() => { if (TOKEN) history.replaceState(null, "", location.pathname); }, []);

  async function pedirEnlace(e) {
    e.preventDefault();
    const correo = e.currentTarget.elements.correo.value.trim();
    if (!EMAIL.test(correo)) { setError({ correo: "Escribe un correo válido, por ejemplo nombre@correo.com." }); return; }
    setError({}); setCargando(true); setEstado(null);
    try {
      await enviarApi("/auth/recuperar", { correo });
      setTerminado(true);
      setEstado({ texto: "Si el correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam." });
    } catch (problema) { setEstado({ texto: problema.message, error: true }); }
    setCargando(false);
  }

  async function guardarClave(e) {
    e.preventDefault();
    const { clave, confirmar } = e.currentTarget.elements;
    const errores = { clave: problemaClave(clave.value), confirmar: confirmar.value.trim() !== clave.value.trim() ? "Las contraseñas no coinciden." : "" };
    setError(errores);
    if (errores.clave || errores.confirmar) return;
    setCargando(true); setEstado(null);
    try {
      await enviarApi("/auth/restablecer", { token: TOKEN, clave: clave.value });
      setTerminado(true);
      setEstado({ texto: "¡Listo! Tu contraseña cambió. Ya puedes ingresar con ella." });
    } catch (problema) { setEstado({ texto: problema.message, error: true }); }
    setCargando(false);
  }

  const conToken = Boolean(TOKEN) && !demo;
  const errorDe = (campo) => error[campo] && <small className="error">{error[campo]}</small>;

  return (
    <main className="login login-shell" id="contenido" ref={revelar}>
      <PanelMarca eyebrow="Tu cuenta, segura" titulo="Vuelve a entrar en un minuto." texto="Te enviamos un enlace a tu correo para crear una contraseña nueva. Sirve una sola vez y vence en 1 hora." />
      <section className="login-card" aria-labelledby="recuperar-titulo">
        <div className="login-card-heading">
          <img className="login-card-logo" src="assets/img/logo-emblema.png" alt="" width="64" height="48" />
          <span className="eyebrow">Recuperar contraseña</span>
          <h2 id="recuperar-titulo">{conToken ? "Crea tu contraseña nueva" : "¿Olvidaste tu contraseña?"}</h2>
          <p>{conToken ? "Escríbela dos veces. Después podrás entrar con ella." : "Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."}</p>
        </div>

        {!terminado && !conToken && (
          <form className="form login-form" noValidate onSubmit={pedirEnlace}>
            <fieldset disabled={demo} className="campos-sin-borde">
              <div className="campo">
                <label htmlFor="rc-correo">Correo electrónico</label>
                <input id="rc-correo" name="correo" type="email" autoComplete="email" required placeholder="nombre@correo.com" aria-invalid={error.correo ? "true" : undefined} />
                {errorDe("correo")}
              </div>
              <BotonCarga cargando={cargando}>Enviarme el enlace</BotonCarga>
            </fieldset>
          </form>
        )}

        {!terminado && conToken && (
          <form className="form login-form" noValidate onSubmit={guardarClave}>
            <div className="campo">
              <label htmlFor="rc-clave">Contraseña nueva</label>
              <input id="rc-clave" name="clave" type="password" autoComplete="new-password" required minLength={8} maxLength={72} autoFocus aria-invalid={error.clave ? "true" : undefined} />
              <small className="form-ayuda">Mínimo 8 caracteres, con letras y números.</small>
              {errorDe("clave")}
            </div>
            <div className="campo">
              <label htmlFor="rc-confirmar">Confirma la contraseña</label>
              <input id="rc-confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength={8} aria-invalid={error.confirmar ? "true" : undefined} />
              {errorDe("confirmar")}
            </div>
            <BotonCarga cargando={cargando}>Guardar contraseña</BotonCarga>
          </form>
        )}

        {estado && <p className={`form-estado${estado.error ? " estado-error" : ""}`} role="status" aria-live="polite">{estado.texto}</p>}
        {demo && (
          <div className="demo-aviso">
            <strong>Modo de demostración</strong>
            <p>Recuperar la contraseña necesita el servidor encendido, porque se envía un correo. En la demostración puedes entrar con las cuentas de prueba.</p>
          </div>
        )}
        <p className="login-volver"><a href="admin/login.html">{terminado && conToken ? "Ingresar ahora →" : "← Volver a ingresar"}</a></p>
      </section>
    </main>
  );
}
