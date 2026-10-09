/* ==========================================================
   cuenta.js - Administrar cuentas desde la terminal (sin abrir la página)
   Las cuentas de prueba tienen contraseñas públicas (están en el README):
   en una plataforma publicada conviene cambiarlas o desactivarlas.

     npm run cuenta -- clave admin@talentocaribe.co            genera una contraseña segura y la muestra una vez
     npm run cuenta -- clave admin@talentocaribe.co "MiClave2026"   usa la contraseña indicada
     npm run cuenta -- desactivar luis.gomez@correo.com          la cuenta ya no puede ingresar
     npm run cuenta -- activar luis.gomez@correo.com
     npm run cuenta -- lista                                    correos, roles y estado de todas las cuentas

   Cambiar la clave o desactivar una cuenta cierra todas sus sesiones abiertas.
   ========================================================== */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const { claveSegura, MENSAJE_CLAVE } = require("../src/validar");

const [accion, correoArg, claveArg] = process.argv.slice(2);
const correo = String(correoArg || "").trim().toLowerCase();
const ayuda = () => { console.log("Uso: npm run cuenta -- clave|desactivar|activar <correo> [contraseña]   ·   npm run cuenta -- lista"); process.exit(1); };
if (!["clave", "desactivar", "activar", "lista"].includes(accion) || (accion !== "lista" && !correo)) ayuda();
if (!process.env.DATABASE_URL) { console.error("✖ Falta DATABASE_URL en backend/.env."); process.exit(1); }

/* Contraseña aleatoria fácil de dictar: 4 bloques de letras y números (ej. Kq7m-x2Pa-9rTe-W4nb) */
function generarClave() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/l/I, que se confunden
  let clave;
  do clave = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => letras[crypto.randomInt(letras.length)]).join("")).join("-");
  while (!claveSegura(clave));
  return clave;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  await db.connect();
  try {
    if (accion === "lista") {
      const { rows } = await db.query("SELECT correo, rol, COALESCE(puesto, '') AS puesto, activo FROM usuarios ORDER BY rol, correo");
      console.table(rows.map((u) => ({ correo: u.correo, rol: u.rol, cargo: u.puesto || (u.rol === "administrativo" ? "(elige al ingresar)" : ""), estado: u.activo ? "activa" : "desactivada" })));
      return;
    }
    if (accion === "clave") {
      const clave = claveArg || generarClave();
      if (!claveSegura(clave, correo)) { console.error(`✖ ${MENSAJE_CLAVE}`); process.exitCode = 1; return; }
      const { rowCount } = await db.query("UPDATE usuarios SET clave_hash = $1, sesiones_desde = clock_timestamp() WHERE correo = $2", [await bcrypt.hash(clave, 10), correo]);
      if (!rowCount) { console.error(`✖ No existe una cuenta con el correo ${correo}.`); process.exitCode = 1; return; }
      await db.query("UPDATE recuperaciones_clave SET usado_en = now() WHERE usado_en IS NULL AND usuario_id = (SELECT id FROM usuarios WHERE correo = $1)", [correo]);
      console.log(`✔ Contraseña de ${correo} cambiada y sesiones cerradas.`);
      if (!claveArg) console.log(`  Contraseña nueva: ${clave}\n  (Guárdala en un lugar seguro: no se vuelve a mostrar.)`);
      return;
    }
    const activo = accion === "activar";
    const { rowCount } = await db.query("UPDATE usuarios SET activo = $1, sesiones_desde = clock_timestamp() WHERE correo = $2", [activo, correo]);
    if (!rowCount) { console.error(`✖ No existe una cuenta con el correo ${correo}.`); process.exitCode = 1; return; }
    console.log(`✔ Cuenta ${correo} ${activo ? "activada" : "desactivada (sus sesiones se cerraron)"}.`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  const ayudaError = { "42703": "La base es de una versión anterior: ejecuta primero npm run db:actualizar.", ECONNREFUSED: "PostgreSQL no está encendido." }[error.code];
  console.error("✖ No se pudo completar:", ayudaError || error.message);
  process.exit(1);
});
