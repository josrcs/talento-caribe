/* ==========================================================
   correo.js - Correos de la plataforma (nodemailer + SMTP)
   - Bienvenida al crear la cuenta, enlace para recuperar la contraseña,
     aviso de contraseña cambiada, confirmación del formulario de
     contacto y avisos de las inscripciones (recibida, aprobada o no).
   - Se envían con el servidor SMTP de .env (por ejemplo Gmail con una
     "contraseña de aplicación"). Sin esa configuración no se envía
     nada: el correo se muestra en la terminal del servidor, así se
     puede probar todo en el computador.
   - Un correo que falla nunca rompe la acción que lo pidió (registro,
     inscripción...): solo se anota el error en la terminal.
   ========================================================== */
const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USUARIO, SMTP_CLAVE, CORREO_REMITENTE, CORREO_EQUIPO } = process.env;
const configurado = () => Boolean(SMTP_HOST && SMTP_USUARIO && SMTP_CLAVE);
const puerto = Number(SMTP_PORT) || 587;
const transporte = configurado()
  ? nodemailer.createTransport({ host: SMTP_HOST, port: puerto, secure: puerto === 465, auth: { user: SMTP_USUARIO, pass: SMTP_CLAVE } })
  : null;
// Dirección de la página web, para los enlaces de los correos (en GitHub Pages es la URL publicada)
const SITIO = (process.env.SITIO_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, "");

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const primerNombre = (nombre) => String(nombre || "").trim().split(/\s+/)[0] || "";
const fechaLarga = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

/* Plantilla con los colores de la marca. Los correos usan tablas y estilos en línea
   porque muchos programas de correo ignoran las hojas de estilo. */
