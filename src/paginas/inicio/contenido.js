/* contenido.js - Textos y datos fijos de la página de inicio.
   Para cambiar un mentor, una pregunta frecuente o el ritmo de una clase, se edita aquí.
   (Si agregas un texto nuevo, agrega también su traducción en js/i18n-en.js.) */

export const ENLACES_MENU = [
  { href: "cursos.html", texto: "Cursos" },
  { href: "#metodo", texto: "Cómo se aprende" },
  { href: "#nosotros", texto: "Nosotros" },
  { href: "#preguntas", texto: "Preguntas" },
  { href: "#contacto", texto: "Contacto" },
];
export const ACCIONES_MENU = [
  { href: "admin/login.html", texto: "Ingresar" },
  { href: "#empieza", texto: "Inscríbete", principal: true },
];

/* Orientador: [interés][experiencia] → curso recomendado y por qué */
export const INTERESES = [
  { valor: "web", titulo: "Crear páginas web y aplicaciones", detalle: "Diseño, código y publicar en internet" },
  { valor: "datos", titulo: "Trabajar con datos e inteligencia artificial", detalle: "Python, automatizar tareas, IA" },
  { valor: "hardware", titulo: "Armar circuitos y robots", detalle: "Electrónica, Arduino, sensores" },
  { valor: "explorar", titulo: "Todavía no lo sé", detalle: "Quiero una base para decidir" },
];
export const EXPERIENCIAS = [
  { valor: "no", titulo: "Nunca" },
  { valor: "si", titulo: "Sí, un poco" },
];
export const RECOMENDACIONES = {
  web: { no: [3, "Empiezas por lo visual: ves el resultado de cada línea que escribes y terminas con tu página publicada en internet."], si: [4, "Si ya escribiste algo de código, JavaScript es el paso que hace que una página responda a lo que hace la persona."] },
  datos: { no: [2, "Python es el lenguaje más usado para datos e inteligencia artificial, y uno de los más fáciles de leer para empezar."], si: [7, "Con una base de programación, aquí entiendes qué puede hacer la IA, cuáles son sus límites y cómo usarla bien."] },
  hardware: { no: [8, "Antes de programar una placa conviene entender la electricidad: aquí armas y mides tus primeros circuitos."], si: [9, "Si ya programaste, con Arduino llevas ese código al mundo físico: luces, sensores y motores."] },
  explorar: { no: [1, "Es el curso de entrada: aprendes a pensar un problema paso a paso, la base de cualquier ruta que elijas después."], si: [2, "Python sirve para casi todo y te deja probar varias áreas antes de decidir cuál seguir."] },
};

export const AREAS = [
  { area: "Software", descripcion: "Programación, web, datos e inteligencia artificial." },
  { area: "Hardware", descripcion: "Electrónica, computadores, robótica e internet de las cosas.", clase: "ruta-hardware" },
];

/* Ritmo de cada módulo: el mismo guion de clase que usan los docentes (TCSesiones en js/cursos-data.js) */
export const SEMANAS = [
  {
    numero: 1, titulo: "Entender y practicar",
    pasos: [
      { nombre: "Apertura", minutos: 10, texto: "Una pregunta sobre algo cotidiano para entrar en el tema." },
      { nombre: "Explicación", minutos: 25, texto: "El concepto en palabras sencillas y con un caso concreto." },
      { nombre: "Demostración", minutos: 20, texto: "El mentor resuelve el ejercicio paso a paso, en voz alta." },
      { nombre: "Práctica guiada", minutos: 25, texto: "Haces el mismo ejercicio con apoyo y pausas para revisar.", practica: true },
      { nombre: "Cierre", minutos: 10, texto: "Cuentas qué entendiste y qué error lograste corregir." },
    ],
  },
  {
    numero: 2, titulo: "Aplicar y mostrar",
    pasos: [
      { nombre: "Repaso", minutos: 10, texto: "Tres ideas clave con preguntas rápidas." },
      { nombre: "Revisión guiada", minutos: 10, texto: "Reconstruyen juntos los pasos y aclaran dudas." },
      { nombre: "Reto aplicado", minutos: 40, texto: "Una variación del ejercicio que resuelves tú.", practica: true },
      { nombre: "Revisión entre pares", minutos: 20, texto: "Intercambias tu trabajo con un compañero y se dan sugerencias.", practica: true },
      { nombre: "Entrega", minutos: 10, texto: "Aplicas una mejora y entregas la evidencia del módulo." },
    ],
  },
];

