/* ==========================================================
   actualizar-db.js - Pone al día una base creada con una versión anterior
   SIN BORRAR NADA (a diferencia de npm run db:reiniciar).
   npm run db:actualizar
   - Agrega a cursos las columnas modulos y guia, y las llena desde js/cursos-data.js
     (solo en los cursos que todavía no tienen módulos).
   - Crea la tabla fichas con las fichas del catálogo.
   - Agrega ficha_id a inscripciones y modulo/ficha_id a actividades. Las inscripciones
     que no tienen ficha quedan en la primera ficha de su curso.
   - Corrige la duración de los cursos que tienen menos semanas de las que necesitan sus
     módulos (cada módulo dura 2 semanas): toma la duración del catálogo.
   - Crea las tablas de respuestas de encuestas y de recuperación de contraseña, y carga
     respuestas de ejemplo de los estudiantes de prueba si la tabla está vacía.
   - Seguridad: agrega usuarios.sesiones_desde (cambiar la contraseña cierra las demás
     sesiones) y crea la tabla eventos_seguridad (ingresos, fallos y bloqueos).
   Se puede ejecutar varias veces: lo que ya existe no se toca.
   ========================================================== */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Client } = require("pg");

const RAIZ = path.join(__dirname, "..", "..");
const contexto = { window: {}, localStorage: { getItem: () => null } };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", "cursos-data.js"), "utf8"), contexto);
vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", "encuestas-data.js"), "utf8"), contexto);
const cursos = contexto.window.TALENTO_CARIBE_CURSOS;
const fichas = contexto.window.TALENTO_CARIBE_FICHAS;
const respuestasEjemplo = contexto.window.TALENTO_CARIBE_RESPUESTAS_EJEMPLO;

if (!process.env.DATABASE_URL) { console.error("✖ Falta DATABASE_URL en backend/.env (copia .env.ejemplo como .env)."); process.exit(1); }
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;

