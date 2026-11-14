/* db.js - Conexión a PostgreSQL con un "pool" (reutiliza conexiones). */
require("dotenv").config();
const { Pool, types } = require("pg");

// Fechas (DATE) como texto "AAAA-MM-DD" y números decimales (NUMERIC) como número de JavaScript
types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1700, (valor) => (valor === null ? null : parseFloat(valor)));

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  Falta DATABASE_URL en backend/.env (copia .env.ejemplo como .env).");
}

// Las bases en la nube (Render, Neon, Supabase...) suelen exigir SSL: DATABASE_SSL=true en .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  // Ninguna consulta puede tardar más de 15 s: una consulta trabada no deja al servidor sin conexiones
  statement_timeout: 15000,
  connectionTimeoutMillis: 10000,
});

// Si la base se cae con el servidor encendido, lo mostramos en vez de cerrar todo.
pool.on("error", (error) => console.error("Error inesperado en PostgreSQL:", error.message));

/* Explica en palabras simples los errores de conexión más comunes (null si no es de conexión).
   Los mensajes de PostgreSQL en Windows llegan con tildes dañadas, por eso se usan los códigos. */
const ERRORES_CONEXION = {
  "28P01": "la contraseña del usuario de PostgreSQL no es correcta → corrige DATABASE_URL en backend/.env",
  "3D000": "la base de datos no existe → ejecuta npm run db:init",
  "42P01": "faltan las tablas → ejecuta npm run db:init",
  ECONNREFUSED: "PostgreSQL no está encendido → inicia el servicio postgresql-x64-… en Servicios de Windows",
  ENOTFOUND: "no se encuentra el servidor de DATABASE_URL → revisa la dirección en backend/.env",
};
pool.explicarError = (error) => ERRORES_CONEXION[error?.code] || null;

module.exports = pool;
