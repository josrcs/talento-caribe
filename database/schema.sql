-- ============================================================
-- Talento Caribe - Esquema de base de datos (PostgreSQL)
-- Se ejecuta con: npm run db:init (desde la carpeta backend)
-- o manualmente: psql -U postgres -d talento_caribe -f database/schema.sql
--
-- Modelo:
--   usuarios ──< inscripciones >── fichas >── cursos ──< actividades ──< entregas >── usuarios
--   (cada curso se divide en módulos y tiene una o más fichas (grupos) con número propio;
--    el estudiante se inscribe en una ficha; el docente publica actividades por módulo,
--    para una ficha o para todas; cada estudiante entrega una vez por actividad y recibe nota)
-- ============================================================

-- ---------- Usuarios: estudiantes, docentes y personal administrativo ----------
-- La contraseña se guarda cifrada con bcrypt (clave_hash), nunca en texto plano.
CREATE TABLE usuarios (
  id                     SERIAL PRIMARY KEY,
  nombre                 VARCHAR(100) NOT NULL,
  correo                 VARCHAR(120) NOT NULL UNIQUE,
  clave_hash             VARCHAR(100) NOT NULL,
  rol                    VARCHAR(15)  NOT NULL CHECK (rol IN ('estudiante', 'docente', 'administrativo')),
  puesto                 VARCHAR(60),   -- cargo administrativo. NULL = cuenta de demostración que puede elegir cualquier cargo
  especialidad           VARCHAR(80),   -- solo docentes
  -- Perfil de inscripción (estudiantes)
  pais                   VARCHAR(60),
  tipo_documento         VARCHAR(60),
  numero_documento       VARCHAR(30),
  fecha_nacimiento       DATE,
  telefono               VARCHAR(30),
  direccion              VARCHAR(150),
  ciudad                 VARCHAR(80),
  region                 VARCHAR(80),
  codigo_postal          VARCHAR(15),
  ultimo_estudio         VARCHAR(60),
  documentos_disponibles TEXT[]       NOT NULL DEFAULT '{}',
  acudiente_nombre       VARCHAR(100),
  acudiente_documento    VARCHAR(30),
  acudiente_telefono     VARCHAR(30),
  acudiente_correo       VARCHAR(120),
  activo                 BOOLEAN      NOT NULL DEFAULT true,
  sesiones_desde         TIMESTAMPTZ  NOT NULL DEFAULT now(), -- los tokens emitidos antes de esta hora ya no sirven (cambio de clave)
  creado_en              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (correo = lower(correo)),
  CHECK (rol <> 'administrativo' OR especialidad IS NULL)
);

