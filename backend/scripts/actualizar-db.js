/* ==========================================================
   actualizar-db.js - Pone al día una base creada con una versión anterior
   SIN BORRAR NADA (a diferencia de npm run db:reiniciar).
   npm run db:actualizar
   - Agrega a cursos las columnas modulos y guia, y las llena desde compartido/cursos.json
     (solo en los cursos que todavía no tienen módulos).
   - Crea la tabla fichas con las fichas del catálogo.
   - Agrega ficha_id a inscripciones y modulo/ficha_id a actividades. Las inscripciones
     que no tienen ficha quedan en la primera ficha de su curso.
   - Crea las tablas de respuestas de encuestas y de recuperación de contraseña, y carga
     respuestas de ejemplo de los estudiantes de prueba si la tabla está vacía.
   - Seguridad: agrega usuarios.sesiones_desde (cambiar la contraseña cierra las demás
     sesiones) y crea la tabla eventos_seguridad (ingresos, fallos y bloqueos).
   - Cuentas: agrega último ingreso y datos de bloqueo a usuarios (admisiones bloquea estudiantes
     inactivos) y los eventos de cuentas creadas, eliminadas, bloqueadas y desbloqueadas.
   - Datos personales (Ley 1581 de 2012): agrega a usuarios la versión de la política aceptada y la fecha
     de la autorización, y a mensajes_contacto la versión aceptada al escribir.
   - Encuesta pública: respuestas_encuesta.estudiante_id puede quedar vacío (respuestas anónimas sin cuenta).
   - Piloto 2027 (una sola vez, se anota en la tabla migraciones): las fichas aceptan la jornada
     «Por definir», el contacto acepta los intereses de «Súmate» y se cargan los 4 cursos de la ruta
     del piloto (HTML y CSS → JavaScript → Python → PostgreSQL, 2 semanas cada uno). Si un curso con
     el mismo nombre ya existe se actualiza (conserva sus inscripciones); sus fichas viejas quedan
     «Finalizada». Los demás cursos NO se borran: el Gerente los elimina desde el panel.
   Se puede ejecutar varias veces: lo que ya existe no se toca.
   ========================================================== */
require("dotenv").config();
const { Client } = require("pg");

