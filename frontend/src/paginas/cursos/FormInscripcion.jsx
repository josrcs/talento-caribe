/* ==========================================================
   FormInscripcion.jsx - Preinscripción de un estudiante con sesión iniciada
   1. Revisa y completa su perfil (país, documento, contacto, acudiente si es menor).
   2. PUT /api/auth/perfil guarda el perfil y POST /api/inscripciones la solicitud.
   El equipo de admisiones la aprueba en el panel y el curso aparece en el portal.
   ========================================================== */
import { useState } from "react";
import Modal from "../../componentes/Modal.jsx";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { pedir } from "../../lib/api.js";
import { guardarSesion } from "../../lib/sesion.js";
import { edadDe, norm } from "../../lib/utils.js";
import { ESTUDIOS, GUIAS_PAIS, PAISES } from "./guiasPais.js";

const DOCUMENTOS = [
  ["acta_nacimiento", "Registro civil / acta de nacimiento (si aplica)"],
  ["domicilio", "Comprobante de domicilio (si aplica)"],
  ["certificado", "Certificado o constancia de estudios"],
  ["calificaciones", "Boletín o certificado de calificaciones"],
  ["acudiente", "Documento de madre, padre o acudiente (si eres menor)"],
  ["ninguno", "Aún no tengo esos documentos"],
];