const ESTRUCTURA = `
  ALTER TABLE cursos ADD COLUMN IF NOT EXISTS modulos JSONB NOT NULL DEFAULT '[]';
  ALTER TABLE cursos ADD COLUMN IF NOT EXISTS guia    JSONB NOT NULL DEFAULT '{}';
  CREATE TABLE IF NOT EXISTS fichas (
    id            SERIAL PRIMARY KEY,
    numero        VARCHAR(6)  NOT NULL UNIQUE CHECK (numero ~ '^[0-9]{4,6}$'),
    curso_id      INTEGER     NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    jornada       VARCHAR(10) NOT NULL CHECK (jornada IN ('Mañana', 'Tarde', 'Noche', 'Sábados')),
    fecha_inicio  DATE,
    cupos         SMALLINT    NOT NULL DEFAULT 25 CHECK (cupos BETWEEN 1 AND 200),
    estado        VARCHAR(25) NOT NULL DEFAULT 'Inscripciones abiertas'
                  CHECK (estado IN ('Inscripciones abiertas', 'En formación', 'Próximamente', 'Finalizada')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS ficha_id INTEGER REFERENCES fichas(id) ON DELETE SET NULL;
  ALTER TABLE actividades   ADD COLUMN IF NOT EXISTS modulo   SMALLINT NOT NULL DEFAULT 1 CHECK (modulo BETWEEN 1 AND 30);
  ALTER TABLE actividades   ADD COLUMN IF NOT EXISTS ficha_id INTEGER REFERENCES fichas(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS idx_fichas_curso        ON fichas (curso_id);
  CREATE INDEX IF NOT EXISTS idx_inscripciones_ficha ON inscripciones (ficha_id);
  CREATE INDEX IF NOT EXISTS idx_actividades_modulo  ON actividades (curso_id, modulo);
  CREATE TABLE IF NOT EXISTS respuestas_encuesta (
    id             SERIAL PRIMARY KEY,
    encuesta       VARCHAR(40) NOT NULL,
    estudiante_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    respuestas     JSONB       NOT NULL,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (encuesta, estudiante_id)
  );
  CREATE TABLE IF NOT EXISTS recuperaciones_clave (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  CHAR(64)    NOT NULL UNIQUE,
    expira_en   TIMESTAMPTZ NOT NULL,
    usado_en    TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_recuperaciones_usuario ON recuperaciones_clave (usuario_id);
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sesiones_desde TIMESTAMPTZ NOT NULL DEFAULT now();
  CREATE TABLE IF NOT EXISTS eventos_seguridad (
    id          BIGSERIAL PRIMARY KEY,
    tipo        VARCHAR(25)  NOT NULL CHECK (tipo IN ('ingreso', 'ingreso_fallido', 'bloqueo', 'clave_cambiada', 'recuperacion_pedida',
                                                       'clave_restablecida', 'sesiones_cerradas', 'registro')),
    usuario_id  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    correo      VARCHAR(120),
    ip          VARCHAR(60),
    agente      VARCHAR(200),
    detalle     VARCHAR(200),
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_eventos_seguridad_fecha ON eventos_seguridad (creado_en DESC);`;

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl });
  await db.connect();
  if (!(await db.query("SELECT to_regclass('public.usuarios') AS t")).rows[0].t) {
    console.log("ℹ La base no tiene tablas todavía: ejecuta npm run db:init");
    return db.end();
  }
  try {
    await db.query("BEGIN");
    await db.query(ESTRUCTURA);
    console.log("✔ Columnas y tablas al día (fichas, encuestas, recuperación de contraseña y registro de seguridad)");

    let conModulos = 0;
    for (const c of cursos) {
      const modulos = (c.modulos || []).map((m) => ({ titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || "", actividades: m.actividades || [], evidencia: m.evidencia || "" }));
      const { rowCount } = await db.query("UPDATE cursos SET modulos = $1, guia = $2 WHERE id = $3 AND titulo = $4 AND modulos = '[]'::jsonb",
        [JSON.stringify(modulos), JSON.stringify(c.guia || {}), c.id, c.titulo]);
      conModulos += rowCount;
    }
    console.log(`✔ Módulos y guía cargados en ${conModulos} curso(s)`);

    // Cada módulo dura 2 semanas: un curso de 8 módulos no puede durar 4 semanas
    let corregidos = 0;
    for (const c of cursos) {
      const { rowCount } = await db.query("UPDATE cursos SET duracion_semanas = $1 WHERE id = $2 AND titulo = $3 AND duracion_semanas < jsonb_array_length(modulos) * 2",
        [Number(c.duracion), c.id, c.titulo]);
      corregidos += rowCount;
    }
    console.log(`✔ Duración corregida en ${corregidos} curso(s)`);

    let nuevas = 0;
    for (const f of fichas) {
      const { rowCount } = await db.query(`INSERT INTO fichas (numero, curso_id, jornada, fecha_inicio, cupos, estado)
        SELECT $1, $2, $3, $4, $5, $6 WHERE EXISTS (SELECT 1 FROM cursos WHERE id = $2) ON CONFLICT (numero) DO NOTHING`,
        [f.numero, f.curso_id, f.jornada, f.inicio || null, Number(f.cupos), f.estado]);
      nuevas += rowCount;
    }
    console.log(`✔ ${nuevas} ficha(s) nueva(s)`);

    const { rowCount: ubicadas } = await db.query(`UPDATE inscripciones i SET ficha_id = (SELECT f.id FROM fichas f WHERE f.curso_id = i.curso_id ORDER BY f.numero LIMIT 1)
      WHERE i.ficha_id IS NULL AND EXISTS (SELECT 1 FROM fichas f WHERE f.curso_id = i.curso_id)`);
    console.log(`✔ ${ubicadas} inscripción(es) ubicada(s) en la primera ficha de su curso`);

    // Respuestas de ejemplo de los estudiantes de prueba, solo si todavía no hay ninguna respuesta
    let ejemplos = 0;
    if (!(await db.query("SELECT 1 FROM respuestas_encuesta LIMIT 1")).rowCount) {
      for (const [i, r] of respuestasEjemplo.entries()) {
        const { rowCount } = await db.query(`INSERT INTO respuestas_encuesta (encuesta, estudiante_id, respuestas, creado_en)
          SELECT $1, id, $2, now() - make_interval(days => $3) FROM usuarios WHERE correo = $4 ON CONFLICT DO NOTHING`,
          [r.encuesta, JSON.stringify(r.respuestas), i % 9, r.correo]);
        ejemplos += rowCount;
      }
    }
    console.log(`✔ ${ejemplos} respuesta(s) de encuesta de ejemplo`);

    await db.query("COMMIT");
    const { rows } = await db.query("SELECT (SELECT count(*)::int FROM usuarios) AS usuarios, (SELECT count(*)::int FROM actividades) AS actividades, (SELECT count(*)::int FROM fichas) AS fichas");
    console.log(`✔ Listo, sin borrar datos: ${rows[0].usuarios} usuarios, ${rows[0].actividades} actividades y ${rows[0].fichas} fichas`);
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  const ayuda = {
    "28P01": "La contraseña del usuario postgres no es correcta. Revisa DATABASE_URL en backend/.env.",
    ECONNREFUSED: "PostgreSQL no está encendido. Ábrelo desde Servicios de Windows (postgresql-x64-…) o reinicia el equipo.",
  }[error.code];
  console.error("✖ No se pudo actualizar la base de datos (no se cambió nada):", ayuda || error.message);
  process.exit(1);
});
