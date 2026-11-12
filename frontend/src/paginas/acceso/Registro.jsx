/* ==========================================================
   Registro.jsx - Crear la cuenta de estudiante (registro.html)
   Paso 1: el país (cambia los tipos de documento). Paso 2: datos personales,
   acudiente si es menor de 18 años y contraseña.
   POST /api/auth/registro guarda la cuenta en PostgreSQL (contraseña con bcrypt)
   y envía un correo de bienvenida; devuelve el token de la sesión.
   Con ?completar=1 (sesión de estudiante) edita el perfil: PUT /api/auth/perfil.
   Con ?curso=ID, al terminar vuelve al curso para enviar la solicitud.
   ========================================================== */
import { useRef, useState } from "react";
import Logo from "../../componentes/Logo.jsx";
import Preferencias from "../../componentes/Preferencias.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { pedir } from "../../lib/api.js";
import { parametros } from "../../lib/rutas.js";
import { guardarSesion, leerSesion } from "../../lib/sesion.js";
import { edadDe, problemaClave } from "../../lib/utils.js";
import { ESTUDIOS } from "../cursos/guiasPais.js";

const PAISES = ["Colombia", "Venezuela", "Ecuador", "Perú", "México", "Argentina", "Chile", "Otro país"];
const TIPOS_DOCUMENTO = {
  Colombia: ["Cédula de ciudadanía", "Tarjeta de identidad", "Cédula de extranjería", "PEP (Permiso Especial de Permanencia)"],
  generico: ["Documento nacional de identidad", "Pasaporte", "Documento de extranjería o residencia", "Otro documento oficial"],
};
const SOPORTES = [["certificado", "Certificado o constancia de estudios"], ["calificaciones", "Boletín o calificaciones"], ["acta_nacimiento", "Registro civil o acta de nacimiento (si aplica)"], ["ninguno", "Todavía no cuento con estos soportes"]];

