/* Registro - Crear la cuenta de estudiante (registro.html).
   Paso 1: el país (cambia los documentos que se piden). Paso 2: datos personales y contraseña.
   Con ?completar=1 y sesión de estudiante, sirve para completar el perfil antes de inscribirse.
   Con ?curso=ID, al terminar vuelve al catálogo para seguir con la inscripción de ese curso. */
import { useRef, useState } from "react";
import { auth, sesion, guardarSesion, buscarCurso, edadDesde, problemaClave } from "../../lib/plataforma.js";
import { useRevelar } from "../../lib/ganchos.js";
import PanelMarca from "../../componentes/PanelMarca.jsx";

const PAISES = ["Colombia", "Venezuela", "Ecuador", "Perú", "México", "Argentina", "Chile", "Otro país"];
const DOCUMENTOS = {
  Colombia: ["Cédula de ciudadanía", "Tarjeta de identidad", "Cédula de extranjería", "PEP (Permiso Especial de Permanencia)"],
  otros: ["Documento nacional de identidad", "Pasaporte", "Documento de extranjería o residencia", "Otro documento oficial"],
};
const ESTUDIOS = ["Primaria", "Secundaria o bachillerato", "Técnico o tecnológico", "Universitario", "Otro o en curso", "Prefiero no indicarlo"];
const SOPORTES = [
  ["certificado", "Certificado o constancia de estudios"],
  ["calificaciones", "Boletín o calificaciones"],
  ["acta_nacimiento", "Registro civil o acta de nacimiento (si aplica)"],
  ["ninguno", "Todavía no cuento con estos soportes"],
];
const hoy = () => new Date().toISOString().slice(0, 10);
const parametros = new URLSearchParams(location.search);

/* Marca un campo como inválido con un mensaje del navegador y lo limpia cuando la persona lo corrige */
function marcarInvalido(campo, mensaje) {
  campo.setCustomValidity(mensaje);
  campo.reportValidity();
  campo.addEventListener("input", () => campo.setCustomValidity(""), { once: true });
}

function Campo({ id, etiqueta, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && <small className="form-ayuda">{ayuda}</small>}
    </div>
  );
}

