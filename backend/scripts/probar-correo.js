/* ==========================================================
   probar-correo.js - Revisa la configuración de Brevo sin enviar nada
   npm run correo:probar                 -> comprueba la clave y el remitente
   npm run correo:probar -- tu@correo.com -> además envía un correo de prueba a esa dirección
   ========================================================== */
require("dotenv").config();

const clave = String(process.env.BREVO_API_KEY || "").trim().replace(/^["']|["']$/g, "");
const remitente = process.env.CORREO_REMITENTE || "";
const correoRemitente = (remitente.match(/<([^>]+)>/)?.[1] || remitente).trim();
const destino = process.argv[2];

async function main() {
  if (!clave) return fallar("Falta BREVO_API_KEY en backend/.env (o en Render → Environment).");
  if (clave.startsWith("xsmtpsib-")) return fallar("Esa es una «SMTP key». Crea una «API key» (empieza por xkeysib-) en Brevo → SMTP & API → API Keys.");
  if (!clave.startsWith("xkeysib-")) console.warn("⚠️  La clave no empieza por xkeysib-: puede que no sea una API key de Brevo.");

  const cab = { "api-key": clave, Accept: "application/json", "Content-Type": "application/json" };
  const cuenta = await fetch("https://api.brevo.com/v3/account", { headers: cab, signal: AbortSignal.timeout(15000) });
  const datos = await cuenta.json().catch(() => ({}));
  // 403 "not authorized for resource": la clave existe pero tiene permisos limitados (Brevo permite claves
  // que solo envían correos). Eso basta para la plataforma: se sigue y se prueba el envío.
  let limitada = false;
  if (!cuenta.ok) {
    const msj = String(datos.message || "");
    if (/ip address/i.test(msj)) return fallar(`Brevo bloquea esta IP: ${msj}\n  → En Brevo → Security → Authorised IPs, autoriza esta IP o desactiva el bloqueo (Render cambia de IP).`);
    if (cuenta.status === 403 && /not authorized/i.test(msj)) {
      limitada = true;
      console.log("ℹ La clave existe pero tiene permisos limitados (no puede leer la cuenta). Para enviar correos es suficiente.");
    } else return fallar(`Brevo rechazó la clave (HTTP ${cuenta.status}): ${msj || "sin detalle"}\n  → La clave fue borrada, está mal copiada o es de otra cuenta. Crea una nueva en Brevo → SMTP & API → API Keys.`);
  } else console.log(`✔ Clave válida: cuenta de ${datos.email} (${datos.companyName || "sin empresa"})`);

  if (!correoRemitente.includes("@")) return fallar("Falta CORREO_REMITENTE, por ejemplo: Talento Caribe <tu-correo@gmail.com>");
  const r = await fetch("https://api.brevo.com/v3/senders", { headers: cab, signal: AbortSignal.timeout(15000) });
  if (r.ok) {
    const { senders = [] } = await r.json().catch(() => ({}));
    const s = senders.find((x) => x.email.toLowerCase() === correoRemitente.toLowerCase());
    if (!s) return fallar(`El remitente ${correoRemitente} no está en Brevo → Senders. Agrégalo y verifícalo con el correo que te envían.`);
    if (!s.active) return fallar(`El remitente ${correoRemitente} existe pero no está verificado/activo en Brevo → Senders.`);
    console.log(`✔ Remitente verificado: ${correoRemitente}`);
  } else {
    limitada = true;
    console.log(`ℹ La clave no puede leer la lista de remitentes: no se pudo confirmar que ${correoRemitente} esté verificado.`);
  }
  if (limitada && !destino) console.log("  Para confirmar que todo funciona, envía una prueba: npm run correo:probar -- tu-correo@gmail.com");

  if (destino) {
    const envio = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: cab, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ sender: { email: correoRemitente, name: "Talento Caribe" }, to: [{ email: destino }],
        subject: "Prueba de correo de Talento Caribe", textContent: "Si lees esto, Brevo está bien configurado." }),
    });
    if (!envio.ok) {
      const msj = String((await envio.json().catch(() => ({}))).message || "");
      if (/sender/i.test(msj)) return fallar(`Brevo no aceptó el remitente ${correoRemitente}: ${msj}\n  → Verifícalo en https://app.brevo.com/senders/list`);
      if (envio.status === 403 || envio.status === 401) return fallar(`La clave no tiene permiso para enviar correos (HTTP ${envio.status}): ${msj}\n  → Crea una API key con acceso completo (o con permiso de envío transaccional) en https://app.brevo.com/settings/keys/api`);
      return fallar(`No se envió el correo de prueba (HTTP ${envio.status}): ${msj}`);
    }
    console.log(`✔ Correo de prueba enviado a ${destino} (revisa también Spam)`);
    console.log("Todo listo: los correos de la plataforma saldrán por Brevo.");
  } else if (!limitada) console.log("Todo listo: los correos de la plataforma saldrán por Brevo.");
}
function fallar(msj) { console.error("✖ " + msj); process.exitCode = 1; }
main().catch((e) => fallar(`No se pudo conectar con Brevo: ${e.message}`));
