/* ==========================================================
   generar-seed.js - Genera database/seed.sql
   Toma el catálogo de compartido/cursos.json (la misma fuente que usa la página)
   y crea cuentas de prueba con contraseñas cifradas con bcrypt.
   Uso: node scripts/generar-seed.js   (solo si cambias el catálogo o las cuentas)
   ========================================================== */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const RAIZ = path.join(__dirname, "..", "..");
// Catálogo y encuestas compartidos con la página en React (frontend/src importa los mismos archivos)
const { cursos, fichas } = require("../../compartido/cursos.json");
const { respuestasEjemplo } = require("../../compartido/encuestas.json");

const q = (v) => (v === null || v === undefined ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'");
const arr = (lista) => "ARRAY[" + lista.map(q).join(", ") + "]::text[]";
const hash = (clave) => bcrypt.hashSync(clave, 10);

const DOCENTES = [
  ["Camila Ospino", "docente@talentocaribe.co", "Desarrollo web"],
  ["Daniel Barrios", "daniel@talentocaribe.co", "Programación y datos"],
  ["Valeria De la Hoz", "valeria@talentocaribe.co", "IA aplicada"],
  ["Andrés Pacheco", "andres@talentocaribe.co", "Electrónica y robótica"],
  ["Laura Mendoza", "laura@talentocaribe.co", "Hardware e IoT"],
];
const ESTUDIANTES = [
  ["Sofía Pérez", "estudiante@talentocaribe.co", "Colombia", "Tarjeta de identidad", "1043000001", "2009-03-14", "+57 300 000 0001", "Barranquilla", "Atlántico"],
  ["Luis Gómez", "luis.gomez@correo.com", "Colombia", "Cédula de ciudadanía", "1043000002", "2005-07-02", "+57 300 000 0002", "Soledad", "Atlántico"],
  ["María Torres", "maria.torres@correo.com", "Colombia", "Tarjeta de identidad", "1043000003", "2008-11-20", "+57 300 000 0003", "Barranquilla", "Atlántico"],
  ["Kevin Ariza", "kevin.ariza@correo.com", "Colombia", "Cédula de ciudadanía", "1043000004", "2004-01-09", "+57 300 000 0004", "Malambo", "Atlántico"],
  ["Daniela Ruiz", "daniela.ruiz@correo.com", "Colombia", "Cédula de extranjería", "520000005", "2006-05-30", "+57 300 000 0005", "Barranquilla", "Atlántico"],
  ["Andrea Castro", "andrea.castro@correo.com", "Colombia", "Tarjeta de identidad", "1043000006", "2008-08-12", "+57 300 000 0006", "Puerto Colombia", "Atlántico"],
];

const h = { est: hash("Estudiante123"), doc: hash("Docente123"), adm: hash("Admin123") };
const sql = [];
sql.push(`-- ============================================================
-- Talento Caribe - Datos iniciales (generado por backend/scripts/generar-seed.js)
-- Ejecutar después de schema.sql. Cuentas de prueba:
--   Estudiante:     estudiante@talentocaribe.co / Estudiante123
--   Docentes:       docente@ daniel@ valeria@ andres@ laura@talentocaribe.co / Docente123
--   Administrativo: admin@talentocaribe.co / Admin123 (puede elegir cualquier cargo)
-- ============================================================
BEGIN;
`);
sql.push("-- Usuarios");
sql.push("INSERT INTO usuarios (nombre, correo, clave_hash, rol, puesto) VALUES " + `(${q("José Rodríguez")}, ${q("admin@talentocaribe.co")}, ${q(h.adm)}, 'administrativo', NULL);`);
sql.push("INSERT INTO usuarios (nombre, correo, clave_hash, rol, especialidad) VALUES\n" + DOCENTES.map(([n, c, e]) => `  (${q(n)}, ${q(c)}, ${q(h.doc)}, 'docente', ${q(e)})`).join(",\n") + ";");
sql.push("INSERT INTO usuarios (nombre, correo, clave_hash, rol, pais, tipo_documento, numero_documento, fecha_nacimiento, telefono, ciudad, region, ultimo_estudio) VALUES\n" +
  ESTUDIANTES.map(([n, c, p, td, nd, fn, t, ci, r]) => `  (${q(n)}, ${q(c)}, ${q(h.est)}, 'estudiante', ${q(p)}, ${q(td)}, ${q(nd)}, ${q(fn)}, ${q(t)}, ${q(ci)}, ${q(r)}, 'Secundaria o bachillerato')`).join(",\n") + ";");

sql.push("\n-- Cursos (mismo catálogo que compartido/cursos.json). El docente se enlaza por su nombre.");
for (const c of cursos) {
  const modulos = (c.modulos || []).map((m) => ({ titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || "", actividades: m.actividades || [], evidencia: m.evidencia || "" }));
  sql.push(`INSERT INTO cursos (id, titulo, area, nivel, duracion_semanas, modalidad, fase, docente_id, instructor, edad_minima, descripcion, objetivo, temario, modulos, guia, proyecto) VALUES (${c.id}, ${q(c.titulo)}, ${q(c.area)}, ${q(c.nivel)}, ${c.duracion}, ${q(c.modalidad)}, ${q(c.fase)}, (SELECT id FROM usuarios WHERE nombre = ${q(c.instructor)} AND rol = 'docente'), ${q(c.instructor)}, ${Number(c.edadMinima ?? 14)}, ${q(c.descripcion)}, ${q(c.objetivo)}, ${arr(c.temario || [])}, ${q(JSON.stringify(modulos))}::jsonb, ${q(JSON.stringify(c.guia || {}))}::jsonb, ${q(c.proyecto)});`);
}
sql.push("SELECT setval(pg_get_serial_sequence('cursos', 'id'), (SELECT max(id) FROM cursos));");

sql.push("\n-- Fichas (grupos de cada curso, mismo listado que compartido/cursos.json)");
sql.push("INSERT INTO fichas (numero, curso_id, jornada, fecha_inicio, cupos, estado) VALUES\n" +
  fichas.map((f) => `  (${q(f.numero)}, ${f.curso_id}, ${q(f.jornada)}, ${q(f.inicio)}, ${Number(f.cupos)}, ${q(f.estado)})`).join(",\n") + ";");
const fic = (numero) => numero ? `(SELECT id FROM fichas WHERE numero = ${q(numero)})` : "NULL";

const est = (correo) => `(SELECT id FROM usuarios WHERE correo = ${q(correo)})`;
sql.push("\n-- Inscripciones de ejemplo en la ruta del piloto 2027");
// curso, estudiante, estado, hace cuántos días, ficha. No hay actividades ni entregas de ejemplo:
// los cursos del piloto todavía no tienen mentor asignado.
const ins = [[1, "estudiante@talentocaribe.co", "aprobada", 6, "27101"], [1, "luis.gomez@correo.com", "aprobada", 5, "27101"], [1, "maria.torres@correo.com", "pendiente", 2, "27101"],
  [1, "andrea.castro@correo.com", "pendiente", 1, "27101"], [1, "kevin.ariza@correo.com", "pendiente", 3, "27101"], [1, "daniela.ruiz@correo.com", "pendiente", 1, "27101"]];
sql.push("INSERT INTO inscripciones (curso_id, ficha_id, estudiante_id, edad, estado, creado_en) VALUES\n" + ins.map(([c, e, s, d, f]) => `  (${c}, ${fic(f)}, ${est(e)}, 17, '${s}', now() - interval '${d} days')`).join(",\n") + ";");

sql.push("\n-- Respuestas de encuestas de ejemplo (compartido/encuestas.json)");
sql.push("INSERT INTO respuestas_encuesta (encuesta, estudiante_id, respuestas, creado_en) VALUES\n" +
  respuestasEjemplo.map((r, i) => `  (${q(r.encuesta)}, ${est(r.correo)}, ${q(JSON.stringify(r.respuestas))}::jsonb, now() - interval '${i % 9} days')`).join(",\n") + ";");

sql.push(`\n-- Configuración del asistente
INSERT INTO config_ia (id, tono, contexto) VALUES (1,
  ${q("Cercano, motivador y en español sencillo, con orgullo caribeño. Responde como Talento Caribe y no inventes información.")},
  ${q("Talento Caribe es una plataforma educativa gratuita para jóvenes. Su piloto 2027 es presencial en Barranquilla y solo para personas en Colombia: la ruta «Programación desde cero», con 5 módulos (Lógica de programación, Git y GitHub, HTML y CSS, JavaScript y Bases de datos con SQL). Cada módulo dura 2 semanas, con una clase presencial por semana. Está en planeación: se reciben solicitudes, el equipo las aprueba y los grupos se harán en el primer y segundo trimestre de 2027; las fechas se avisan por correo. Al terminar se entrega una constancia de participación, no un certificado oficial. Después el proyecto se extenderá por Latinoamérica.")});

COMMIT;
`);
fs.writeFileSync(path.join(RAIZ, "database", "seed.sql"), sql.join("\n"));
console.log(`✔ database/seed.sql generado: ${cursos.length} cursos, ${fichas.length} fichas, ${DOCENTES.length} docentes, ${ESTUDIANTES.length} estudiantes y 1 administrativo.`);