export default function Registro() {
  const cursoId = Number(parametros.get("curso")) || 0;
  const perfil = sesion();
  const completando = parametros.get("completar") === "1" && perfil?.rol === "estudiante";
  const destino = cursoId > 0 ? `cursos.html?continuar=${encodeURIComponent(cursoId)}` : "portal.html";
  const paisGuardado = completando ? (PAISES.includes(perfil.pais) ? perfil.pais : "Otro país") : "";

  const [pais, setPais] = useState(paisGuardado);
  const [enDatos, setEnDatos] = useState(completando);
  const [nacimiento, setNacimiento] = useState(completando ? perfil.fecha_nacimiento || "" : "");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const selectPais = useRef(null);
  const revelar = useRevelar([]);
  const p = completando ? perfil : {};
  const menor = nacimiento !== "" && edadDesde(nacimiento) < 18;
  const colombia = pais === "Colombia";
  const modoApi = auth()?.api;

  function continuar() {
    if (!selectPais.current.reportValidity()) return;
    setEnDatos(true);
    setTimeout(() => document.getElementById("r-nombre")?.focus());
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget, campos = form.elements;
    if (!form.reportValidity()) return;
    if (campos.correo.value.trim().toLowerCase() !== campos.confirmar_correo.value.trim().toLowerCase()) { marcarInvalido(campos.confirmar_correo, "Los correos no coinciden."); return; }
    const curso = buscarCurso(cursoId);
    const minima = curso ? Number(curso.edadMinima ?? 14) : 0;
    if (curso && edadDesde(nacimiento) < minima) { setError(`Este curso está dirigido a personas desde los ${minima} años. Puedes explorar otros programas.`); return; }
    if (!completando) {
      // Misma regla de contraseña que el servidor: letras y números, no muy común ni con el correo dentro
      const problema = problemaClave(campos.clave.value, campos.correo.value.trim());
      if (problema) { marcarInvalido(campos.clave, problema); return; }
      if (campos.clave.value !== campos.confirmar.value) { marcarInvalido(campos.confirmar, "Las contraseñas no coinciden."); return; }
    }
    const f = new FormData(form);
    const valor = (k) => String(f.get(k) || "").trim();
    const nuevoPerfil = {
      nombre: valor("nombre"), pais: pais === "Otro país" ? valor("pais_otro") : pais, correo: valor("correo").toLowerCase(),
      tipo_documento: valor("tipo_documento"), numero_documento: valor("numero_documento"), fecha_nacimiento: nacimiento,
      telefono: valor("telefono"), direccion: valor("direccion"), ciudad: valor("ciudad"), region: valor("region"),
      codigo_postal: valor("codigo_postal"), ultimo_estudio: valor("ultimo_estudio"), documentos_disponibles: f.getAll("documentos_disponibles"),
      acudiente_nombre: valor("acudiente_nombre"), acudiente_telefono: valor("acudiente_telefono"), acudiente_correo: valor("acudiente_correo"),
    };
    setEnviando(true);
    try {
      const nueva = completando
        ? await auth().actualizarPerfil(nuevoPerfil)
        : await auth().registrar({ ...nuevoPerfil, clave: campos.clave.value, perfil: nuevoPerfil });
      guardarSesion(nueva);
      location.replace(destino);
    } catch (problema) {
      setError(problema.message || "No pudimos guardar el perfil. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <main className="login login-shell registro-shell" id="contenido" ref={revelar}>
      <PanelMarca eyebrow="Tu talento no tiene fronteras" titulo="Tu aprendizaje comienza con una cuenta." texto="Sin experiencia previa. Regístrate, explora los cursos y aprende a tu ritmo.">
        <div className="login-stat"><span className="login-stat-icon" aria-hidden="true">✦</span><div><strong>Aprende haciendo</strong><small>Una comunidad abierta para todas las personas</small></div></div>
      </PanelMarca>
      <section className="login-card registro-card" aria-labelledby="registro-titulo">
        <div className="login-card-heading">
          <img className="login-card-logo" src="assets/img/logo-emblema.png" alt="" width="64" height="48" />
          <span className="eyebrow">Comunidad Talento Caribe</span>
          <h2 id="registro-titulo">{completando ? "Completa tu perfil" : "Crea tu cuenta"}</h2>
          <p>{completando ? "Antes de enviar tu solicitud de curso, completa los datos que faltan en tu perfil." : "Primero dinos de qué país eres para mostrarte los documentos adecuados."}</p>
        </div>
        <form className="form login-form" noValidate onSubmit={enviar}>
          {/* Los dos pasos quedan montados: al volver a "Cambiar país" no se pierde lo que ya se escribió */}
          <div className="registro-paso" hidden={enDatos}>
              <Campo id="r-pais" etiqueta="¿De qué país eres?">
                <select id="r-pais" name="pais" autoComplete="country-name" required ref={selectPais} value={pais} onChange={(e) => setPais(e.target.value)}>
                  <option value="">Selecciona tu país</option>
                  {PAISES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
              <button type="button" className="btn btn-primary" onClick={continuar}>Continuar con mis datos <span aria-hidden="true">→</span></button>
          </div>
          <fieldset className="registro-datos" hidden={!enDatos} disabled={!enDatos}>
              <legend>Datos personales y de contacto</legend>
              <button type="button" className="btn btn-outline btn-sm registro-cambiar-pais" onClick={() => setEnDatos(false)}>Cambiar país</button>
              <p className="form-ayuda" aria-live="polite">
                {colombia
                  ? "Para Colombia puedes inscribirte con cédula de ciudadanía, tarjeta de identidad, cédula de extranjería o PEP. Ten a mano una constancia de estudios si el programa la solicita."
                  : "Selecciona el documento oficial vigente en tu país. Si el curso necesita algún soporte académico adicional, el equipo te lo indicará durante el proceso."}
              </p>
              {pais === "Otro país" && (
                <Campo id="r-pais-otro" etiqueta="Escribe tu país">
                  <input id="r-pais-otro" name="pais_otro" type="text" autoComplete="country-name" maxLength={60} required defaultValue={p.pais && !PAISES.includes(p.pais) ? p.pais : ""} />
                </Campo>
              )}
              <Campo id="r-nombre" etiqueta="Nombres y apellidos completos">
                <input id="r-nombre" name="nombre" type="text" autoComplete="name" required minLength={5} maxLength={120} placeholder="Como aparecen en tu documento" defaultValue={p.nombre || ""} />
              </Campo>
              <div className="fila-campos">
                <Campo id="r-tipo-documento" etiqueta="Tipo de documento de identidad">
                  <select id="r-tipo-documento" name="tipo_documento" required defaultValue={p.tipo_documento || ""} key={colombia ? "co" : "otros"}>
                    <option value="">Selecciona tu documento</option>
                    {(colombia ? DOCUMENTOS.Colombia : DOCUMENTOS.otros).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Campo>
                <Campo id="r-numero-documento" etiqueta="Número del documento">
                  <input id="r-numero-documento" name="numero_documento" type="text" autoComplete="off" required minLength={5} maxLength={30} placeholder="Número de identificación" defaultValue={p.numero_documento || ""} />
                </Campo>
              </div>
              <div className="fila-campos">
                <Campo id="r-nacimiento" etiqueta="Fecha de nacimiento" ayuda="La mayoría de los programas está dirigida a personas desde los 14 años; algunos cursos pueden variar.">
                  <input id="r-nacimiento" name="fecha_nacimiento" type="date" autoComplete="bday" required max={hoy()} value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} />
                </Campo>
                <Campo id="r-telefono" etiqueta="Teléfono de contacto">
                  <input id="r-telefono" name="telefono" type="tel" autoComplete="tel" required minLength={7} maxLength={25} placeholder="Incluye el indicativo de país" defaultValue={p.telefono || ""} />
                </Campo>
              </div>
              <Campo id="r-correo" etiqueta="Correo electrónico activo" ayuda="Usaremos este correo para confirmaciones y avisos del proceso.">
                <input id="r-correo" name="correo" type="email" autoComplete="email" required maxLength={120} placeholder="nombre@correo.com" defaultValue={p.correo || ""} />
              </Campo>
              <Campo id="r-confirmar-correo" etiqueta="Confirma tu correo electrónico">
                <input id="r-confirmar-correo" name="confirmar_correo" type="email" autoComplete="email" required maxLength={120} defaultValue={p.correo || ""} />
              </Campo>
              <Campo id="r-direccion" etiqueta="Dirección completa de residencia">
                <input id="r-direccion" name="direccion" type="text" autoComplete="street-address" required maxLength={180} placeholder="Vía, número, apartamento o barrio" defaultValue={p.direccion || ""} />
              </Campo>
              <div className="fila-campos">
                <Campo id="r-ciudad" etiqueta="Ciudad o municipio"><input id="r-ciudad" name="ciudad" type="text" autoComplete="address-level2" required maxLength={80} defaultValue={p.ciudad || ""} /></Campo>
                <Campo id="r-region" etiqueta="Departamento, estado o región"><input id="r-region" name="region" type="text" autoComplete="address-level1" required maxLength={80} defaultValue={p.region || ""} /></Campo>
                <Campo id="r-codigo-postal" etiqueta="Código postal"><input id="r-codigo-postal" name="codigo_postal" type="text" autoComplete="postal-code" required maxLength={16} defaultValue={p.codigo_postal || ""} /></Campo>
              </div>
              <Campo id="r-estudios" etiqueta="Último nivel de estudios alcanzado" ayuda="No necesitas experiencia previa ni estudios específicos para iniciar los cursos.">
                <select id="r-estudios" name="ultimo_estudio" required defaultValue={p.ultimo_estudio || ""}>
                  <option value="">Selecciona una opción</option>
                  {ESTUDIOS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
              <fieldset className="campo inscripcion-checklist">
                <legend>Soportes académicos disponibles (opcional)</legend>
                {SOPORTES.map(([valor, texto]) => (
                  <label key={valor}><input type="checkbox" name="documentos_disponibles" value={valor} defaultChecked={(p.documentos_disponibles || []).includes(valor)} /> {texto}</label>
                ))}
                <small className="form-ayuda">Son orientativos y no bloquean tu inscripción a cursos.</small>
              </fieldset>
              {menor && (
                <section className="inscripcion-tutor">
                  <h3>Información de madre, padre o acudiente</h3>
                  <p className="form-ayuda">Como tienes menos de 18 años, necesitaremos una persona adulta de contacto.</p>
                  <Campo id="r-acudiente-nombre" etiqueta="Nombre completo"><input id="r-acudiente-nombre" name="acudiente_nombre" type="text" autoComplete="off" required minLength={5} maxLength={120} defaultValue={p.acudiente_nombre || ""} /></Campo>
                  <div className="fila-campos">
                    <Campo id="r-acudiente-telefono" etiqueta="Teléfono"><input id="r-acudiente-telefono" name="acudiente_telefono" type="tel" autoComplete="off" required minLength={7} maxLength={25} defaultValue={p.acudiente_telefono || ""} /></Campo>
                    <Campo id="r-acudiente-correo" etiqueta="Correo electrónico"><input id="r-acudiente-correo" name="acudiente_correo" type="email" autoComplete="off" required maxLength={120} defaultValue={p.acudiente_correo || ""} /></Campo>
                  </div>
                </section>
              )}
              {!completando && (
                <div className="registro-credenciales">
                  <Campo id="r-clave" etiqueta="Crea una contraseña" ayuda="Mínimo 8 caracteres, con letras y números.">
                    <input id="r-clave" name="clave" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
                  </Campo>
                  <Campo id="r-confirmar" etiqueta="Confirma tu contraseña">
                    <input id="r-confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength={8} />
                  </Campo>
                </div>
              )}
              <div className="campo campo-check">
                <input id="r-acepto" name="acepto" type="checkbox" required />
                <label htmlFor="r-acepto">Autorizo a Talento Caribe a usar estos datos para gestionar mi cuenta y el proceso de inscripción.</label>
              </div>
              <div className="demo-aviso">
                {modoApi
                  ? <><strong>Tus datos están protegidos</strong><p>Se guardan en el servidor de Talento Caribe con la contraseña cifrada. Te enviaremos un correo de bienvenida y los avisos de tu inscripción.</p></>
                  : <><strong>Modo de demostración</strong><p>El perfil y el número de documento quedan guardados en este navegador; todavía no se envía correo ni se usa un servidor seguro. No ingreses datos reales hasta conectar el sistema de registro seguro.</p></>}
              </div>
              {error && <p className="form-estado estado-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? <span className="spinner" aria-hidden="true" /> : completando ? "Guardar perfil y continuar" : "Crear cuenta e inscribirme"}
              </button>
          </fieldset>
        </form>
        {!completando && (
          <p className="login-volver">¿Ya tienes cuenta? <a href={`admin/login.html?rol=estudiante${cursoId > 0 ? `&curso=${encodeURIComponent(cursoId)}` : ""}`}>Inicia sesión</a></p>
        )}
        <p className="login-volver"><a href="cursos.html">← Volver a los cursos</a></p>
      </section>
    </main>
  );
}
