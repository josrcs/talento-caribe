/* ==========================================================
   consultas.js - Consultas SQL reutilizables
   Los alias (AS "edadMinima", id::text...) devuelven los datos con la
   misma forma que ya usa el frontend, para no reescribir la página.
   ========================================================== */
const SQL_CURSOS = `
  SELECT id, titulo, area, nivel, duracion_semanas AS duracion, modalidad, fase, instructor, docente_id,
         edad_minima AS "edadMinima", descripcion, objetivo, temario, modulos, guia, proyecto
  FROM cursos`;

const SQL_FICHAS = `
  SELECT f.numero, f.curso_id, f.jornada, to_char(f.fecha_inicio, 'YYYY-MM-DD') AS inicio, f.cupos, f.estado
  FROM fichas f`;

const SQL_INSCRIPCIONES = `
  SELECT i.id, i.curso_id, COALESCE(fi.numero, '') AS ficha, u.nombre, u.correo, i.edad, i.estado, i.creado_en AS creado
  FROM inscripciones i JOIN usuarios u ON u.id = i.estudiante_id LEFT JOIN fichas fi ON fi.id = i.ficha_id`;

const SQL_ACTIVIDADES = `
  SELECT a.id::text AS id, a.curso_id, a.modulo, COALESCE(fa.numero, '') AS ficha, d.nombre AS docente, a.tipo, a.titulo, a.objetivo, a.descripcion,
         a.fecha_limite, a.recurso, a.creado_en AS creado
  FROM actividades a JOIN usuarios d ON d.id = a.docente_id LEFT JOIN fichas fa ON fa.id = a.ficha_id`;

const SQL_ENTREGAS = `
  SELECT e.id::text AS id, e.actividad_id::text AS actividad_id, u.nombre, u.correo, e.respuesta, e.enlace,
         e.estado, e.nota, e.comentario, e.creado_en AS creado, e.revisado_en AS revisado
  FROM entregas e JOIN usuarios u ON u.id = e.estudiante_id`;

/* Datos públicos del usuario para la sesión del navegador (sin la contraseña) */
const CAMPOS_PERFIL = ["nombre", "correo", "rol", "puesto", "especialidad", "pais", "tipo_documento", "numero_documento", "fecha_nacimiento",
  "telefono", "direccion", "ciudad", "region", "codigo_postal", "ultimo_estudio", "documentos_disponibles",
  "acudiente_nombre", "acudiente_documento", "acudiente_telefono", "acudiente_correo"];
const perfilPublico = (fila) => Object.fromEntries(CAMPOS_PERFIL.map((c) => [c, fila[c] ?? (c === "documentos_disponibles" ? [] : "")]));

module.exports = { SQL_CURSOS, SQL_FICHAS, SQL_INSCRIPCIONES, SQL_ACTIVIDADES, SQL_ENTREGAS, CAMPOS_PERFIL, perfilPublico };
