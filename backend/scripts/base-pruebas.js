/* ==========================================================
   base-pruebas.js - Una segunda base de datos solo para pruebas
   Sirve para ensayar crear cuentas, bloquearlas, desbloquearlas y crear cuentas administrativas
   sin tocar la base de siempre. Usa el mismo PostgreSQL de DATABASE_URL, pero la base se llama
   igual con "_pruebas" al final (por ejemplo talento_caribe_pruebas).

     npm run pruebas:crear   BORRA la base de pruebas (solo esa) y la crea de nuevo con los datos
                             iniciales y las cuentas de prueba de abajo
     npm run pruebas         enciende el servidor con la base de pruebas → http://localhost:3001
     npm run pruebas:cuenta -- lista   el comando "npm run cuenta" sobre la base de pruebas

   La base de siempre (npm start → puerto 3000) nunca se modifica.
   ========================================================== */
require("dotenv").config();
const path = require("path");
const { spawnSync } = require("child_process");
const { Client } = require("pg");

const PUERTO_PRUEBAS = "3001";
const url = process.env.DATABASE_URL;
if (!url) { console.error("✖ Falta DATABASE_URL en backend/.env (copia .env.ejemplo como .env)."); process.exit(1); }
if (process.env.DATABASE_SSL === "true") { console.error("✖ La base de pruebas es solo para el PostgreSQL de tu computador (DATABASE_SSL=true indica una base en la nube)."); process.exit(1); }

const direccion = new URL(url);
const nombreBase = direccion.pathname.slice(1);
const nombrePruebas = nombreBase.endsWith("_pruebas") ? nombreBase : `${nombreBase}_pruebas`;
direccion.pathname = `/${nombrePruebas}`;
const urlPruebas = direccion.toString();
direccion.pathname = "/postgres";
const urlPostgres = direccion.toString();
const entorno = { ...process.env, DATABASE_URL: urlPruebas, PORT: PUERTO_PRUEBAS };

// Corre otro script del backend apuntando a la base de pruebas (dotenv no pisa variables ya definidas)
const correr = (archivo, argumentos = []) => {
  const r = spawnSync(process.execPath, [path.join(__dirname, "..", archivo), ...argumentos], { env: entorno, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
};

// Contraseñas iguales a las del README: Estudiante123 y Admin123
const CLAVE_ESTUDIANTE = "$2a$10$bQWYsojbF0crHUSbDlikKOwQ2WJ5C83TSF7l1CibaWrsZiMYy51Fe";
const CLAVE_ADMIN = "$2a$10$ebEJSdZJJrsxrW4MuVZQxeTJBjzASG8kPNyiIDsRqPl9WeX9pgCO.";

// Administrativos con cargo fijo (entran directo con ese cargo)
const ADMINISTRATIVOS = [
  ["Gerencia de pruebas", "gerente.prueba@talentocaribe.co", "Gerente"],
  ["Admisiones de pruebas", "admisiones.prueba@talentocaribe.co", "Coordinador(a) de admisiones"],
  ["Finanzas de pruebas", "finanzas.prueba@talentocaribe.co", "Administración y finanzas"],
];
// Estudiantes con distintos tiempos sin ingresar; null = ya bloqueado
const ESTUDIANTES = [
  ["Pedro Inactivo", "pedro.inactivo@correo.com", 120, "1043900001"],
  ["Ana Inactiva", "ana.inactiva@correo.com", 35, "1043900002"],
  ["Valentina Reciente", "valentina.reciente@correo.com", 2, "1043900003"],
  ["Carlos Bloqueado", "carlos.bloqueado@correo.com", null, "1043900004"],
];

async function crear() {
  if (nombrePruebas === nombreBase) { console.error("✖ DATABASE_URL ya apunta a una base _pruebas: usa la base de siempre en backend/.env."); process.exit(1); }
  const admin = new Client({ connectionString: urlPostgres });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${nombrePruebas.replace(/"/g, "")}" WITH (FORCE)`);
    console.log(`✔ Base "${nombrePruebas}" anterior eliminada (la base "${nombreBase}" no se tocó)`);
  } finally {
    await admin.end();
  }
  correr("scripts/init-db.js");
  correr("scripts/actualizar-db.js");

  const db = new Client({ connectionString: urlPruebas });
  await db.connect();
  try {
    for (const [nombre, correo, puesto] of ADMINISTRATIVOS) {
      await db.query("INSERT INTO usuarios (nombre, correo, clave_hash, rol, puesto) VALUES ($1, $2, $3, 'administrativo', $4)", [nombre, correo, CLAVE_ADMIN, puesto]);
    }
    for (const [nombre, correo, dias, documento] of ESTUDIANTES) {
      // Copia el perfil de inscripción de Luis Gómez (estudiante del seed) con otro nombre, correo y documento
      await db.query(`INSERT INTO usuarios (nombre, correo, clave_hash, rol, pais, tipo_documento, numero_documento, fecha_nacimiento, telefono, ciudad, region, ultimo_estudio,
          activo, creado_en, ultimo_ingreso, bloqueado_en, bloqueado_por)
        SELECT $1, $2, $3, 'estudiante', pais, tipo_documento, $4, fecha_nacimiento, telefono, ciudad, region, ultimo_estudio,
          $5::int IS NOT NULL, now() - make_interval(days => COALESCE($5::int, 60) + 30), now() - make_interval(days => COALESCE($5::int, 60)),
          CASE WHEN $5::int IS NULL THEN now() - interval '5 days' END, CASE WHEN $5::int IS NULL THEN 'Datos de prueba' END
        FROM usuarios WHERE correo = 'luis.gomez@correo.com'`, [nombre, correo, CLAVE_ESTUDIANTE, documento, dias]);
    }
  } finally {
    await db.end();
  }

  console.log(`✔ Cuentas de prueba agregadas. Enciende el servidor con: npm run pruebas  → http://localhost:${PUERTO_PRUEBAS}\n`);
  console.table([
    { cuenta: "admin@talentocaribe.co", clave: "Admin123", para: "Elige cualquier cargo al entrar (también Gerente)" },
    ...ADMINISTRATIVOS.map(([, correo, puesto]) => ({ cuenta: correo, clave: "Admin123", para: `Cargo fijo: ${puesto}` })),
    ...ESTUDIANTES.map(([, correo, dias]) => ({ cuenta: correo, clave: "Estudiante123", para: dias === null ? "Ya bloqueado: pruébalo desbloqueando" : `${dias} días sin ingresar${dias >= 30 ? " (se puede bloquear)" : " (todavía no se puede bloquear)"}` })),
  ]);
}

const [accion, ...resto] = process.argv.slice(2);
if (accion === "crear") {
  crear().catch((error) => {
    const ayuda = {
      "28P01": "La contraseña del usuario postgres no es correcta. Revisa DATABASE_URL en backend/.env.",
      ECONNREFUSED: "PostgreSQL no está encendido. Ábrelo desde Servicios de Windows (postgresql-x64-…) o reinicia el equipo.",
    }[error.code];
    console.error("✖ No se pudo crear la base de pruebas:", ayuda || error.message);
    process.exit(1);
  });
} else if (accion === "servidor") {
  console.log(`🧪 Servidor con la base de PRUEBAS "${nombrePruebas}" (la de siempre sigue intacta)`);
  correr("src/server.js");
} else if (accion === "cuenta") {
  correr("scripts/cuenta.js", resto);
} else {
  console.log("Uso: npm run pruebas:crear  ·  npm run pruebas  ·  npm run pruebas:cuenta -- lista");
  process.exit(1);
}