function plantilla({ titulo, parrafos, boton }) {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#eef4f9;font-family:Arial,Helvetica,sans-serif;color:#0a2d5e">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0a2d5e;padding:20px 28px;font-size:20px;font-weight:bold;color:#ffffff">Talento <span style="color:#2cc3e6">Caribe</span> <span style="color:#f8ac24">&#9679;</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a2d5e">${esc(titulo)}</h1>
${parrafos.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2c4a6e">${esc(p)}</p>`).join("\n")}
${boton ? `<p style="margin:24px 0 6px"><a href="${esc(boton.url)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#1268c8;color:#ffffff;font-weight:bold;text-decoration:none">${esc(boton.texto)}</a></p>
<p style="margin:0;font-size:12px;color:#647a97">Si el botón no funciona, copia este enlace en el navegador: ${esc(boton.url)}</p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px;background:#f4f8fb;font-size:12px;color:#647a97">Tu talento no tiene fronteras · Barranquilla, Colombia</td></tr>
</table></td></tr></table></body></html>`;
}

async function enviar({ para, asunto, titulo, parrafos, boton, responderA }) {
  parrafos = parrafos.filter(Boolean);
  const texto = [titulo, ...parrafos, boton ? `${boton.texto}: ${boton.url}` : "", "Talento Caribe · Barranquilla, Colombia"].filter(Boolean).join("\n\n");
  if (!transporte) {
    console.log(`\n✉  Correo de prueba (falta configurar SMTP en .env, no se envió)\n   Para: ${para}\n   Asunto: ${asunto}\n   ${texto.replace(/\n/g, "\n   ")}\n`);
    return { simulado: true };
  }
  try {
    await transporte.sendMail({
      from: CORREO_REMITENTE || `Talento Caribe <${SMTP_USUARIO}>`, to: para, replyTo: responderA,
      subject: asunto, text: texto, html: plantilla({ titulo, parrafos, boton }),
    });
    return { enviado: true };
  } catch (error) {
    console.error(`✖ No se pudo enviar el correo a ${para}:`, error.message);
    return { error: error.message };
  }
}

const enlaces = { cursos: `${SITIO}/cursos.html`, portal: `${SITIO}/portal.html`, ingresar: `${SITIO}/admin/login.html` };
const INTERES = { curso: "Información de un curso", mentor: "Quiere ser mentor", alianza: "Alianzas o patrocinio", otro: "Otro tema" };

module.exports = {
  configurado, SITIO,

  bienvenida: (u) => enviar({
    para: u.correo, asunto: "Bienvenido a Talento Caribe", titulo: `¡Hola, ${primerNombre(u.nombre)}! Tu cuenta está lista`,
    parrafos: ["Ya eres parte de Talento Caribe, la plataforma gratuita de cursos de software y hardware.",
      "Para inscribirte, elige un curso y una ficha con inscripciones abiertas. El equipo de admisiones revisará tu solicitud y te avisaremos por este medio.",
      "Si no creaste esta cuenta, escríbenos desde el formulario de contacto de la página."],
    boton: { texto: "Ver los cursos", url: enlaces.cursos },
  }),

  recuperar: (u, enlace) => enviar({
    para: u.correo, asunto: "Crea una contraseña nueva", titulo: "¿Olvidaste tu contraseña?",
    parrafos: [`Hola, ${primerNombre(u.nombre)}. Recibimos una solicitud para cambiar la contraseña de tu cuenta.`,
      "El enlace sirve una sola vez y vence en 1 hora.",
      "Si no fuiste tú, ignora este correo: tu contraseña no cambiará."],
    boton: { texto: "Crear contraseña nueva", url: enlace },
  }),

  claveCambiada: (u) => enviar({
    para: u.correo, asunto: "Tu contraseña cambió", titulo: "Tu contraseña se actualizó",
    parrafos: [`Hola, ${primerNombre(u.nombre)}. La contraseña de tu cuenta de Talento Caribe se cambió correctamente.`,
      "Si no fuiste tú, escríbenos de inmediato desde el formulario de contacto."],
    boton: { texto: "Ingresar", url: enlaces.ingresar },
  }),

  contactoRecibido: (m) => enviar({
    para: m.correo, asunto: `Recibimos tu mensaje: ${m.asunto}`, titulo: `¡Gracias por escribirnos, ${primerNombre(m.nombre)}!`,
    parrafos: ["Recibimos tu mensaje y te responderemos en un máximo de 3 días hábiles.", `Asunto: ${m.asunto}`,
      "Mientras tanto, puedes conocer los cursos o preguntarle al asistente de la página."],
    boton: { texto: "Ver los cursos", url: enlaces.cursos },
  }),

  // Copia para el equipo (solo si CORREO_EQUIPO está en .env). Al responder, le llega a quien escribió.
  avisoEquipo: (m) => CORREO_EQUIPO && enviar({
    para: CORREO_EQUIPO, responderA: m.correo, asunto: `Nuevo mensaje de contacto: ${m.asunto}`, titulo: "Nuevo mensaje desde la página",
    parrafos: [`De: ${m.nombre} (${m.correo})${m.telefono ? ` · ${m.telefono}` : ""}`, `Tema: ${INTERES[m.interes] || m.interes}`, m.mensaje],
    boton: { texto: "Abrir el panel", url: enlaces.ingresar },
  }),

  solicitudRecibida: (x) => enviar({
    para: x.correo, asunto: `Recibimos tu solicitud para ${x.titulo}`, titulo: "Tu solicitud está en revisión",
    parrafos: [`Hola, ${primerNombre(x.nombre)}. Recibimos tu solicitud para el curso ${x.titulo}${x.ficha ? ` (ficha ${x.ficha}, jornada ${String(x.jornada).toLowerCase()})` : ""}.`,
      "El equipo de admisiones la revisará y te escribiremos cuando tenga una respuesta."],
    boton: { texto: "Ir a mi espacio", url: enlaces.portal },
  }),

  inscripcionRevisada: (x) => enviar(x.estado === "aprobada" ? {
    para: x.correo, asunto: `¡Tienes cupo en ${x.titulo}!`, titulo: "Tu inscripción fue aprobada",
    parrafos: [`Hola, ${primerNombre(x.nombre)}. Admisiones aprobó tu inscripción en ${x.titulo}${x.ficha ? ` (ficha ${x.ficha})` : ""}.`,
      x.inicio ? `Las clases empiezan el ${fechaLarga(x.inicio)}.` : "",
      "En tu espacio verás el curso, sus módulos y las actividades que publique tu docente."],
    boton: { texto: "Ir a mi espacio", url: enlaces.portal },
  } : {
    para: x.correo, asunto: `Sobre tu solicitud para ${x.titulo}`, titulo: "Tu solicitud no fue aprobada",
    parrafos: [`Hola, ${primerNombre(x.nombre)}. Por ahora no fue posible aprobar tu inscripción en ${x.titulo}.`,
      "Puede deberse a los cupos de la ficha o a la edad mínima del curso. Escríbenos desde el formulario de contacto si tienes dudas, o explora otros cursos."],
    boton: { texto: "Ver otros cursos", url: enlaces.cursos },
  }),
};
