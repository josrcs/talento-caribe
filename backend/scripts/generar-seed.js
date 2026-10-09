/* ==========================================================
   generar-seed.js - Genera database/seed.sql
   Toma el catálogo de js/cursos-data.js (la misma fuente que usa la página)
   y crea cuentas de prueba con contraseñas cifradas con bcrypt.
   Uso: node scripts/generar-seed.js   (solo si cambias el catálogo o las cuentas)
   ========================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const bcrypt = require("bcryptjs");

const RAIZ = path.join(__dirname, "..", "..");
const contexto = { window: {}, localStorage: { getItem: () => null } };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", "cursos-data.js"), "utf8"), contexto);
vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", "encuestas-data.js"), "utf8"), contexto);
const cursos = contexto.window.TALENTO_CARIBE_CURSOS;
const fichas = contexto.window.TALENTO_CARIBE_FICHAS;
const respuestasEjemplo = contexto.window.TALENTO_CARIBE_RESPUESTAS_EJEMPLO;

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
  ["Daniela Ruiz", "daniela.ruiz@correo.com", "Venezuela", "Pasaporte", "V20000005", "2006-05-30", "+57 300 000 0005", "Barranquilla", "Atlántico"],
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

sql.push("\n-- Cursos (mismo catálogo que js/cursos-data.js). El docente se enlaza por su nombre.");
for (const c of cursos) {
  const modulos = (c.modulos || []).map((m) => ({ titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || "", actividades: m.actividades || [], evidencia: m.evidencia || "" }));
  sql.push(`INSERT INTO cursos (id, titulo, area, nivel, duracion_semanas, modalidad, fase, docente_id, instructor, edad_minima, descripcion, objetivo, temario, modulos, guia, proyecto) VALUES (${c.id}, ${q(c.titulo)}, ${q(c.area)}, ${q(c.nivel)}, ${c.duracion}, ${q(c.modalidad)}, ${q(c.fase)}, (SELECT id FROM usuarios WHERE nombre = ${q(c.instructor)} AND rol = 'docente'), ${q(c.instructor)}, ${Number(c.edadMinima ?? 14)}, ${q(c.descripcion)}, ${q(c.objetivo)}, ${arr(c.temario || [])}, ${q(JSON.stringify(modulos))}::jsonb, ${q(JSON.stringify(c.guia || {}))}::jsonb, ${q(c.proyecto)});`);
}
sql.push("SELECT setval(pg_get_serial_sequence('cursos', 'id'), (SELECT max(id) FROM cursos));");

sql.push("\n-- Fichas (grupos de cada curso, mismo listado que js/cursos-data.js)");
sql.push("INSERT INTO fichas (numero, curso_id, jornada, fecha_inicio, cupos, estado) VALUES\n" +
  fichas.map((f) => `  (${q(f.numero)}, ${f.curso_id}, ${q(f.jornada)}, ${q(f.inicio)}, ${Number(f.cupos)}, ${q(f.estado)})`).join(",\n") + ";");
const fic = (numero) => numero ? `(SELECT id FROM fichas WHERE numero = ${q(numero)})` : "NULL";

const est = (correo) => `(SELECT id FROM usuarios WHERE correo = ${q(correo)})`;
sql.push("\n-- Inscripciones de ejemplo");
const ins = [[1, "estudiante@talentocaribe.co", "aprobada", 20, "25896"], [3, "estudiante@talentocaribe.co", "aprobada", 18, "25921"], [7, "estudiante@talentocaribe.co", "aprobada", 12, "25963"], [1, "luis.gomez@correo.com", "aprobada", 19, "25896"], [1, "andrea.castro@correo.com", "aprobada", 18, "25896"], [3, "maria.torres@correo.com", "aprobada", 15, "25921"], [3, "kevin.ariza@correo.com", "aprobada", 14, "25921"], [8, "daniela.ruiz@correo.com", "aprobada", 11, "25974"], [9, "kevin.ariza@correo.com", "pendiente", 3, "25985"], [2, "luis.gomez@correo.com", "pendiente", 2, "25910"], [7, "maria.torres@correo.com", "aprobada", 9, "25963"], [4, "daniela.ruiz@correo.com", "pendiente", 1, "25935"]];
sql.push("INSERT INTO inscripciones (curso_id, ficha_id, estudiante_id, edad, estado, creado_en) VALUES\n" + ins.map(([c, e, s, d, f]) => `  (${c}, ${fic(f)}, ${est(e)}, 17, '${s}', now() - interval '${d} days')`).join(",\n") + ";");

sql.push("\n-- Actividades de ejemplo (las fechas límite son relativas al día en que se carga la base)");
// curso, docente, tipo, título, objetivo, instrucciones, días para la fecha límite, recurso, hace cuántos días se creó, módulo, ficha ("" = todas)
const act = [
  [1, "Daniel Barrios", "Práctica", "El algoritmo de tu mañana", "Reconocer que un algoritmo es una secuencia ordenada de pasos.", "Escribe, paso a paso, lo que haces desde que te levantas hasta que sales de casa.\n1. Usa verbos al inicio de cada paso.\n2. Incluye al menos una decisión (SI llueve... ENTONCES...).\n3. Incluye al menos una repetición (MIENTRAS...).", 3, null, 4, 1, ""],
  [3, "Camila Ospino", "Tarea", "Tu primera página con 5 etiquetas", "Usar etiquetas HTML básicas para estructurar contenido.", "Crea un archivo index.html que use: h1, p, a, img y ul.\nEl tema es libre: tu comida caribeña favorita, tu barrio o un emprendimiento.\nPega el enlace de tu página (GitHub Pages o CodePen) o el código.", 5, "https://developer.mozilla.org/es/docs/Learn/HTML", 2, 1, ""],
  [7, "Valeria De la Hoz", "Quiz", "3 prompts para estudiar mejor", "Escribir instrucciones claras y verificar respuestas de la IA.", "Escribe 3 prompts que te ayuden a estudiar un tema del colegio o del curso.\nPara cada uno explica qué rol le das a la IA y cómo verificarías su respuesta.", -1, null, 7, 4, ""],
  [3, "Camila Ospino", "Lectura", "¿Cómo funciona la web?", "Comprender el recorrido de una página desde el servidor hasta tu pantalla.", "Lee el recurso y responde con tus palabras:\n1. ¿Qué es un navegador?\n2. ¿Qué pasa cuando escribes una dirección web?", 9, "https://developer.mozilla.org/es/docs/Learn/Getting_started_with_the_web/How_the_Web_works", 1, 1, ""],
  [8, "Andrés Pacheco", "Práctica", "Calcula la resistencia de tu LED", "Aplicar V = I × R en un circuito real.", "Con una fuente de 5V y un LED rojo (2V, 20mA), calcula la resistencia con la ley de Ohm. Explica cada paso.", 4, null, 2, 3, ""],
  [1, "Daniel Barrios", "Quiz", "Algoritmos en la tienda del barrio", "Identificar algoritmos en situaciones cotidianas.", "Responde con tus palabras:\n1. ¿Qué pasos sigue el tendero para cobrarte?\n2. ¿Dónde hay una decisión?\n3. ¿Dónde hay una repetición?", -3, null, 10, 1, "25896"],
  [1, "Daniel Barrios", "Tarea", "Variables de una tienda", "Reconocer variables y tipos de datos.", "Haz una lista de 5 datos que guarda una tienda (precio, cantidad, nombre...).\nPara cada uno indica su tipo de dato y un ejemplo de valor.", 6, null, 1, 4, "25896"],
  [3, "Camila Ospino", "Práctica", "Dale color a tu página", "Aplicar colores, tipografías y modelo de caja.", "Usa CSS para cambiar en tu página:\n1. El color de fondo y de los títulos.\n2. La tipografía.\n3. Márgenes y relleno de al menos dos bloques.", 12, null, 0, 3, "25921"],
];
sql.push("INSERT INTO actividades (curso_id, docente_id, modulo, ficha_id, tipo, titulo, objetivo, descripcion, fecha_limite, recurso, creado_en) VALUES\n" +
  act.map(([c, d, t, ti, o, de, f, r, cr, m, fi]) => `  (${c}, (SELECT id FROM usuarios WHERE nombre = ${q(d)}), ${m}, ${fic(fi)}, ${q(t)}, ${q(ti)}, ${q(o)}, ${q(de)}, CURRENT_DATE + ${f}, ${q(r)}, now() - interval '${cr} days')`).join(",\n") + ";");

sql.push("\n-- Entregas de ejemplo");
const actId = (titulo) => `(SELECT id FROM actividades WHERE titulo = ${q(titulo)})`;
sql.push(`INSERT INTO entregas (actividad_id, estudiante_id, respuesta, enlace, estado, nota, comentario, creado_en, revisado_en) VALUES
  (${actId("3 prompts para estudiar mejor")}, ${est("estudiante@talentocaribe.co")}, ${q("1. Actúa como profesor de biología y explícame la fotosíntesis con un ejemplo de Barranquilla.\n2. Hazme 5 preguntas tipo examen sobre fracciones.\n3. Resume este texto en 5 ideas y dime qué fuentes revisar.")}, NULL, 'revisada', 4.6, ${q("¡Muy buen trabajo, Sofía! Tus roles son claros. Para el tercero, pide también que la IA señale qué partes no está segura.")}, now() - interval '1 day', now()),
  (${actId("El algoritmo de tu mañana")}, ${est("luis.gomez@correo.com")}, ${q("1. Apagar la alarma\n2. SI tengo sueño ENTONCES pospongo 5 min\n3. MIENTRAS no esté listo: vestirme...")}, NULL, 'entregada', NULL, NULL, now() - interval '1 day', NULL),
  (${actId("Tu primera página con 5 etiquetas")}, ${est("maria.torres@correo.com")}, ${q("Hice una página sobre la arepa de huevo.")}, 'https://codepen.io/', 'entregada', NULL, NULL, now() - interval '1 day', NULL),
  (${actId("3 prompts para estudiar mejor")}, ${est("maria.torres@correo.com")}, ${q("Prompts para estudiar inglés con ejemplos de conversación.")}, NULL, 'revisada', 2.8, ${q("Vas bien, pero falta explicar cómo verificarías las respuestas.")}, now() - interval '2 days', now() - interval '1 day'),
  (${actId("Algoritmos en la tienda del barrio")}, ${est("estudiante@talentocaribe.co")}, ${q("1. Me saluda, 2. pregunta qué quiero, 3. SI tiene el producto lo busca, 4. MIENTRAS haya productos los suma, 5. me cobra.")}, NULL, 'revisada', 4.2, ${q("Muy bien identificada la repetición. Revisa el orden del paso 3.")}, now() - interval '4 days', now() - interval '2 days'),
  (${actId("Algoritmos en la tienda del barrio")}, ${est("andrea.castro@correo.com")}, ${q("El tendero escucha, busca, suma y cobra. Si no hay cambio, pide sencillo.")}, NULL, 'revisada', 3.6, ${q("Bien la decisión del cambio. Falta la repetición.")}, now() - interval '4 days', now() - interval '2 days'),
  (${actId("El algoritmo de tu mañana")}, ${est("andrea.castro@correo.com")}, ${q("1. Me levanto\n2. SI hace calor ENTONCES me baño con agua fría\n3. MIENTRAS desayuno escucho música.")}, NULL, 'entregada', NULL, NULL, now() - interval '1 day', NULL),
  (${actId("¿Cómo funciona la web?")}, ${est("kevin.ariza@correo.com")}, ${q("El navegador es el programa que pide la página al servidor y la dibuja en pantalla.")}, NULL, 'revisada', 4.0, ${q("Clara tu explicación. Agrega qué papel cumple el DNS.")}, now() - interval '1 day', now());`);

sql.push("\n-- Respuestas de encuestas de ejemplo (js/encuestas-data.js)");
sql.push("INSERT INTO respuestas_encuesta (encuesta, estudiante_id, respuestas, creado_en) VALUES\n" +
  respuestasEjemplo.map((r, i) => `  (${q(r.encuesta)}, ${est(r.correo)}, ${q(JSON.stringify(r.respuestas))}::jsonb, now() - interval '${i % 9} days')`).join(",\n") + ";");

sql.push(`\n-- Configuración del asistente
INSERT INTO config_ia (id, tono, contexto) VALUES (1,
  ${q("Cercano, motivador y en español sencillo, con orgullo caribeño. Responde como Talento Caribe y no inventes información.")},
  ${q("Talento Caribe es una plataforma educativa gratuita e híbrida de software y hardware para jóvenes de Barranquilla, el Caribe y Latinoamérica. Todos los cursos son gratuitos. Sede en Barranquilla.")});

COMMIT;
`);
fs.writeFileSync(path.join(RAIZ, "database", "seed.sql"), sql.join("\n"));
console.log(`✔ database/seed.sql generado: ${cursos.length} cursos, ${fichas.length} fichas, ${DOCENTES.length} docentes, ${ESTUDIANTES.length} estudiantes y 1 administrativo.`);