export default function Registro() {
  const { modelo } = useDatos();
  const p = parametros();
  const cursoId = Number(p.get("curso"));
  const sesion = leerSesion();
  const editando = p.get("completar") === "1" && sesion?.rol === "estudiante";
  const destino = cursoId > 0 ? `cursos.html?continuar=${encodeURIComponent(cursoId)}` : "portal.html";
  const s = editando ? sesion : {};
  const paisGuardado = editando ? (PAISES.includes(s.pais) ? s.pais : "Otro país") : "";

  const [pais, setPais] = useState(paisGuardado);
  const [paso, setPaso] = useState(editando ? 2 : 1);
  const [nacimiento, setNacimiento] = useState(s.fecha_nacimiento || "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const selectPais = useRef(null), nombre = useRef(null);

  const colombia = pais === "Colombia";
  const tipos = colombia ? TIPOS_DOCUMENTO.Colombia : TIPOS_DOCUMENTO.generico;
  const edad = edadDe(nacimiento);
  const menor = edad !== null && edad < 18;
  const docs = new Set(s.documentos_disponibles || []);

  function continuar() {
    if (!selectPais.current.reportValidity()) return;
    setPaso(2);
    setTimeout(() => nombre.current?.focus());
  }
  /* Valida con los mensajes del navegador: un campo que no cumple muestra su aviso */
  const avisar = (campo, mensaje) => {
    campo.setCustomValidity(mensaje); campo.reportValidity();
    campo.addEventListener("input", () => campo.setCustomValidity(""), { once: true });
  };

  async function enviar(e) {
    e.preventDefault(); setError("");
    const form = e.currentTarget, f = form.elements, v = (n) => (f[n]?.value || "").trim();
    if (!form.reportValidity()) return;
    if (v("correo").toLowerCase() !== v("confirmar_correo").toLowerCase()) { avisar(f.confirmar_correo, "Los correos no coinciden."); return; }
    const curso = modelo.curso(cursoId);
    const edadMinima = curso ? Number(curso.edadMinima ?? 14) : 0;
    if (curso && edad < edadMinima) { setError(`Este curso está dirigido a personas desde los ${edadMinima} años. Puedes explorar otros programas.`); return; }
    if (!editando) {
      // Misma regla de contraseña que el servidor: letras y números, no muy común ni con el correo dentro
      const problema = problemaClave(f.clave.value, v("correo"));
      if (problema) { avisar(f.clave, problema); return; }
      if (f.clave.value !== f.confirmar.value) { avisar(f.confirmar, "Las contraseñas no coinciden."); return; }
    }
    const perfil = {
      nombre: v("nombre"), pais: pais === "Otro país" ? v("pais_otro") : pais, correo: v("correo").toLowerCase(),
      tipo_documento: f.tipo_documento.value, numero_documento: v("numero_documento"), fecha_nacimiento: nacimiento,
      telefono: v("telefono"), direccion: v("direccion"), ciudad: v("ciudad"), region: v("region"), codigo_postal: v("codigo_postal"),
      ultimo_estudio: f.ultimo_estudio.value, documentos_disponibles: new FormData(form).getAll("documentos_disponibles"),
      acudiente_nombre: menor ? v("acudiente_nombre") : "", acudiente_telefono: menor ? v("acudiente_telefono") : "", acudiente_correo: menor ? v("acudiente_correo") : "",
    };
    setEnviando(true);
    try {
      if (editando) {
        const usuario = await pedir("PUT", "/auth/perfil", perfil);
        guardarSesion({ ...sesion, ...usuario, token: sesion.token });
      } else {
        const { token, usuario } = await pedir("POST", "/auth/registro", { ...perfil, clave: f.clave.value, acepta_politica: f.acepto.checked, autoriza_acudiente: menor ? f.autoriza_acudiente.checked : undefined });
        guardarSesion({ ...usuario, token });
      }
      location.replace(destino);
    } catch (problema) {
      setError(problema.message || "No pudimos guardar el perfil. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <>
      <Preferencias flotante />
      <main className="login login-shell registro-shell">
        <section className="login-story" aria-label="Talento Caribe">
          <a href="index.html" className="login-logo"><Logo tipo="completo-sm" alt="Talento Caribe — inicio" width="208" height="177" /></a>
          <div className="login-story-copy"><span className="eyebrow">Tu talento no tiene fronteras</span><h1>Tu aprendizaje comienza con una cuenta.</h1><p>Sin experiencia previa. Regístrate, explora los cursos y aprende a tu ritmo.</p></div>
          <div className="login-stat"><span className="login-stat-icon" aria-hidden="true">✦</span><div><strong>Aprende haciendo</strong><small>Una comunidad abierta para todas las personas</small></div></div>
        </section>
        <section className="login-card registro-card" aria-labelledby="registro-titulo">
          <div className="login-card-heading">
            <Logo className="login-card-logo" tipo="emblema" width="64" height="48" />
            <span className="eyebrow">Comunidad Talento Caribe</span>
            <h2 id="registro-titulo">{editando ? "Completa tu perfil" : "Crea tu cuenta"}</h2>
            <p>{editando ? "Antes de enviar tu solicitud de curso, completa los datos que faltan en tu perfil." : "Primero dinos de qué país eres para mostrarte los documentos adecuados."}</p>
          </div>
          <form id="form-registro" className="form login-form" noValidate onSubmit={enviar}>
            <div className="registro-paso" hidden={paso !== 1}>
              <div className="campo">
                <label htmlFor="r-pais">¿De qué país eres?</label>
                <select ref={selectPais} id="r-pais" name="pais" autoComplete="country-name" required value={pais} onChange={(e) => setPais(e.target.value)}>
                  <option value="">Selecciona tu país</option>
                  {PAISES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-primary" onClick={continuar}>Continuar con mis datos <span aria-hidden="true">→</span></button>
            </div>
            <fieldset className="registro-datos" hidden={paso !== 2} disabled={paso !== 2}>
              <legend>Datos personales y de contacto</legend>
              <button type="button" className="btn btn-outline btn-sm registro-cambiar-pais" onClick={() => { setPaso(1); setTimeout(() => selectPais.current?.focus()); }}>Cambiar país</button>
              <p className="form-ayuda" aria-live="polite">{colombia
                ? "Para Colombia puedes inscribirte con cédula de ciudadanía, tarjeta de identidad, cédula de extranjería o PEP. Ten a mano una constancia de estudios si el programa la solicita."
                : "Selecciona el documento oficial vigente en tu país. Si el curso necesita algún soporte académico adicional, el equipo te lo indicará durante el proceso."}</p>
              {pais === "Otro país" && <div className="campo"><label htmlFor="r-pais-otro">Escribe tu país</label><input id="r-pais-otro" name="pais_otro" type="text" autoComplete="country-name" maxLength="60" required defaultValue={paisGuardado === "Otro país" && s.pais !== "Otro" ? s.pais : ""} /></div>}
              <div className="campo"><label htmlFor="r-nombre">Nombres y apellidos completos</label><input ref={nombre} id="r-nombre" name="nombre" type="text" autoComplete="name" required minLength="5" maxLength="120" placeholder="Como aparecen en tu documento" defaultValue={s.nombre} /></div>
              <div className="fila-campos">
                <div className="campo"><label htmlFor="r-tipo-documento">Tipo de documento de identidad</label>
                  <select id="r-tipo-documento" name="tipo_documento" required defaultValue={tipos.includes(s.tipo_documento) ? s.tipo_documento : ""} key={colombia ? "co" : "otro"}>
                    <option value="">Selecciona tu documento</option>
                    {tipos.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div className="campo"><label htmlFor="r-numero-documento">Número del documento</label><input id="r-numero-documento" name="numero_documento" type="text" autoComplete="off" required minLength="5" maxLength="30" placeholder="Número de identificación" defaultValue={s.numero_documento} /></div>
              </div>
              <div className="fila-campos">
                <div className="campo"><label htmlFor="r-nacimiento">Fecha de nacimiento</label><input id="r-nacimiento" name="fecha_nacimiento" type="date" autoComplete="bday" required max={new Date().toISOString().slice(0, 10)} value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} /><small className="form-ayuda">La mayoría de los programas está dirigida a personas desde los 14 años; algunos cursos pueden variar.</small></div>
                <div className="campo"><label htmlFor="r-telefono">Teléfono de contacto</label><input id="r-telefono" name="telefono" type="tel" autoComplete="tel" required minLength="7" maxLength="25" placeholder="Incluye el indicativo de país" defaultValue={s.telefono} /></div>
              </div>
              <div className="campo"><label htmlFor="r-correo">Correo electrónico activo</label><input id="r-correo" name="correo" type="email" autoComplete="email" required maxLength="120" placeholder="nombre@correo.com" defaultValue={s.correo} readOnly={editando} /><small className="form-ayuda">Usaremos este correo para confirmaciones y avisos del proceso.</small></div>
              <div className="campo"><label htmlFor="r-confirmar-correo">Confirma tu correo electrónico</label><input id="r-confirmar-correo" name="confirmar_correo" type="email" autoComplete="email" required maxLength="120" defaultValue={s.correo} readOnly={editando} /></div>
              <div className="campo"><label htmlFor="r-direccion">Dirección completa de residencia</label><input id="r-direccion" name="direccion" type="text" autoComplete="street-address" required maxLength="180" placeholder="Vía, número, apartamento o barrio" defaultValue={s.direccion} /></div>
              <div className="fila-campos">
                <div className="campo"><label htmlFor="r-ciudad">Ciudad o municipio</label><input id="r-ciudad" name="ciudad" type="text" autoComplete="address-level2" required maxLength="80" defaultValue={s.ciudad} /></div>
                <div className="campo"><label htmlFor="r-region">Departamento, estado o región</label><input id="r-region" name="region" type="text" autoComplete="address-level1" required maxLength="80" defaultValue={s.region} /></div>
                <div className="campo"><label htmlFor="r-codigo-postal">Código postal</label><input id="r-codigo-postal" name="codigo_postal" type="text" autoComplete="postal-code" required maxLength="16" defaultValue={s.codigo_postal} /></div>
              </div>
              <div className="campo"><label htmlFor="r-estudios">Último nivel de estudios alcanzado</label>
                <select id="r-estudios" name="ultimo_estudio" required defaultValue={s.ultimo_estudio || ""}><option value="">Selecciona una opción</option>{ESTUDIOS.map((x) => <option key={x}>{x}</option>)}</select>
                <small className="form-ayuda">No necesitas experiencia previa ni estudios específicos para iniciar los cursos.</small>
              </div>
              <fieldset className="campo inscripcion-checklist"><legend>Soportes académicos disponibles (opcional)</legend>
                {SOPORTES.map(([valor, texto]) => <label key={valor}><input type="checkbox" name="documentos_disponibles" value={valor} defaultChecked={docs.has(valor)} /> {texto}</label>)}
                <small className="form-ayuda">Son orientativos y no bloquean tu inscripción a cursos.</small>
              </fieldset>
              {menor && (
                <section className="inscripcion-tutor">
                  <h3>Información de madre, padre o acudiente</h3><p className="form-ayuda">Como tienes menos de 18 años, necesitaremos una persona adulta de contacto.</p>
                  <div className="campo"><label htmlFor="r-acudiente-nombre">Nombre completo</label><input id="r-acudiente-nombre" name="acudiente_nombre" type="text" autoComplete="off" required minLength="5" maxLength="120" defaultValue={s.acudiente_nombre} /></div>
                  <div className="fila-campos">
                    <div className="campo"><label htmlFor="r-acudiente-telefono">Teléfono</label><input id="r-acudiente-telefono" name="acudiente_telefono" type="tel" autoComplete="off" required minLength="7" maxLength="25" defaultValue={s.acudiente_telefono} /></div>
                    <div className="campo"><label htmlFor="r-acudiente-correo">Correo electrónico</label><input id="r-acudiente-correo" name="acudiente_correo" type="email" autoComplete="off" required maxLength="120" defaultValue={s.acudiente_correo} /></div>
                  </div>
                </section>
              )}
              {!editando && (
                <div className="registro-credenciales">
                  <div className="campo"><label htmlFor="r-clave">Crea una contraseña</label><input id="r-clave" name="clave" type="password" autoComplete="new-password" required minLength="8" maxLength="72" /><small className="form-ayuda">Mínimo 8 caracteres, con letras y números.</small></div>
                  <div className="campo"><label htmlFor="r-confirmar">Confirma tu contraseña</label><input id="r-confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength="8" /></div>
                </div>
              )}
              {/* Autorización de datos (Ley 1581 de 2012): el servidor guarda la versión de la política y la fecha */}
              {!editando && <div className="campo campo-check"><input id="r-acepto" name="acepto" type="checkbox" required /><label htmlFor="r-acepto">Autorizo a Talento Caribe a tratar mis datos personales para gestionar mi cuenta y el proceso de inscripción, según la <a href="privacidad.html" target="_blank" rel="noopener">Política de Tratamiento de Datos Personales</a>.</label></div>}
              {!editando && menor && <div className="campo campo-check"><input id="r-autoriza-acudiente" name="autoriza_acudiente" type="checkbox" required /><label htmlFor="r-autoriza-acudiente">Soy menor de 18 años y mi madre, padre o acudiente conoce la política y autoriza mi registro y el tratamiento de mis datos.</label></div>}
              <div className="demo-aviso"><strong>Tus datos están protegidos</strong><p>Se guardan en el servidor de Talento Caribe con la contraseña cifrada. Te enviaremos un correo de bienvenida y los avisos de tu inscripción.</p></div>
              {error && <p className="form-estado estado-error" role="alert">{error}</p>}
              <BotonCarga cargando={enviando} id="registro-enviar">{editando ? "Guardar perfil y continuar" : "Crear cuenta e inscribirme"}</BotonCarga>
            </fieldset>
          </form>
          {!editando && <p className="login-volver">¿Ya tienes cuenta? <a href={`admin/login.html?rol=estudiante${cursoId > 0 ? `&curso=${encodeURIComponent(cursoId)}` : ""}`}>Inicia sesión</a></p>}
          <p className="login-volver"><a href="cursos.html">← Volver a los cursos</a></p>
        </section>
      </main>
      <AsistenteFlotante />
    </>
  );
}
