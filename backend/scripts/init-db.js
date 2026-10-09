/* ==========================================================
   init-db.js - Crea la base de datos y sus tablas (sin usar psql)
   npm run db:init       -> crea la base si no existe, las tablas y los datos iniciales
   npm run db:reiniciar  -> BORRA todas las tablas y las vuelve a crear
   ========================================================== */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

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
  await db.end();
}

main().catch((error) => {
  const ayuda = {
    "28P01": "La contraseña del usuario postgres no es correcta. Revisa DATABASE_URL en backend/.env.",
    ECONNREFUSED: "PostgreSQL no está encendido. Ábrelo desde Servicios de Windows (postgresql-x64-…) o reinicia el equipo.",
  }[error.code];
  console.error("✖ No se pudo preparar la base de datos:", ayuda || error.message);
  process.exit(1);
});
