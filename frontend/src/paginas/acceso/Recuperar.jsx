/* ==========================================================
   Recuperar.jsx - Recuperar la contraseña (recuperar.html)
   1. Sin token: se pide el correo y el servidor envía un enlace
      (POST /api/auth/recuperar). La respuesta es la misma exista o no
      la cuenta, para no revelar qué correos están registrados.
   2. Con ?token= (el enlace del correo): se crea la contraseña nueva
      (POST /api/auth/restablecer).
   ========================================================== */
import { useState } from "react";
import Logo from "../../componentes/Logo.jsx";
import Preferencias from "../../componentes/Preferencias.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { pedir } from "../../lib/api.js";
import { parametros } from "../../lib/rutas.js";
import { EMAIL, problemaClave } from "../../lib/utils.js";
import { useValidacion } from "../../lib/validacion.jsx";

// El enlace se quita de la barra de direcciones apenas se lee: así no queda en el historial ni en capturas de pantalla.
// (Si se recarga la página, basta con abrir de nuevo el enlace del correo mientras no se haya usado.)
const TOKEN = parametros().get("token") || "";
if (TOKEN) history.replaceState(null, "", location.pathname);

export default function Recuperar() {
  const { validar, error, invalido } = useValidacion();
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null); // { texto, error }
  const [listo, setListo] = useState(false);

  async function enviar(e, ruta, reglas, cuerpo, exito) {
    e.preventDefault();
    if (!validar(e.currentTarget, reglas)) return;
    setEnviando(true); setEstado(null);
    try {
      await pedir("POST", ruta, cuerpo(e.currentTarget.elements));
      setListo(true); setEstado({ texto: exito });
    } catch (problema) { setEstado({ texto: problema.message, error: true }); }
    setEnviando(false);
  }
  const pedirEnlace = (e) => enviar(e, "/auth/recuperar",
    { correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com.") },
    (f) => ({ correo: f.correo.value.trim() }),
    "Si el correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.");
  const guardarClave = (e) => enviar(e, "/auth/restablecer",
    { clave: (v, f) => problemaClave(f.elements.clave.value), confirmar: (v, f) => (v !== f.elements.clave.value.trim() ? "Las contraseñas no coinciden." : "") },
    (f) => ({ token: TOKEN, clave: f.clave.value }),
    "¡Listo! Tu contraseña cambió. Ya puedes ingresar con ella.");

  return (
    <>
      <Preferencias flotante />
      <main className="login login-shell">
        <section className="login-story" aria-label="Talento Caribe">
          <a href="index.html" className="login-logo"><Logo tipo="completo-sm" alt="Talento Caribe — inicio" width="208" height="177" /></a>
          <div className="login-story-copy"><span className="eyebrow">Tu cuenta, segura</span><h1>Vuelve a entrar en un minuto.</h1><p>Te enviamos un enlace a tu correo para crear una contraseña nueva. Sirve una sola vez y vence en 1 hora.</p></div>
          <p className="acceso-pie">Plataforma educativa gratuita · Barranquilla, Colombia</p>
        </section>

        <section className="login-card" aria-labelledby="recuperar-titulo">
          <div className="login-card-heading">
            <Logo className="login-card-logo" tipo="emblema" width="64" height="48" />
            <span className="eyebrow">Recuperar contraseña</span>
            <h2 id="recuperar-titulo">{TOKEN ? "Crea tu contraseña nueva" : "¿Olvidaste tu contraseña?"}</h2>
            <p>{TOKEN ? "Escríbela dos veces. Después podrás entrar con ella." : "Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."}</p>
          </div>

          {!listo && !TOKEN && (
            <form id="form-pedir" className="form login-form" noValidate onSubmit={pedirEnlace}>
              <div className="campo"><label htmlFor="rc-correo">Correo electrónico</label><input id="rc-correo" name="correo" type="email" autoComplete="email" required placeholder="nombre@correo.com" aria-invalid={invalido("correo")} />{error("correo")}</div>
              <BotonCarga cargando={enviando}>Enviarme el enlace</BotonCarga>
            </form>
          )}
          {!listo && TOKEN && (
            <form id="form-nueva" className="form login-form" noValidate onSubmit={guardarClave}>
              <div className="campo"><label htmlFor="rc-clave">Contraseña nueva</label><input id="rc-clave" name="clave" type="password" autoComplete="new-password" required minLength="8" maxLength="72" autoFocus aria-invalid={invalido("clave")} /><small className="form-ayuda">Mínimo 8 caracteres, con letras y números.</small>{error("clave")}</div>
              <div className="campo"><label htmlFor="rc-confirmar">Confirma la contraseña</label><input id="rc-confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength="8" aria-invalid={invalido("confirmar")} />{error("confirmar")}</div>
              <BotonCarga cargando={enviando}>Guardar contraseña</BotonCarga>
            </form>
          )}
          {estado && <p id="rc-estado" className={"form-estado" + (estado.error ? " estado-error" : "")} role="status" aria-live="polite">{estado.texto}</p>}
          <p className="login-volver"><a href="admin/login.html">{listo && TOKEN ? "Ingresar ahora →" : "← Volver a ingresar"}</a></p>
        </section>
      </main>
    </>
  );
}
