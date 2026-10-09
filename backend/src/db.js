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
});

// Si la base se cae con el servidor encendido, lo mostramos en vez de cerrar todo.
pool.on("error", (error) => console.error("Error inesperado en PostgreSQL:", error.message));

module.exports = pool;
