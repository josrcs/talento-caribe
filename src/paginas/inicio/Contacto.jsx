/* Contacto - Formulario con validación en vivo.
   - Con servidor: POST /api/contacto (llega a la bandeja del panel y por correo).
   - Sin servidor (GitHub Pages en modo demostración): abre el correo de la persona con el mensaje listo. */
import { useState } from "react";
import { config, aviso, EMAIL } from "../../lib/plataforma.js";

const CORREO_CONTACTO = "contacto@talentocaribe.co";
const INTERESES = [
  ["curso", "Información de un curso"],
  ["mentor", "Quiero ser mentor"],
  ["alianza", "Alianzas o patrocinio"],
  ["otro", "Otro tema"],
];

/* Cada regla devuelve el mensaje de error, o "" si el campo está bien */
const REGLAS = {
  nombre: (v) => (v.length < 3 ? "Escribe tu nombre completo." : ""),
  correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido, por ejemplo nombre@correo.com."),
  interes: (v) => (v ? "" : "Elige una opción."),
  asunto: (v) => (v ? "" : "Escribe el asunto del mensaje."),
  mensaje: (v) => (v.length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : ""),
  acepto: (v) => (v ? "" : "Debes aceptar el uso de tus datos para poder responderte."),
};

const VACIO = { nombre: "", correo: "", telefono: "", interes: "", asunto: "", mensaje: "", acepto: false, sitio_web: "" };

function MensajeError({ texto }) {
  return texto ? <small className="error">{texto}</small> : null;
}

export default function Contacto() {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null); // { texto, error }

  const cambiar = (e) => {
    const { name, type, checked, value } = e.target;
    setValores((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    // Si el campo ya mostraba un error, se vuelve a revisar mientras se corrige
    if (errores[name]) setErrores((er) => ({ ...er, [name]: REGLAS[name](type === "checkbox" ? checked : value.trim()) }));
  };
  const props = (nombre) => ({ name: nombre, value: valores[nombre], onChange: cambiar, "aria-invalid": errores[nombre] ? "true" : undefined });

  async function enviar(e) {
    e.preventDefault();
    if (valores.sitio_web) return; // campo trampa: solo un bot lo llena
    const nuevos = Object.fromEntries(Object.entries(REGLAS).map(([campo, regla]) => [campo, regla(typeof valores[campo] === "string" ? valores[campo].trim() : valores[campo])]));
    setErrores(nuevos);
    const primero = Object.keys(REGLAS).find((campo) => nuevos[campo]);
    if (primero) { e.currentTarget.elements[primero]?.focus(); return; }

    setEnviando(true); setEstado(null);
    const datos = {
      nombre: valores.nombre.trim(), correo: valores.correo.trim(), telefono: valores.telefono.trim(), interes: valores.interes,
      asunto: valores.asunto.trim(), mensaje: valores.mensaje.trim(), leido: false, creado_en: new Date().toISOString(),
    };
    try {
      const { MODO_DEMO, API_CONTACTO, API_URL } = config();
      if (MODO_DEMO && !API_CONTACTO) {
        // Sin servidor nadie recibiría el mensaje: se abre el correo de la persona con todo listo
        const tema = INTERESES.find(([v]) => v === datos.interes)?.[1] || "";
        const cuerpo = `${datos.mensaje}\n\n${datos.nombre}\n${datos.correo}${datos.telefono ? `\n${datos.telefono}` : ""}\nTema: ${tema}`;
        location.href = `mailto:${CORREO_CONTACTO}?subject=${encodeURIComponent(datos.asunto)}&body=${encodeURIComponent(cuerpo)}`;
        setEstado({ texto: `Abrimos tu aplicación de correo con el mensaje listo: solo falta que lo envíes. Si no se abrió, escríbenos a ${CORREO_CONTACTO}.` });
      } else {
        const r = await fetch(`${API_URL}/contacto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
        if (!r.ok) throw new Error();
        setEstado({ texto: "¡Mensaje enviado! Te responderemos en un máximo de 3 días hábiles." });
        aviso("Mensaje enviado");
      }
      setValores(VACIO); setErrores({});
    } catch {
      setEstado({ texto: "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.", error: true });
    }
    setEnviando(false);
  }

  return (
    <section id="contacto" className="section section-alt" aria-labelledby="contacto-titulo">
      <div className="container contacto-grid">
        <div className="contacto-info" data-revelar="izquierda">
          <span className="eyebrow">Contacto</span>
          <h2 id="contacto-titulo">Escríbenos</h2>
          <p>¿Dudas sobre un curso, quieres ser mentor o tienes una alianza en mente? Respondemos en un máximo de 3 días hábiles.</p>
          <address>Barranquilla, Colombia<br /><a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a></address>
        </div>
        <form className="form" noValidate onSubmit={enviar} data-revelar="derecha">
          <div className="campo">
            <label htmlFor="c-nombre">Nombre completo</label>
            <input id="c-nombre" type="text" autoComplete="name" maxLength={80} {...props("nombre")} />
            <MensajeError texto={errores.nombre} />
          </div>
          <div className="campo">
            <label htmlFor="c-correo">Correo electrónico</label>
            <input id="c-correo" type="email" autoComplete="email" {...props("correo")} />
            <MensajeError texto={errores.correo} />
          </div>
          <div className="campo">
            <label htmlFor="c-telefono">Teléfono (opcional)</label>
            <input id="c-telefono" type="tel" autoComplete="tel" maxLength={20} {...props("telefono")} />
          </div>
          <div className="campo">
            <label htmlFor="c-interes">¿Qué necesitas?</label>
            <select id="c-interes" {...props("interes")}>
              <option value="">Selecciona una opción</option>
              {INTERESES.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
            </select>
            <MensajeError texto={errores.interes} />
          </div>
          <div className="campo">
            <label htmlFor="c-asunto">Asunto</label>
            <input id="c-asunto" type="text" maxLength={100} {...props("asunto")} />
            <MensajeError texto={errores.asunto} />
          </div>
          <div className="campo">
            <label htmlFor="c-mensaje">Mensaje</label>
            <textarea id="c-mensaje" rows={5} maxLength={1000} {...props("mensaje")} />
            <MensajeError texto={errores.mensaje} />
          </div>
          {/* Campo trampa para bots: debe llegar vacío */}
          <div className="campo-trampa" aria-hidden="true">
            <label htmlFor="c-web">No llenar este campo</label>
            <input id="c-web" type="text" tabIndex={-1} autoComplete="off" {...props("sitio_web")} />
          </div>
          <div className="campo campo-check">
            <input id="c-acepto" name="acepto" type="checkbox" checked={valores.acepto} onChange={cambiar} aria-invalid={errores.acepto ? "true" : undefined} />
            <label htmlFor="c-acepto">Acepto que Talento Caribe use mis datos solo para responder este mensaje.</label>
            <MensajeError texto={errores.acepto} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? <span className="spinner" aria-hidden="true" /> : "Enviar mensaje"}
          </button>
          <p className={`form-estado${estado?.error ? " estado-error" : ""}`} role="status" aria-live="polite" hidden={!estado}>{estado?.texto}</p>
        </form>
      </div>
    </section>
  );
}