export const PROCESO = [
  { titulo: "Elige tu curso", texto: "Usa el orientador o revisa el catálogo: modalidad, horario y fecha de inicio de cada grupo.", tiempo: "5 minutos" },
  { titulo: "Inscríbete", texto: "Crea tu cuenta y envía la solicitud. Si eres menor de edad, te pedimos los datos de un acudiente.", tiempo: "10 minutos" },
  { titulo: "Aprende y construye", texto: "Ocho módulos con clases guiadas y una entrega en cada uno. Tu mentor revisa tu avance.", tiempo: "16 semanas" },
  { titulo: "Presenta tu proyecto", texto: "Terminas con un proyecto propio, tu certificado y la recomendación del siguiente curso.", tiempo: "Al terminar" },
];

/* Perfiles de ejemplo del proyecto académico: reemplázalos por mentores reales (con su permiso) */
export const MENTORES = [
  { iniciales: "CO", nombre: "Camila Ospino", perfil: "Ingeniera de software. Desarrollo web." },
  { iniciales: "DB", nombre: "Daniel Barrios", perfil: "Ingeniero de sistemas. Programación y datos." },
  { iniciales: "VH", nombre: "Valeria De la Hoz", perfil: "Especialista en IA aplicada a negocios." },
  { iniciales: "AP", nombre: "Andrés Pacheco", perfil: "Ingeniero electrónico. Electrónica y robótica." },
  { iniciales: "LM", nombre: "Laura Mendoza", perfil: "Tecnóloga en sistemas y redes. Hardware e IoT." },
];

export const HISTORIA = [
  "Talento Caribe nació en 2026 en Barranquilla, de la mano de José Rodríguez, estudiante de Análisis y Desarrollo de Software. Mientras avanzaba en su formación, José notó algo que se repetía a su alrededor: en la región sobran talento y curiosidad por la tecnología, pero muchos jóvenes no encuentran un lugar donde aprender gratis, en español y con ejemplos cercanos a su realidad. Los cursos suelen costar dinero, estar en otro idioma o quedar lejos de casa.",
  "Con esa observación como punto de partida, José se propuso crear ese lugar. Diseñó desde cero una ruta de cursos de software y hardware pensada para principiantes, construyó la plataforma web que la sostiene y conformó un pequeño equipo de mentores dispuestos a acompañar a los estudiantes.",
  "Hoy Talento Caribe es una iniciativa joven, en etapa de lanzamiento, y no pretende ser grande de entrada. Su plan es empezar con grupos reducidos en Barranquilla, aprender de la primera cohorte piloto, ajustar los cursos con lo que esa experiencia enseñe y crecer paso a paso hacia otras ciudades del Caribe y de Latinoamérica gracias al formato virtual. De ahí su lema: porque el talento no tiene fronteras, la oportunidad de desarrollarlo tampoco debería tenerlas.",
];
export const PILARES = [
  { titulo: "Misión", texto: "Formar a jóvenes del Caribe y de Latinoamérica en habilidades de software y hardware mediante cursos gratuitos, prácticos y acompañados por mentores, para que puedan estudiar, emprender o conseguir empleo en tecnología." },
  { titulo: "Visión", texto: "Ser, en 2030, la comunidad de referencia en formación tecnológica juvenil del Caribe y de Latinoamérica: un lugar donde los jóvenes descubran su vocación, desarrollen sus habilidades y encuentren oportunidades reales sin tener que irse de su tierra ni pagar por aprender." },
  { titulo: "Valores", texto: "Acceso para todos, aprender haciendo, comunidad e identidad caribeña." },
];

/* {edad} se reemplaza por la edad mínima más común del catálogo */
export const PREGUNTAS = [
  { pregunta: "¿De verdad es gratis?", respuesta: "Sí. Los cursos y el certificado no tienen costo: no cobramos matrícula ni mensualidades." },
  { pregunta: "¿Necesito saber programar?", respuesta: "No. Los cursos de nivel básico empiezan desde cero. Si nunca has programado, te sugerimos Lógica de programación o HTML y CSS." },
  { pregunta: "¿Qué edad debo tener?", respuesta: "La mayoría de cursos reciben estudiantes desde los {n} años; la edad exacta aparece en la ficha de cada curso. Si eres menor de edad, en la inscripción te pedimos los datos de tu acudiente.", conEdad: true },
  { pregunta: "¿Las clases son presenciales o virtuales?", respuesta: "Depende del curso. Cada uno indica su modalidad (presencial, virtual o híbrida) y su jornada: mañana, tarde, noche o sábados." },
  { pregunta: "¿Cuánto tiempo le tengo que dedicar?", respuesta: "Un curso dura 16 semanas, con una clase de 90 minutos por semana. Además, conviene reservar un rato para terminar las entregas de cada módulo." },
  { pregunta: "¿Qué recibo al terminar?", respuesta: "Un proyecto propio que puedes mostrar, tu certificado y la recomendación del siguiente curso de la ruta." },
];