export default function FormInscripcion({ curso, ficha, sesion, alCerrar }) {
  const { modelo, acciones } = useDatos();
  const paisInicial = sesion?.pais ? (PAISES.includes(sesion.pais) ? sesion.pais : "Otro") : "";
  const [pais, setPais] = useState(paisInicial);
  const [nacimiento, setNacimiento] = useState(sesion?.fecha_nacimiento || "");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState("");

  const guia = GUIAS_PAIS[pais] || GUIAS_PAIS.Otro;
  const tienePais = Boolean(pais);
  const edad = edadDe(nacimiento);
  const menor = edad !== null && edad < 18;
  const docsGuardados = new Set(sesion?.documentos_disponibles || []);
  // Si el tipo de documento guardado no está en la lista del país, se agrega para no perderlo
  const tiposDoc = sesion?.tipo_documento && !guia.docs.includes(sesion.tipo_documento) ? [...guia.docs, sesion.tipo_documento] : guia.docs;

  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const f = form.elements, v = (n) => (f[n]?.value || "").trim();
    if (modelo.inscripciones().some((i) => Number(i.curso_id) === Number(curso.id) && norm(i.correo) === norm(sesion.correo))) {
      setEstado("Tu cuenta ya tiene una solicitud para este curso."); return;
    }
    const edadMinima = Number(curso.edadMinima ?? 14);
    if (edad < edadMinima) { setEstado(`Este curso está dirigido a personas desde los ${edadMinima} años. Puedes explorar otros programas.`); return; }
    const perfil = {
      nombre: sesion.nombre, correo: sesion.correo, pais: pais === "Otro" ? v("pais_otro") : pais,
      tipo_documento: f.tipo_documento.value, numero_documento: v("numero_documento"), fecha_nacimiento: nacimiento,
      telefono: v("telefono"), direccion: v("direccion"), ciudad: v("ciudad"), region: v("region"), codigo_postal: v("codigo_postal"),
      ultimo_estudio: f.ultimo_estudio.value, documentos_disponibles: new FormData(form).getAll("documentos_disponibles"),
      acudiente_nombre: menor ? v("tutor_nombre") : "", acudiente_documento: menor ? v("tutor_documento") : "", acudiente_telefono: menor ? v("tutor_telefono") : "",
    };
    setEnviando(true); setEstado("");
    try {
      const usuario = await pedir("PUT", "/auth/perfil", perfil);
      guardarSesion({ ...sesion, ...usuario, token: sesion.token });
      await acciones.inscribir(curso.id, ficha);
      setEstado("Tu solicitud quedó guardada. Te avisaremos cuando el equipo de admisiones confirme tu cupo.");
    } catch (problema) {
      setEstado(problema.message || "No pudimos enviar la solicitud. Inténtalo de nuevo.");
    } finally { setEnviando(false); }
  }

  const s = sesion || {};
  return (
    <Modal abierto={Boolean(curso)} alCerrar={alCerrar} etiqueta="mi-titulo" id="modal-inscripcion">
      {curso && (
        <form id="form-inscripcion" className="modal-contenido form" noValidate onSubmit={enviar}>
          <button type="button" className="modal-cerrar" aria-label="Cerrar formulario" onClick={alCerrar}>&times;</button>
          <span className="eyebrow">Preinscripción gratuita</span>
          <h2 id="mi-titulo">Revisa tu información</h2>
          <p className="modal-sub">{`Curso: ${curso.titulo} · Ficha ${ficha}`}</p>
          <div className="campo">
            <label htmlFor="i-pais">¿De qué país eres?</label>
            <select id="i-pais" name="pais" required value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="">Selecciona tu país</option>
              {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value="Otro">Otro país</option>
            </select>
          </div>
          {pais === "Otro" && (
            <div className="campo">
              <label htmlFor="i-pais-otro">Escribe el nombre de tu país</label>
              <input id="i-pais-otro" name="pais_otro" type="text" autoComplete="country-name" maxLength="60" required defaultValue={paisInicial === "Otro" ? s.pais : ""} />
            </div>
          )}
          {tienePais && (
            <>
              <section className="inscripcion-requisitos" aria-live="polite">
                <h3>{`Antes de continuar: documentos habituales en ${pais === "Otro" ? "tu país" : pais}`}</h3>
                <p>{guia.texto + (guia.fuente ? ` Fuente orientativa: ${guia.fuenteNombre}.` : "")}</p>
                {guia.fuente && <p className="nota-requisitos">Consulta también la <a href={guia.fuente} target="_blank" rel="noopener noreferrer">{guia.fuenteTexto}</a>.</p>}
                <p className="nota-requisitos">Esta es una guía inicial para una preinscripción a cursos. La institución puede confirmar requisitos adicionales al abrir la matrícula.</p>
              </section>
              <div className="inscripcion-datos">
                <div className="campo">
                  <label htmlFor="i-nombre">Nombre completo</label>
                  <input id="i-nombre" name="nombre" type="text" autoComplete="name" required minLength="3" defaultValue={s.nombre} readOnly={Boolean(s.nombre)} />
                </div>
                <div className="fila-campos">
                  <div className="campo">
                    <label htmlFor="i-tipo-documento">Tipo de documento</label>
                    <select id="i-tipo-documento" name="tipo_documento" required defaultValue={s.tipo_documento || ""} key={pais}>
                      <option value="">Selecciona tu documento</option>
                      {tiposDoc.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor="i-numero-documento">Número de identificación</label>
                    <input id="i-numero-documento" name="numero_documento" type="text" autoComplete="off" required maxLength="40" defaultValue={s.numero_documento} />
                  </div>
                </div>
                <div className="fila-campos">
                  <div className="campo">
                    <label htmlFor="i-nacimiento">Fecha de nacimiento</label>
                    <input id="i-nacimiento" name="fecha_nacimiento" type="date" autoComplete="bday" required max={new Date().toISOString().slice(0, 10)} value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label htmlFor="i-correo">Correo electrónico</label>
                    <input id="i-correo" name="correo" type="email" autoComplete="email" required defaultValue={s.correo} readOnly />
                  </div>
                  <div className="campo">
                    <label htmlFor="i-telefono">Teléfono / WhatsApp</label>
                    <input id="i-telefono" name="telefono" type="tel" autoComplete="tel" required maxLength="25" defaultValue={s.telefono} />
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="i-direccion">Dirección completa</label>
                  <input id="i-direccion" name="direccion" type="text" autoComplete="street-address" required maxLength="180" defaultValue={s.direccion} />
                </div>
                <div className="fila-campos">
                  <div className="campo"><label htmlFor="i-ciudad">Ciudad / municipio</label><input id="i-ciudad" name="ciudad" type="text" autoComplete="address-level2" required maxLength="80" defaultValue={s.ciudad} /></div>
                  <div className="campo"><label htmlFor="i-region">Departamento / estado / región</label><input id="i-region" name="region" type="text" autoComplete="address-level1" required maxLength="80" defaultValue={s.region} /></div>
                  <div className="campo"><label htmlFor="i-codigo-postal">Código postal</label><input id="i-codigo-postal" name="codigo_postal" type="text" autoComplete="postal-code" required maxLength="16" defaultValue={s.codigo_postal} /></div>
                </div>
                <div className="campo">
                  <label htmlFor="i-ultimo-estudio">Último nivel de estudios aprobado</label>
                  <select id="i-ultimo-estudio" name="ultimo_estudio" required defaultValue={s.ultimo_estudio || ""}>
                    <option value="">Selecciona una opción</option>
                    {ESTUDIOS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <fieldset className="campo inscripcion-checklist">
                  <legend>Documentos académicos que tienes disponibles</legend>
                  {DOCUMENTOS.map(([valor, texto]) => <label key={valor}><input type="checkbox" name="documentos_disponibles" value={valor} defaultChecked={docsGuardados.has(valor)} /> {texto}</label>)}
                </fieldset>
                {menor && (
                  <div className="inscripcion-tutor">
                    <h3>Datos de tu madre, padre o acudiente</h3>
                    <div className="campo"><label htmlFor="i-tutor-nombre">Nombre completo del acudiente</label><input id="i-tutor-nombre" name="tutor_nombre" type="text" autoComplete="off" maxLength="100" required defaultValue={s.acudiente_nombre} /></div>
                    <div className="fila-campos">
                      <div className="campo"><label htmlFor="i-tutor-documento">Documento del acudiente</label><input id="i-tutor-documento" name="tutor_documento" type="text" maxLength="40" defaultValue={s.acudiente_documento} /></div>
                      <div className="campo"><label htmlFor="i-tutor-telefono">Teléfono del acudiente</label><input id="i-tutor-telefono" name="tutor_telefono" type="tel" autoComplete="off" maxLength="25" required defaultValue={s.acudiente_telefono} /></div>
                    </div>
                  </div>
                )}
                <div className="campo campo-check">
                  <input id="i-acepto" name="acepto" type="checkbox" required />
                  <label htmlFor="i-acepto">Autorizo a Talento Caribe a usar estos datos para gestionar mi preinscripción y contactarme.</label>
                </div>
                <p className="nota-requisitos">Tu perfil y tu solicitud se guardan de forma segura en la base de datos de Talento Caribe. Solo el equipo de admisiones puede verlos.</p>
              </div>
              <div className="modal-acciones">
                <BotonCarga cargando={enviando} id="inscripcion-enviar">Enviar preinscripción</BotonCarga>
                <button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button>
              </div>
            </>
          )}
          {estado && <p id="inscripcion-estado" className="form-estado" role="status" aria-live="polite">{estado}</p>}
        </form>
      )}
    </Modal>
  );
}