// Catálogo y encuestas compartidos con la página en React (frontend/src importa los mismos archivos)
const { cursos, fichas } = require("../../compartido/cursos.json");
const { respuestasEjemplo } = require("../../compartido/encuestas.json");

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
  CREATE INDEX IF NOT EXISTS idx_eventos_seguridad_fecha ON eventos_seguridad (creado_en DESC);
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_ingreso  TIMESTAMPTZ;
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_en    TIMESTAMPTZ;
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_por   VARCHAR(160);
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS desbloqueado_en TIMESTAMPTZ;
  ALTER TABLE eventos_seguridad DROP CONSTRAINT IF EXISTS eventos_seguridad_tipo_check;
  ALTER TABLE eventos_seguridad ADD CONSTRAINT eventos_seguridad_tipo_check CHECK (tipo IN ('ingreso', 'ingreso_fallido', 'bloqueo',
    'clave_cambiada', 'recuperacion_pedida', 'clave_restablecida', 'sesiones_cerradas', 'registro', 'cuenta_creada', 'cuenta_eliminada',
    'cuenta_bloqueada', 'cuenta_desbloqueada'));
  ALTER TABLE usuarios          ADD COLUMN IF NOT EXISTS consentimiento_version VARCHAR(10);
  ALTER TABLE usuarios          ADD COLUMN IF NOT EXISTS consentimiento_en      TIMESTAMPTZ;
  ALTER TABLE mensajes_contacto ADD COLUMN IF NOT EXISTS politica_version       VARCHAR(10);
  ALTER TABLE respuestas_encuesta ALTER COLUMN estudiante_id DROP NOT NULL;
  CREATE TABLE IF NOT EXISTS migraciones (nombre VARCHAR(60) PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now());
  ALTER TABLE fichas ALTER COLUMN jornada TYPE VARCHAR(12);
  ALTER TABLE fichas DROP CONSTRAINT IF EXISTS fichas_jornada_check;
  ALTER TABLE fichas ADD CONSTRAINT fichas_jornada_check CHECK (jornada IN ('Mañana', 'Tarde', 'Noche', 'Sábados', 'Por definir'));
  ALTER TABLE mensajes_contacto ALTER COLUMN interes TYPE VARCHAR(12);
  ALTER TABLE mensajes_contacto DROP CONSTRAINT IF EXISTS mensajes_contacto_interes_check;
  ALTER TABLE mensajes_contacto ADD CONSTRAINT mensajes_contacto_interes_check
    CHECK (interes IN ('curso', 'mentor', 'alianza', 'otro', 'patrocinar', 'donar', 'espacio', 'estudiar', 'difundir'));`;

/* Piloto 2027: carga la ruta de 4 cursos una sola vez (ver la cabecera del archivo) */
const moduloLimpio = (m) => ({ titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || "", actividades: m.actividades || [], evidencia: m.evidencia || "" });
async function piloto2027(db) {
  if ((await db.query("SELECT 1 FROM migraciones WHERE nombre = 'piloto-2027'")).rowCount) return console.log("ℹ La ruta del piloto 2027 ya estaba cargada");
  let creados = 0, actualizados = 0, fichasNuevas = 0;
  for (const c of cursos) {
    const v = [c.titulo, c.area, c.nivel, Number(c.duracion), c.modalidad, c.fase, c.instructor, Number(c.edadMinima ?? 14), c.descripcion,
      c.objetivo || null, c.temario || [], JSON.stringify((c.modulos || []).map(moduloLimpio)), JSON.stringify(c.guia || {}), c.proyecto || null];
    const { rowCount } = await db.query(`UPDATE cursos SET area=$2, nivel=$3, duracion_semanas=$4, modalidad=$5, fase=$6, instructor=$7, docente_id=NULL,
      edad_minima=$8, descripcion=$9, objetivo=$10, temario=$11, modulos=$12, guia=$13, proyecto=$14, actualizado_en=now() WHERE titulo = $1`, v);
    if (rowCount) actualizados++;
    else {
      await db.query(`INSERT INTO cursos (titulo, area, nivel, duracion_semanas, modalidad, fase, instructor, edad_minima, descripcion, objetivo, temario, modulos, guia, proyecto)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, v);
      creados++;
    }
    const numeros = fichas.filter((f) => f.curso_id === c.id).map((f) => f.numero);
    await db.query(`UPDATE fichas SET estado = 'Finalizada' WHERE curso_id = (SELECT id FROM cursos WHERE titulo = $1) AND NOT (numero = ANY($2))`, [c.titulo, numeros]);
  }
  for (const f of fichas) {
    const titulo = cursos.find((c) => c.id === f.curso_id)?.titulo;
    const { rowCount } = await db.query(`INSERT INTO fichas (numero, curso_id, jornada, fecha_inicio, cupos, estado)
      SELECT $1, id, $3, $4, $5, $6 FROM cursos WHERE titulo = $2 ON CONFLICT (numero) DO NOTHING`,
      [f.numero, titulo, f.jornada, f.inicio || null, Number(f.cupos), f.estado]);
    fichasNuevas += rowCount;
  }
  await db.query("INSERT INTO migraciones (nombre) VALUES ('piloto-2027')");
  console.log(`✔ Ruta del piloto 2027: ${creados} curso(s) nuevo(s), ${actualizados} actualizado(s) y ${fichasNuevas} ficha(s) nueva(s)`);
}

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
    console.log("✔ Columnas y tablas al día (fichas, encuestas, recuperación de contraseña, registro de seguridad y autorización de datos)");

    let conModulos = 0;
    for (const c of cursos) {
      const { rowCount } = await db.query("UPDATE cursos SET modulos = $1, guia = $2 WHERE titulo = $3 AND modulos = '[]'::jsonb",
        [JSON.stringify((c.modulos || []).map(moduloLimpio)), JSON.stringify(c.guia || {}), c.titulo]);
      conModulos += rowCount;
    }
    console.log(`✔ Módulos y guía cargados en ${conModulos} curso(s)`);

    await piloto2027(db);

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

    // Último ingreso de ejemplo para estudiantes de prueba (solo si nunca han ingresado): así admisiones
    // tiene cuentas inactivas para revisar. No toca cuentas creadas por personas reales.
    let inactivos = 0;
    for (const [correo, dias] of [["kevin.ariza@correo.com", 95], ["daniela.ruiz@correo.com", 48], ["luis.gomez@correo.com", 6]]) {
      const { rowCount } = await db.query(`UPDATE usuarios SET ultimo_ingreso = now() - make_interval(days => $2),
        creado_en = LEAST(creado_en, now() - make_interval(days => $2 + 30)) WHERE correo = $1 AND rol = 'estudiante' AND ultimo_ingreso IS NULL`, [correo, dias]);
      inactivos += rowCount;
    }
    console.log(`✔ Último ingreso de ejemplo en ${inactivos} estudiante(s) de prueba`);

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
