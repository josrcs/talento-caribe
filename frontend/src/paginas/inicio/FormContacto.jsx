/* FormContacto.jsx - Formulario de contacto: valida en el navegador y envía a POST /api/contacto.
   El servidor guarda el mensaje en PostgreSQL (lo lee el equipo en el panel) y responde por correo. */
import { useState } from "react";
import { pedir } from "../../lib/api.js";
import { EMAIL, toast } from "../../lib/utils.js";
import { useValidacion } from "../../lib/validacion.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";

const REGLAS = {
  nombre: (v) => (v.length < 3 ? "Escribe tu nombre completo." : ""),
  correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com."),
  interes: (v) => (v ? "" : "Elige una opción."),
  asunto: (v) => (v ? "" : "Escribe el asunto del mensaje."),
  mensaje: (v) => (v.length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : ""),
  acepto: (v) => (v ? "" : "Debes aceptar el uso de tus datos para poder responderte."),
};

export default function FormContacto() {
  const { validar, error, invalido } = useValidacion();
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null); // { texto, error }

  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget, f = form.elements;
    if (f.sitio_web.value) return; // campo trampa: solo un bot lo llena
    if (!validar(form, REGLAS)) return;
    setEnviando(true); setEstado(null);
    const valor = (n) => f[n].value.trim();
    try {
      await pedir("POST", "/contacto", { nombre: valor("nombre"), correo: valor("correo"), telefono: valor("telefono"), interes: f.interes.value, asunto: valor("asunto"), mensaje: valor("mensaje") });
      form.reset();
      setEstado({ texto: "¡Mensaje enviado! Te responderemos en un máximo de 3 días hábiles." });
      toast("Mensaje enviado");
    } catch (problema) {
      setEstado({ texto: problema.status ? problema.message : "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.", error: true });
    } finally { setEnviando(false); }
  }

  return (
    <form id="form-contacto" className="form" noValidate data-revelar="derecha" onSubmit={enviar}>
      <div className="campo">
        <label htmlFor="c-nombre">Nombre completo</label>
        <input id="c-nombre" name="nombre" type="text" autoComplete="name" required minLength="3" maxLength="80" aria-invalid={invalido("nombre")} />
        {error("nombre")}
      </div>
      <div className="campo">
        <label htmlFor="c-correo">Correo electrónico</label>
        <input id="c-correo" name="correo" type="email" autoComplete="email" required aria-invalid={invalido("correo")} />
        {error("correo")}
      </div>
      <div className="campo">
        <label htmlFor="c-telefono">Teléfono (opcional)</label>
        <input id="c-telefono" name="telefono" type="tel" autoComplete="tel" maxLength="20" />
      </div>
      <div className="campo">
        <label htmlFor="c-interes">¿Qué necesitas?</label>
        <select id="c-interes" name="interes" required defaultValue="" aria-invalid={invalido("interes")}>
          <option value="">Selecciona una opción</option>
          <option value="curso">Información de un curso</option>
          <option value="mentor">Quiero ser mentor</option>
          <option value="alianza">Alianzas o patrocinio</option>
          <option value="otro">Otro tema</option>
        </select>
        {error("interes")}
      </div>
      <div className="campo">
        <label htmlFor="c-asunto">Asunto</label>
        <input id="c-asunto" name="asunto" type="text" required maxLength="100" aria-invalid={invalido("asunto")} />
        {error("asunto")}
      </div>
      <div className="campo">
        <label htmlFor="c-mensaje">Mensaje</label>
        <textarea id="c-mensaje" name="mensaje" rows="5" required minLength="10" maxLength="1000" aria-invalid={invalido("mensaje")}></textarea>
        {error("mensaje")}
      </div>
      {/* Campo trampa para bots: debe llegar vacío al servidor */}
      <div className="campo-trampa" aria-hidden="true">
        <label htmlFor="c-web">No llenar este campo</label>
        <input id="c-web" name="sitio_web" type="text" tabIndex="-1" autoComplete="off" />
      </div>
      <div className="campo campo-check">
        <input id="c-acepto" name="acepto" type="checkbox" required aria-invalid={invalido("acepto")} />
        <label htmlFor="c-acepto">Acepto que Talento Caribe use mis datos solo para responder este mensaje.</label>
        {error("acepto")}
      </div>
      <BotonCarga cargando={enviando} id="contacto-enviar">Enviar mensaje</BotonCarga>
      {estado && <p id="contacto-estado" className={"form-estado" + (estado.error ? " estado-error" : "")} role="status" aria-live="polite">{estado.texto}</p>}
    </form>
  );
}
