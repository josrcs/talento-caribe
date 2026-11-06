/* ModalInscripcion - Preinscripción a un curso para un estudiante con sesión iniciada.
   Primero pide el país (los documentos cambian según el país); luego muestra los datos del perfil
   para confirmarlos. Si la persona es menor de 18, pide los datos de su acudiente.
   Al enviar: actualiza el perfil (TCAuth) y crea la inscripción (TCDatos). */
import { useState } from "react";
import { PAISES, GUIAS, ESTUDIOS, DOCUMENTOS_ACADEMICOS } from "./requisitos.js";
import { auth, datos, sesion, guardarSesion, edadDesde, buscarCurso } from "../../lib/plataforma.js";
import { useDialogo } from "../../lib/ganchos.js";

const hoy = () => new Date().toISOString().slice(0, 10);

/* País guardado en el perfil → opción de la lista ("Otro" si no está) */
function paisInicial(perfil) {
  if (!perfil?.pais) return { pais: "", otro: "" };
  return PAISES.includes(perfil.pais) ? { pais: perfil.pais, otro: "" } : { pais: "Otro", otro: perfil.pais };
}

function Campo({ id, etiqueta, children }) {
  return <div className="campo"><label htmlFor={id}>{etiqueta}</label>{children}</div>;
}

export default function ModalInscripcion({ inscripcion, alCerrar }) {
  const ref = useDialogo(Boolean(inscripcion), alCerrar);
  const perfil = sesion() || {};
  const inicial = paisInicial(perfil);
  const [pais, setPais] = useState(inicial.pais);
  const [nacimiento, setNacimiento] = useState(perfil.fecha_nacimiento || "");
  const [estado, setEstado] = useState("");
  const [enviando, setEnviando] = useState(false);
  if (!inscripcion) return <dialog className="modal" ref={ref} />;

  const { curso, ficha } = inscripcion;
  const guia = GUIAS[pais] || GUIAS.Otro;
  const menor = nacimiento !== "" && edadDesde(nacimiento) < 18;
  const textoGuia = `${guia.texto}${guia.fuenteCorta ? ` Fuente orientativa: ${guia.fuenteCorta}.` : ""}`;
  const modoApi = auth()?.api;

  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const actual = sesion();
    if (!actual || actual.rol !== "estudiante") { location.href = `registro.html?curso=${encodeURIComponent(curso.id)}`; return; }
    if (datos().inscripciones().some((i) => Number(i.curso_id) === Number(curso.id) && i.correo?.toLowerCase() === actual.correo?.toLowerCase())) {
      setEstado("Tu cuenta ya tiene una solicitud para este curso."); return;
    }
    const edad = edadDesde(nacimiento);
    const minima = Number(buscarCurso(curso.id)?.edadMinima ?? 14);
    if (edad < minima) { setEstado(`Este curso está dirigido a personas desde los ${minima} años. Puedes explorar otros programas.`); return; }

    const f = new FormData(form);
    const valor = (k) => String(f.get(k) || "").trim();
    const nuevoPerfil = {
      nombre: actual.nombre, correo: actual.correo,
      pais: pais === "Otro" ? valor("pais_otro") : pais,
      tipo_documento: valor("tipo_documento"), numero_documento: valor("numero_documento"), fecha_nacimiento: nacimiento,
      telefono: valor("telefono"), direccion: valor("direccion"), ciudad: valor("ciudad"), region: valor("region"),
      codigo_postal: valor("codigo_postal"), ultimo_estudio: valor("ultimo_estudio"), documentos_disponibles: f.getAll("documentos_disponibles"),
      acudiente_nombre: valor("tutor_nombre"), acudiente_documento: valor("tutor_documento"), acudiente_telefono: valor("tutor_telefono"),
    };
    setEnviando(true);
    try {
      const actualizada = await auth().actualizarPerfil(nuevoPerfil);
      guardarSesion(actualizada);
      await datos().inscribir(Number(curso.id), edad, actualizada, ficha);
      setEstado(modoApi
        ? "Tu solicitud quedó guardada. Te avisaremos cuando el equipo de admisiones confirme tu cupo."
        : "Tu solicitud y perfil quedaron guardados en este navegador. Te avisaremos cuando el equipo confirme tu cupo.");
    } catch (problema) {
      setEstado(problema.message || "No pudimos enviar la solicitud. Inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  return (
    <dialog className="modal" aria-labelledby="mi-titulo" ref={ref}>
      <form className="modal-contenido form" noValidate onSubmit={enviar}>
        <button type="button" className="modal-cerrar" aria-label="Cerrar formulario" onClick={alCerrar}>×</button>
        <span className="eyebrow">Preinscripción gratuita</span>
        <h2 id="mi-titulo">Revisa tu información</h2>
        <p className="modal-sub">{`Curso: ${curso.titulo} · Ficha ${ficha}`}</p>

        <Campo id="i-pais" etiqueta="¿De qué país eres?">
          <select id="i-pais" name="pais" required value={pais} onChange={(e) => setPais(e.target.value)}>
            <option value="">Selecciona tu país</option>
            {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="Otro">Otro país</option>
          </select>
        </Campo>

        {pais && (
          <>
            {pais === "Otro" && (
              <Campo id="i-pais-otro" etiqueta="Escribe el nombre de tu país">
                <input id="i-pais-otro" name="pais_otro" type="text" autoComplete="country-name" maxLength={60} required defaultValue={inicial.otro} />
              </Campo>
            )}
            <section className="inscripcion-requisitos" aria-live="polite">
              <h3>{`Antes de continuar: documentos habituales en ${pais === "Otro" ? "tu país" : pais}`}</h3>
              <p>{textoGuia}</p>
              {guia.fuente && <p className="nota-requisitos">Consulta también la <a href={guia.fuente} target="_blank" rel="noopener noreferrer">{guia.fuenteTexto}</a>.</p>}
              <p className="nota-requisitos">Esta es una guía inicial para una preinscripción a cursos. La institución puede confirmar requisitos adicionales al abrir la matrícula.</p>
            </section>

            <div className="inscripcion-datos">
              <Campo id="i-nombre" etiqueta="Nombre completo">
                <input id="i-nombre" name="nombre" type="text" autoComplete="name" required minLength={3} defaultValue={perfil.nombre || ""} readOnly={Boolean(perfil.nombre)} />
              </Campo>
              <div className="fila-campos">
                <Campo id="i-tipo-documento" etiqueta="Tipo de documento">
                  <select id="i-tipo-documento" name="tipo_documento" required defaultValue={perfil.tipo_documento || ""} key={pais}>
                    <option value="">Selecciona tu documento</option>
                    {guia.docs.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Campo>
                <Campo id="i-numero-documento" etiqueta="Número de identificación">
                  <input id="i-numero-documento" name="numero_documento" type="text" autoComplete="off" required maxLength={40} defaultValue={perfil.numero_documento || ""} />
                </Campo>
              </div>
              <div className="fila-campos">
                <Campo id="i-nacimiento" etiqueta="Fecha de nacimiento">
                  <input id="i-nacimiento" name="fecha_nacimiento" type="date" autoComplete="bday" required max={hoy()} value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} />
                </Campo>
                <Campo id="i-correo" etiqueta="Correo electrónico">
                  <input id="i-correo" name="correo" type="email" autoComplete="email" required defaultValue={perfil.correo || ""} readOnly={Boolean(perfil.correo)} />
                </Campo>
                <Campo id="i-telefono" etiqueta="Teléfono / WhatsApp">
                  <input id="i-telefono" name="telefono" type="tel" autoComplete="tel" required maxLength={25} defaultValue={perfil.telefono || ""} />
                </Campo>
              </div>
              <Campo id="i-direccion" etiqueta="Dirección completa">
                <input id="i-direccion" name="direccion" type="text" autoComplete="street-address" required maxLength={180} defaultValue={perfil.direccion || ""} />
              </Campo>
              <div className="fila-campos">
                <Campo id="i-ciudad" etiqueta="Ciudad / municipio">
                  <input id="i-ciudad" name="ciudad" type="text" autoComplete="address-level2" required maxLength={80} defaultValue={perfil.ciudad || ""} />
                </Campo>
                <Campo id="i-region" etiqueta="Departamento / estado / región">
                  <input id="i-region" name="region" type="text" autoComplete="address-level1" required maxLength={80} defaultValue={perfil.region || ""} />
                </Campo>
                <Campo id="i-codigo-postal" etiqueta="Código postal">
                  <input id="i-codigo-postal" name="codigo_postal" type="text" autoComplete="postal-code" required maxLength={16} defaultValue={perfil.codigo_postal || ""} />
                </Campo>
              </div>
              <Campo id="i-ultimo-estudio" etiqueta="Último nivel de estudios aprobado">
                <select id="i-ultimo-estudio" name="ultimo_estudio" required defaultValue={perfil.ultimo_estudio || ""}>
                  <option value="">Selecciona una opción</option>
                  {ESTUDIOS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </Campo>
              <fieldset className="campo inscripcion-checklist">
                <legend>Documentos académicos que tienes disponibles</legend>
                {DOCUMENTOS_ACADEMICOS.map(([valor, texto]) => (
                  <label key={valor}>
                    <input type="checkbox" name="documentos_disponibles" value={valor} defaultChecked={(perfil.documentos_disponibles || []).includes(valor)} /> {texto}
                  </label>
                ))}
              </fieldset>
              {menor && (
                <div className="inscripcion-tutor">
                  <h3>Datos de tu madre, padre o acudiente</h3>
                  <Campo id="i-tutor-nombre" etiqueta="Nombre completo del acudiente">
                    <input id="i-tutor-nombre" name="tutor_nombre" type="text" autoComplete="off" maxLength={100} required defaultValue={perfil.acudiente_nombre || ""} />
                  </Campo>
                  <div className="fila-campos">
                    <Campo id="i-tutor-documento" etiqueta="Documento del acudiente">
                      <input id="i-tutor-documento" name="tutor_documento" type="text" maxLength={40} defaultValue={perfil.acudiente_documento || ""} />
                    </Campo>
                    <Campo id="i-tutor-telefono" etiqueta="Teléfono del acudiente">
                      <input id="i-tutor-telefono" name="tutor_telefono" type="tel" autoComplete="off" maxLength={25} required defaultValue={perfil.acudiente_telefono || ""} />
                    </Campo>
                  </div>
                </div>
              )}
              <div className="campo campo-check">
                <input id="i-acepto" name="acepto" type="checkbox" required />
                <label htmlFor="i-acepto">Autorizo a Talento Caribe a usar estos datos para gestionar mi preinscripción y contactarme.</label>
              </div>
              <p className="nota-requisitos">
                {modoApi
                  ? "Tu perfil y tu solicitud se guardan de forma segura en la base de datos de Talento Caribe. Solo el equipo de admisiones puede verlos."
                  : "Modo de demostración: el perfil y la solicitud se guardan en este navegador y no se envían a un servidor seguro. No ingreses datos reales en esta versión."}
              </p>
            </div>
            <div className="modal-acciones">
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? <span className="spinner" aria-hidden="true" /> : "Enviar preinscripción"}
              </button>
              <button type="button" className="btn btn-outline" onClick={alCerrar}>Cancelar</button>
            </div>
          </>
        )}
        <p className="form-estado" role="status" aria-live="polite" hidden={!estado}>{estado}</p>
      </form>
    </dialog>
  );
}