-- ---------- Catálogo de cursos ----------
CREATE TABLE cursos (
  id                SERIAL PRIMARY KEY,
  titulo            VARCHAR(100) NOT NULL UNIQUE,
  area              VARCHAR(20)  NOT NULL CHECK (area IN ('Software', 'Hardware')),
  nivel             VARCHAR(20)  NOT NULL CHECK (nivel IN ('Básico', 'Intermedio')),
  duracion_semanas  SMALLINT     NOT NULL CHECK (duracion_semanas BETWEEN 1 AND 52),
  modalidad         VARCHAR(20)  NOT NULL CHECK (modalidad IN ('Virtual', 'Presencial', 'Híbrido')),
  fase              VARCHAR(20)  NOT NULL DEFAULT 'Próximamente' CHECK (fase IN ('Lanzamiento', 'Próximamente')),
  docente_id        INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  instructor        VARCHAR(100) NOT NULL,          -- nombre que se muestra en el catálogo
  edad_minima       SMALLINT     NOT NULL DEFAULT 14 CHECK (edad_minima BETWEEN 0 AND 100),
  descripcion       TEXT         NOT NULL,
  objetivo          TEXT,
  temario           TEXT[]       NOT NULL DEFAULT '{}', -- un elemento por módulo ("Nombre: tema 1, tema 2")
  modulos           JSONB        NOT NULL DEFAULT '[]', -- [{ "titulo", "temas": [...], "temasTexto", "actividades": [...], "evidencia" }]
  guia              JSONB        NOT NULL DEFAULT '{}', -- guía docente del curso: { "modalidad", "nota", "reto", "preguntas": [...] }
  proyecto          VARCHAR(200),
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Fichas: cada grupo de un curso, con un número para ubicarlo (ej. 25896) ----------
CREATE TABLE fichas (
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

-- ---------- Inscripciones: un estudiante solo puede solicitar una vez cada curso ----------
CREATE TABLE inscripciones (
  id             SERIAL PRIMARY KEY,
  curso_id       INTEGER     NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  ficha_id       INTEGER     REFERENCES fichas(id) ON DELETE SET NULL,
  estudiante_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  edad           SMALLINT    NOT NULL CHECK (edad BETWEEN 0 AND 130),
  estado         VARCHAR(12) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revisado_en    TIMESTAMPTZ,
  UNIQUE (curso_id, estudiante_id)
);

-- ---------- Actividades que los docentes publican en sus cursos ----------
CREATE TABLE actividades (
  id            SERIAL PRIMARY KEY,
  curso_id      INTEGER      NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  docente_id    INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo        SMALLINT     NOT NULL DEFAULT 1 CHECK (modulo BETWEEN 1 AND 30), -- número del módulo del curso
  ficha_id      INTEGER      REFERENCES fichas(id) ON DELETE CASCADE,          -- NULL = para todas las fichas del curso
  tipo          VARCHAR(12)  NOT NULL CHECK (tipo IN ('Tarea', 'Práctica', 'Quiz', 'Lectura', 'Proyecto')),
  titulo        VARCHAR(90)  NOT NULL CHECK (length(titulo) >= 4),
  objetivo      VARCHAR(160),
  descripcion   TEXT         NOT NULL CHECK (length(descripcion) >= 15),
  fecha_limite  DATE         NOT NULL,
  recurso       VARCHAR(300) CHECK (recurso IS NULL OR recurso ~ '^https?://'),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Entregas de los estudiantes (una por actividad) y su calificación ----------
CREATE TABLE entregas (
  id             SERIAL PRIMARY KEY,
  actividad_id   INTEGER      NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  estudiante_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  respuesta      TEXT         NOT NULL CHECK (length(respuesta) >= 10),
  enlace         VARCHAR(300) CHECK (enlace IS NULL OR enlace ~ '^https?://'),
  estado         VARCHAR(10)  NOT NULL DEFAULT 'entregada' CHECK (estado IN ('entregada', 'revisada')),
  nota           NUMERIC(2,1) CHECK (nota BETWEEN 1.0 AND 5.0),   -- escala colombiana 1.0 a 5.0
  comentario     TEXT,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  revisado_en    TIMESTAMPTZ,
  UNIQUE (actividad_id, estudiante_id),
  CHECK (estado = 'entregada' OR nota IS NOT NULL)          -- una entrega revisada siempre tiene nota
);

-- ---------- Mensajes del formulario de contacto ----------
CREATE TABLE mensajes_contacto (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(80)  NOT NULL,
  correo     VARCHAR(120) NOT NULL,
  telefono   VARCHAR(20),
  interes    VARCHAR(10)  NOT NULL CHECK (interes IN ('curso', 'mentor', 'alianza', 'otro')),
  asunto     VARCHAR(100) NOT NULL,
  mensaje    TEXT         NOT NULL,
  leido      BOOLEAN      NOT NULL DEFAULT false,
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Control de gastos (Administración y finanzas) ----------
CREATE TABLE gastos (
  id          SERIAL PRIMARY KEY,
  concepto    VARCHAR(100) NOT NULL,
  categoria   VARCHAR(20)  NOT NULL CHECK (categoria IN ('Materiales', 'Conectividad', 'Transporte', 'Servicios', 'Otro')),
  valor       INTEGER      NOT NULL CHECK (valor > 0),          -- pesos colombianos
  usuario_id  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Configuración del asistente IA (una sola fila) ----------
CREATE TABLE config_ia (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tono            TEXT NOT NULL DEFAULT '',
  contexto        TEXT NOT NULL DEFAULT '',
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Respuestas de las encuestas (js/encuestas-data.js): una por estudiante y encuesta ----------
-- El panel muestra los resultados agrupados y sin nombres; estudiante_id solo evita respuestas repetidas.
CREATE TABLE respuestas_encuesta (
  id             SERIAL PRIMARY KEY,
  encuesta       VARCHAR(40) NOT NULL,            -- id de la encuesta, por ejemplo "experiencia-curso"
  estudiante_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  respuestas     JSONB       NOT NULL,            -- { "claridad": 4, "proyecto": "En parte", "tema": "..." }
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (encuesta, estudiante_id)
);

-- ---------- Recuperación de contraseña: enlaces de un solo uso que vencen en 1 hora ----------
-- Se guarda el SHA-256 del enlace, nunca el enlace: si alguien lee la tabla no puede usarlo.
CREATE TABLE recuperaciones_clave (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  CHAR(64)    NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Registro de seguridad: ingresos, fallos, bloqueos y cambios de contraseña ----------
-- Lo revisa el equipo en el panel (sección Seguridad). Nunca guarda contraseñas. Se conserva 90 días.
CREATE TABLE eventos_seguridad (
  id          BIGSERIAL PRIMARY KEY,
  tipo        VARCHAR(25)  NOT NULL CHECK (tipo IN ('ingreso', 'ingreso_fallido', 'bloqueo', 'clave_cambiada', 'recuperacion_pedida',
                                                     'clave_restablecida', 'sesiones_cerradas', 'registro')),
  usuario_id  INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
  correo      VARCHAR(120),             -- el correo escrito (puede no existir: intentos con cuentas inventadas)
  ip          VARCHAR(60),
  agente      VARCHAR(200),             -- navegador que hizo la petición
  detalle     VARCHAR(200),
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- Índices para las consultas más frecuentes ----------
CREATE INDEX idx_recuperaciones_usuario  ON recuperaciones_clave (usuario_id);
CREATE INDEX idx_eventos_seguridad_fecha ON eventos_seguridad (creado_en DESC);
CREATE INDEX idx_cursos_filtros          ON cursos (area, nivel, modalidad);
CREATE INDEX idx_cursos_docente          ON cursos (docente_id);
CREATE INDEX idx_fichas_curso            ON fichas (curso_id);
CREATE INDEX idx_inscripciones_ficha     ON inscripciones (ficha_id);
CREATE INDEX idx_actividades_modulo      ON actividades (curso_id, modulo);
CREATE INDEX idx_inscripciones_estudiante ON inscripciones (estudiante_id);
CREATE INDEX idx_inscripciones_estado    ON inscripciones (estado);
CREATE INDEX idx_actividades_curso       ON actividades (curso_id, fecha_limite);
CREATE INDEX idx_entregas_estudiante     ON entregas (estudiante_id);
CREATE INDEX idx_entregas_estado         ON entregas (estado);
CREATE INDEX idx_mensajes_leido          ON mensajes_contacto (leido, creado_en DESC);

-- ---------- Vista: resumen académico por curso (la usa el panel administrativo) ----------
CREATE VIEW vista_resumen_cursos AS
SELECT
  c.id                                                    AS curso_id,
  c.titulo,
  c.area,
  c.fase,
  c.instructor,
  (SELECT count(*) FROM inscripciones i WHERE i.curso_id = c.id AND i.estado = 'aprobada')::int AS estudiantes,
  (SELECT count(*) FROM inscripciones i WHERE i.curso_id = c.id)::int                          AS solicitudes,
  (SELECT count(*) FROM actividades a WHERE a.curso_id = c.id)::int                            AS actividades,
  (SELECT count(*) FROM entregas e JOIN actividades a ON a.id = e.actividad_id WHERE a.curso_id = c.id)::int AS entregas,
  (SELECT round(avg(e.nota), 1) FROM entregas e JOIN actividades a ON a.id = e.actividad_id WHERE a.curso_id = c.id) AS promedio
FROM cursos c;
