/* ==========================================================
   Privacidad.jsx - Política de Tratamiento de Datos Personales (privacidad.html)
   Ley 1581 de 2012 (Colombia). El registro y el formulario de contacto enlazan esta página
   y el servidor guarda la versión aceptada (POLITICA_VERSION) como prueba de la autorización.
   REVISAR ANTES DE PUBLICAR: los datos del responsable (nombre, ciudad y correo) deben ser reales.
   El texto legal se publica en español (data-no-traducir): es la versión que vale.
   ========================================================== */
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import { CORREO_DATOS, POLITICA_VERSION, POLITICA_VIGENCIA } from "../../lib/config.js";
import { idioma } from "../../i18n/idioma.js";

const ENLACES = [
  { href: "index.html", texto: "Inicio" },
  { href: "cursos.html", texto: "Cursos" },
  { href: "encuesta.html", texto: "Encuesta" },
];
const Correo = () => <a href={`mailto:${CORREO_DATOS}`}>{CORREO_DATOS}</a>;

export default function Privacidad() {
  return (
    <>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li><a href="admin/login.html" className="btn btn-outline">Ingresar</a></li>} />
      <main id="contenido" className="container legal">
        <span className="eyebrow">Tus datos, tus derechos</span>
        <h1>Política de Tratamiento de Datos Personales</h1>
        {idioma === "en" && <p className="demo-aviso legal-idioma" data-no-traducir>This policy is published in Spanish, which is the legally binding version under Colombian law (Law 1581 of 2012).</p>}
        <div data-no-traducir>
          <p className="legal-meta">Versión {POLITICA_VERSION} · Vigente desde el {POLITICA_VIGENCIA} · Aplica la Ley Estatutaria 1581 de 2012 y sus decretos reglamentarios (Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015).</p>

          <h2>1. Responsable del tratamiento</h2>
          <div className="legal-caja">
            <strong>Talento Caribe</strong>, representado por José Rodríguez (fundador).<br />
            Ubicación: Barranquilla, Colombia.<br />
            Correo para consultas, reclamos y ejercicio de tus derechos: <Correo />
          </div>

          <h2>2. Qué datos recolectamos</h2>
          <ul>
            <li><strong>Cuenta e inscripción:</strong> nombre completo, correo electrónico, contraseña (se guarda cifrada, nunca en texto plano), país, tipo y número de documento de identidad, fecha de nacimiento, teléfono, dirección de residencia, ciudad, departamento o región, código postal y último nivel de estudios.</li>
            <li><strong>Personas menores de 18 años:</strong> además, nombre, teléfono y correo de su madre, padre o acudiente.</li>
            <li><strong>Actividad académica:</strong> cursos a los que te inscribes, entregas, calificaciones y comentarios de tus docentes.</li>
            <li><strong>Formulario de contacto:</strong> nombre, correo, teléfono (opcional) y el mensaje que escribas.</li>
            <li><strong>Encuestas:</strong> son voluntarias. La encuesta pública es <strong>anónima</strong>: no pide nombre, correo ni documento, y se guarda sin ningún dato de quien responde. Las encuestas del portal se muestran al equipo agrupadas, sin tu nombre. Te pedimos no escribir datos personales en las respuestas abiertas.</li>
            <li><strong>Asistente con inteligencia artificial:</strong> las preguntas que le escribas se envían a un proveedor de IA para generar la respuesta. No escribas allí datos personales tuyos ni de otras personas.</li>
            <li><strong>Seguridad:</strong> fecha, dirección IP y navegador de los ingresos e intentos fallidos, para proteger las cuentas.</li>
            <li><strong>En tu navegador:</strong> guardamos tu sesión, tus preferencias (tema e idioma) y el historial del asistente con el almacenamiento local del navegador. No usamos cookies de publicidad.</li>
          </ul>
          <p>No te pedimos datos sensibles (salud, orientación sexual, creencias, origen étnico, datos biométricos, etc.). Si alguna vez los incluyes por tu cuenta en un mensaje, puedes pedir su eliminación.</p>

          <h2>3. Para qué usamos tus datos</h2>
          <ul>
            <li>Crear y administrar tu cuenta y gestionar tu inscripción a los cursos.</li>
            <li>Identificarte, verificar requisitos de edad y contactar a tu acudiente cuando seas menor de edad.</li>
            <li>Permitir que tus docentes publiquen actividades, reciban tus entregas y te califiquen.</li>
            <li>Responder los mensajes que nos envíes y enviarte avisos del proceso de inscripción.</li>
            <li>Mejorar los cursos y la plataforma con los resultados agrupados de las encuestas.</li>
          </ul>
          <p>No vendemos ni cedemos tus datos a terceros para publicidad.</p>

          <h2>4. Datos de niñas, niños y adolescentes</h2>
          <p>La Ley 1581 de 2012 (art. 7) exige asegurar el respeto de los derechos prevalentes de los menores de 18 años. Por eso, cuando quien se inscribe es menor de edad, solo tratamos sus datos con la <strong>autorización previa, expresa e informada de su madre, padre o representante legal</strong>, y teniendo en cuenta la opinión de la persona menor según su madurez. Guardamos la fecha y la versión de esta política aceptada como prueba de la autorización. Solo recolectamos los datos necesarios para la inscripción y el seguimiento académico.</p>

          <h2>5. Tus derechos como titular</h2>
          <ul>
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización que nos diste.</li>
            <li>Ser informado sobre el uso que hemos dado a tus datos.</li>
            <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten las garantías legales o ya no sean necesarios.</li>
            <li>Acceder de forma gratuita a tus datos personales.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
          </ul>

          <h2>6. Cómo ejercer tus derechos</h2>
          <p>Escribe a <Correo /> indicando tu nombre, el correo con el que te registraste y lo que solicitas. Las <strong>consultas</strong> se responden en máximo 10 días hábiles (prorrogables 5 más) y los <strong>reclamos</strong> en máximo 15 días hábiles (prorrogables 8 más), conforme a la ley. Si eres menor de edad, la solicitud la hace tu madre, padre o representante legal.</p>

          <h2>7. Con quién compartimos o dónde se almacenan los datos</h2>
          <p>Usamos proveedores tecnológicos para operar la plataforma: alojamiento de la página (GitHub Pages), servidor y base de datos (Render), envío de correos (Brevo) y el asistente con inteligencia artificial (Google Gemini). Estos proveedores pueden tener sus servidores fuera de Colombia, por lo que tus datos pueden ser tratados en otros países. Solo compartimos tus datos con ellos para operar el servicio. Tu información de inscripción solo la ve el equipo autorizado de Talento Caribe (por ejemplo, admisiones) y tus docentes en lo que necesiten para tus cursos.</p>

          <h2>8. Seguridad</h2>
          <p>Aplicamos medidas razonables: contraseñas cifradas, conexiones seguras (HTTPS), acceso por roles y límites contra intentos de abuso. Ningún sistema es 100&nbsp;% infalible; si detectamos un incidente que afecte tus datos, lo gestionaremos y te informaremos según corresponda.</p>

          <h2>9. Cuánto tiempo conservamos tus datos</h2>
          <p>Mientras tengas una cuenta activa o sea necesario para el seguimiento académico. Cuando solicites la supresión, eliminaremos tus datos salvo que la ley nos exija conservarlos.</p>

          <h2>10. Cambios a esta política</h2>
          <p>Si la modificamos de forma sustancial, publicaremos la nueva versión en esta página y, cuando la ley lo exija, volveremos a pedir tu autorización.</p>
        </div>
      </main>
      <PiePublico />
    </>
  );
}
