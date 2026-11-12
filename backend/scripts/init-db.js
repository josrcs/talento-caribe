/* ==========================================================
   init-db.js - Crea la base de datos y sus tablas (sin usar psql)
   npm run db:init       -> crea la base si no existe, las tablas y los datos iniciales
   npm run db:reiniciar  -> BORRA todas las tablas y las vuelve a crear
   En producción (NODE_ENV=production, como en Render) además cambia las contraseñas
   públicas de las cuentas de prueba (ver protegerCuentasDePrueba más abajo).
   ========================================================== */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { generarClave, claveSegura, MENSAJE_CLAVE } = require("../src/validar");

const reiniciar = process.argv.includes("--reiniciar");
const url = process.env.DATABASE_URL;
if (!url) { console.error("✖ Falta DATABASE_URL en backend/.env (copia .env.ejemplo como .env)."); process.exit(1); }
const nombreBase = new URL(url).pathname.slice(1);
const sql = (archivo) => fs.readFileSync(path.join(__dirname, "..", "..", "database", archivo), "utf8");
// Bases en la nube (Render, Neon, Supabase...): DATABASE_SSL=true en .env
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;

async function main() {
  // 1. Crear la base de datos si no existe (conectándose a la base "postgres").
  //    En la nube la base ya viene creada y a veces no se permite entrar a "postgres": se continúa.
  const admin = new Client({ connectionString: url.replace(/\/[^/?]+(\?|$)/, "/postgres$1"), ssl });
  try {
    await admin.connect();
    const existe = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [nombreBase]);
    if (!existe.rowCount) {
      await admin.query(`CREATE DATABASE "${nombreBase.replace(/"/g, "")}"`);
      console.log(`✔ Base de datos "${nombreBase}" creada`);
    }
  } catch (error) {
    if (["ECONNREFUSED", "ENOTFOUND", "28P01"].includes(error.code)) throw error; // servidor apagado o clave incorrecta
    console.log(`ℹ No se pudo revisar la base "postgres" (${error.message}); se usa "${nombreBase}" tal como viene del hosting.`);
  } finally {
    await admin.end().catch(() => {});
  }

  // 2. Crear tablas y datos
  const db = new Client({ connectionString: url, ssl });
  await db.connect();
  if (reiniciar) {
    await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("✔ Tablas anteriores eliminadas");
  }
  const { usuarios, cursos } = (await db.query("SELECT to_regclass('public.usuarios') AS usuarios, to_regclass('public.cursos') AS cursos")).rows[0];
  if (!usuarios && cursos) {
    console.log("⚠ Tu base tiene la versión anterior (sin usuarios, actividades ni entregas).");
    console.log("  Ejecuta: npm run db:reiniciar   (borra las tablas viejas y crea las nuevas)");
    await db.end(); process.exit(1);
  }
  if (usuarios) {
    console.log("ℹ Las tablas ya existen. Para empezar de cero usa: npm run db:reiniciar");
  } else {
    await db.query(sql("schema.sql"));
    console.log("✔ Tablas creadas (schema.sql)");
    await db.query(sql("seed.sql"));
    console.log("✔ Datos iniciales cargados (seed.sql)");
  }
  const { rows } = await db.query("SELECT (SELECT count(*)::int FROM cursos) AS cursos, (SELECT count(*)::int FROM usuarios) AS usuarios");
  console.log(`✔ Listo: ${rows[0].cursos} cursos y ${rows[0].usuarios} usuarios en la base "${nombreBase}"`);
  if (process.env.NODE_ENV === "production") await protegerCuentasDePrueba(db);
  await aplicarClaveNuevaDeAdmin(db);
  await db.end();
}

/* Las cuentas de prueba de seed.sql tienen contraseñas públicas (están en el README). En una
   plataforma publicada, cualquiera podría entrar con ellas al panel. Por eso, en producción, toda
   cuenta que todavía tenga una de esas contraseñas recibe una nueva al azar. La del administrador
   se muestra UNA vez en los registros (logs) del servidor para poder ingresar y cambiarla en «Mi cuenta».
   Se ejecuta en cada arranque, pero solo actúa si encuentra contraseñas públicas: no toca las demás. */
async function protegerCuentasDePrueba(db) {
  const publicas = [...new Set(sql("seed.sql").match(/\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}/g) || [])];
  if (!publicas.length) return;
  const { rows } = await db.query("SELECT id, correo, rol FROM usuarios WHERE clave_hash = ANY($1) ORDER BY id", [publicas]);
  if (!rows.length) return;
  for (const u of rows) {
    const clave = generarClave();
    await db.query("UPDATE usuarios SET clave_hash = $1, sesiones_desde = clock_timestamp() WHERE id = $2", [await bcrypt.hash(clave, 10), u.id]);
    if (u.correo === "admin@talentocaribe.co") {
      console.log("\n🔐 Contraseña nueva del administrador (se muestra solo esta vez):");
      console.log(`   ${u.correo}  /  ${clave}`);
      console.log("   Ingresa con ella y cámbiala en «Mi cuenta». Si la pierdes, usa ADMIN_CLAVE_NUEVA (ver abajo).\n");
    }
  }
  console.log(`✔ Seguridad: ${rows.length} cuenta(s) de prueba recibieron contraseñas nuevas (las del README ya no sirven aquí).`);
}

/* Recuperar el acceso del administrador sin consola: define ADMIN_CLAVE_NUEVA en las variables del
   servidor (Render → Environment) y reinicia. La contraseña de admin@talentocaribe.co pasa a ser esa
   y se cierran sus sesiones. Después de ingresar, BORRA la variable: mientras exista, cada reinicio
   vuelve a ponerla (si alguien la cambió desde «Mi cuenta», se reemplaza otra vez). */
async function aplicarClaveNuevaDeAdmin(db) {
  const clave = process.env.ADMIN_CLAVE_NUEVA;
  if (!clave) return;
  if (!claveSegura(clave, "admin@talentocaribe.co")) { console.error(`✖ ADMIN_CLAVE_NUEVA no se aplicó: ${MENSAJE_CLAVE}`); return; }
  const { rows } = await db.query("SELECT id, clave_hash FROM usuarios WHERE correo = 'admin@talentocaribe.co'");
  if (!rows.length) { console.error("✖ ADMIN_CLAVE_NUEVA no se aplicó: no existe la cuenta admin@talentocaribe.co"); return; }
  if (await bcrypt.compare(clave, rows[0].clave_hash)) return console.log("ℹ ADMIN_CLAVE_NUEVA ya está aplicada: bórrala de las variables del servidor.");
  await db.query("UPDATE usuarios SET clave_hash = $1, sesiones_desde = clock_timestamp(), activo = true WHERE id = $2", [await bcrypt.hash(clave, 10), rows[0].id]);
  console.log("✔ Contraseña del administrador cambiada con ADMIN_CLAVE_NUEVA. Ingresa y luego BORRA esa variable del servidor.");
}

main().catch((error) => {
  const ayuda = {
    "28P01": "La contraseña del usuario postgres no es correcta. Revisa DATABASE_URL en backend/.env.",
    ECONNREFUSED: "PostgreSQL no está encendido. Ábrelo desde Servicios de Windows (postgresql-x64-…) o reinicia el equipo.",
  }[error.code];
  console.error("✖ No se pudo preparar la base de datos:", ayuda || error.message);
  process.exit(1);
});
