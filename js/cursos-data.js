/* Catálogo inicial del frontend. El backend podrá reemplazar estos datos al conectarse.
   Módulos, temas, actividad y evidencia de cada módulo: "Talento Caribe — Plan de cursos y clases desarrolladas".
   Cada curso: 8 módulos de 2 semanas (16 semanas). "guia" guarda lo que el plan repite en todos los módulos del curso
   (modalidad, nota de seguridad, reto aplicado y preguntas de revisión entre pares); TCSesiones arma con eso la guía de clase. */
window.TALENTO_CARIBE_CURSOS = [
  {
    id: 1,
    titulo: "Lógica de programación",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Lanzamiento",
    instructor: "Daniel Barrios",
    descripcion: "Es el curso de entrada para quien nunca ha escrito una línea de código. Aprende a descomponer problemas en pasos, escribir algoritmos en pseudocódigo y representarlos con diagramas de flujo. Practicarás con situaciones cotidianas y con variables, operadores, condicionales, ciclos, arreglos y funciones sencillas usando PSeInt.",
    objetivo: "Analizar un problema sencillo y escribir una solución lógica paso a paso.",
    proyecto: "Juego de adivinar el número y calculadora de descuentos",
    temario: [
      "Pensar en pasos: Problema, entradas, proceso, resultados y secuencias",
      "Pseudocódigo: Convenciones, asignación y trazado manual de algoritmos",
      "Diagramas de flujo: Símbolos, decisiones, conectores y correspondencia con pseudocódigo",
      "Variables y operadores: Tipos de datos, asignación, operaciones aritméticas, relacionales y lógicas",
      "Decisiones: Condicionales simples, dobles, anidados y condiciones compuestas",
      "Ciclos: Mientras, Para, Repetir; contadores, acumuladores y condición de salida",
      "Arreglos y funciones: Arreglos unidimensionales, recorridos, funciones, parámetros y retorno",
      "Reto integrador: Descomposición, estructuras, pruebas y documentación inicial"
    ],
    modulos: [
      {"titulo": "Pensar en pasos", "temas": ["Problema", "Entradas", "Proceso", "Resultados", "Secuencias"], "temasTexto": "Problema, entradas, proceso, resultados y secuencias", "actividades": ["Analizar una rutina cotidiana y convertirla en instrucciones precisas; revisar ambigüedades en una sesión en línea."], "evidencia": "Algoritmo en lenguaje natural y ficha de entradas/proceso/salidas."},
      {"titulo": "Pseudocódigo", "temas": ["Convenciones", "Asignación", "Trazado manual de algoritmos"], "temasTexto": "Convenciones, asignación y trazado manual de algoritmos", "actividades": ["Resolver retos cortos en PSeInt y comparar soluciones en parejas virtuales."], "evidencia": "Archivo PSeInt con tres algoritmos y trazas comentadas."},
      {"titulo": "Diagramas de flujo", "temas": ["Símbolos", "Decisiones", "Conectores", "Correspondencia con pseudocódigo"], "temasTexto": "Símbolos, decisiones, conectores y correspondencia con pseudocódigo", "actividades": ["Diseñar el flujo de un proceso de inscripción y recorrer distintos casos en un tablero colaborativo."], "evidencia": "Diagrama legible con rutas alternativas y casos de prueba."},
      {"titulo": "Variables y operadores", "temas": ["Tipos de datos", "Asignación", "Operaciones aritméticas", "Relacionales", "Lógicas"], "temasTexto": "Tipos de datos, asignación, operaciones aritméticas, relacionales y lógicas", "actividades": ["Construir una calculadora de costos sencilla y validar resultados con diferentes valores."], "evidencia": "Programa probado y tabla de pruebas."},
      {"titulo": "Decisiones", "temas": ["Condicionales simples", "Dobles", "Anidados", "Condiciones compuestas"], "temasTexto": "Condicionales simples, dobles, anidados y condiciones compuestas", "actividades": ["Programar un clasificador de situaciones cotidianas y probar casos límite."], "evidencia": "Solución con decisiones y matriz de entradas y resultados."},
      {"titulo": "Ciclos", "temas": ["Mientras", "Para", "Repetir; contadores", "Acumuladores", "Condición de salida"], "temasTexto": "Mientras, Para, Repetir; contadores, acumuladores y condición de salida", "actividades": ["Crear un menú interactivo o simulador de ahorro; depurar un ciclo que no termina."], "evidencia": "Programa iterativo con explicación y pruebas."},
      {"titulo": "Arreglos y funciones", "temas": ["Arreglos unidimensionales", "Recorridos", "Funciones", "Parámetros", "Retorno"], "temasTexto": "Arreglos unidimensionales, recorridos, funciones, parámetros y retorno", "actividades": ["Procesar una lista de datos con funciones para resumir y buscar elementos."], "evidencia": "Programa modular con arreglos, funciones y resultados verificados."},
      {"titulo": "Reto integrador", "temas": ["Descomposición", "Estructuras", "Pruebas", "Documentación inicial"], "temasTexto": "Descomposición, estructuras, pruebas y documentación inicial", "actividades": ["Resolver un problema elegido, recibir revisión entre pares y mejorar la solución."], "evidencia": "Proyecto PSeInt, diagrama, casos de prueba y reflexión."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Agregue un caso límite o una entrada inválida; ajuste la solución y muestre una prueba que compruebe el nuevo comportamiento.", "preguntas": ["¿Qué cambia si modificas un dato o una condición?", "¿Qué caso todavía no probaste?", "¿Cómo sabes que el resultado es correcto?"]}
  },
  {
    id: 2,
    titulo: "Python desde cero",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Lanzamiento",
    instructor: "Daniel Barrios",
    descripcion: "Aprende Python con práctica en cada sesión: instala el entorno, escribe tu primer programa y avanza por variables, condicionales, ciclos, listas, diccionarios, funciones y módulos. También aprenderás a leer y guardar archivos y a manejar errores, con ejercicios semanales de dificultad gradual.",
    objetivo: "Escribir programas que lean datos, tomen decisiones, repitan tareas y guarden información.",
    proyecto: "Gestor de inventario por consola para una tienda pequeña que guarda los datos en un archivo",
    temario: [
      "Entorno y primer programa: Instalación, ejecución, print, comentarios y sintaxis básica",
      "Variables y datos: Números, cadenas, booleanos, conversiones, entradas y salidas",
      "Condiciones: if, elif, else, comparaciones, lógica y validación",
      "Ciclos: for, while, range, contadores, acumuladores y control de repetición",
      "Listas y diccionarios: Colecciones, índices, recorridos, agregar, actualizar y consultar",
      "Funciones y módulos: Definición, parámetros, retorno, alcance básico e importación",
      "Archivos y errores: Lectura y escritura, with, excepciones, try/except y mensajes útiles",
      "Proyecto integrador: Planificación, estructuras, modularidad, persistencia, pruebas y presentación"
    ],
    modulos: [
      {"titulo": "Entorno y primer programa", "temas": ["Instalación", "Ejecución", "Print", "Comentarios", "Sintaxis básica"], "temasTexto": "Instalación, ejecución, print, comentarios y sintaxis básica", "actividades": ["Seguir una guía virtual para ejecutar el primer script y personalizar su salida."], "evidencia": "Script inicial y registro breve de instalación."},
      {"titulo": "Variables y datos", "temas": ["Números", "Cadenas", "Booleanos", "Conversiones", "Entradas", "Salidas"], "temasTexto": "Números, cadenas, booleanos, conversiones, entradas y salidas", "actividades": ["Crear un perfil interactivo o calculadora sencilla con datos ingresados por la persona."], "evidencia": "Programa con entradas y pruebas de distintos valores."},
      {"titulo": "Condiciones", "temas": ["If", "Elif", "Else", "Comparaciones", "Lógica", "Validación"], "temasTexto": "if, elif, else, comparaciones, lógica y validación", "actividades": ["Resolver un caso de clasificación y revisar el comportamiento en valores límite."], "evidencia": "Script condicional y tabla de casos probados."},
      {"titulo": "Ciclos", "temas": ["For", "While", "Range", "Contadores", "Acumuladores", "Control de repetición"], "temasTexto": "for, while, range, contadores, acumuladores y control de repetición", "actividades": ["Desarrollar un juego de adivinanza o resumen de registros con intentos controlados."], "evidencia": "Programa con ciclo e instrucciones de uso."},
      {"titulo": "Listas y diccionarios", "temas": ["Colecciones", "Índices", "Recorridos", "Agregar", "Actualizar", "Consultar"], "temasTexto": "Colecciones, índices, recorridos, agregar, actualizar y consultar", "actividades": ["Organizar un pequeño inventario o agenda en memoria y responder consultas."], "evidencia": "Programa que administra una colección y muestra resultados esperados."},
      {"titulo": "Funciones y módulos", "temas": ["Definición", "Parámetros", "Retorno", "Alcance básico e importación"], "temasTexto": "Definición, parámetros, retorno, alcance básico e importación", "actividades": ["Reorganizar un programa en funciones reutilizables y probar distintas entradas."], "evidencia": "Código modular con funciones descritas y pruebas."},
      {"titulo": "Archivos y errores", "temas": ["Lectura", "Escritura", "With", "Excepciones", "Try/except", "Mensajes útiles"], "temasTexto": "Lectura y escritura, with, excepciones, try/except y mensajes útiles", "actividades": ["Guardar y recuperar registros; provocar errores controlados y manejarlos."], "evidencia": "Programa con persistencia y manejo de entradas inválidas."},
      {"titulo": "Proyecto integrador", "temas": ["Planificación", "Estructuras", "Modularidad", "Persistencia", "Pruebas", "Presentación"], "temasTexto": "Planificación, estructuras, modularidad, persistencia, pruebas y presentación", "actividades": ["Construir una aplicación de consola pequeña y presentarla en una muestra virtual."], "evidencia": "Proyecto ejecutable, instrucciones y datos de ejemplo."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Agregue un caso límite o una entrada inválida; ajuste la solución y muestre una prueba que compruebe el nuevo comportamiento.", "preguntas": ["¿Qué cambia si modificas un dato o una condición?", "¿Qué caso todavía no probaste?", "¿Cómo sabes que el resultado es correcto?"]}
  },
  {
    id: 3,
    titulo: "HTML y CSS: tu primera página web",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Lanzamiento",
    instructor: "Camila Ospino",
    descripcion: "Aprende los cimientos de toda página web: estructura contenido con HTML y dale estilo con CSS. Practica con textos, enlaces, imágenes, formularios, colores y tipografías; después organiza páginas con Flexbox y CSS Grid y haz que se adapten a celular y computador.",
    objetivo: "Construir y publicar una página web responsive, clara y atractiva.",
    proyecto: "Página responsive de un emprendimiento real o inventado, publicada con GitHub Pages",
    temario: [
      "Estructura de una página: Navegador, archivos HTML y CSS, estructura y etiquetas semánticas",
      "Contenido y navegación: Títulos, párrafos, listas, enlaces, rutas, imágenes y texto alternativo",
      "Primeros estilos: Reglas CSS, selectores, cascada, colores, tipografía, bordes y unidades",
      "Modelo de caja: Margen, relleno, borde, ancho, clases y jerarquía visual",
      "Formularios: Etiquetas, campos, tipos de entrada, botones y accesibilidad básica",
      "Flexbox: Ejes, alineación, distribución, flex-wrap y navegación adaptable",
      "CSS Grid y responsividad: Cuadrículas, columnas, áreas, media queries y puntos de quiebre",
      "Sitio integrador: Consistencia visual, accesibilidad básica, validación y revisión final"
    ],
    modulos: [
      {"titulo": "Estructura de una página", "temas": ["Navegador", "Archivos HTML", "CSS", "Estructura", "Etiquetas semánticas"], "temasTexto": "Navegador, archivos HTML y CSS, estructura y etiquetas semánticas", "actividades": ["Crear el esqueleto de una página personal y recorrer su estructura en revisión virtual."], "evidencia": "HTML con encabezado, secciones y pie de página."},
      {"titulo": "Contenido y navegación", "temas": ["Títulos", "Párrafos", "Listas", "Enlaces", "Rutas", "Imágenes", "Texto alternativo"], "temasTexto": "Títulos, párrafos, listas, enlaces, rutas, imágenes y texto alternativo", "actividades": ["Armar una página informativa sobre un tema local con enlaces funcionales."], "evidencia": "Página informativa con navegación y textos alternativos."},
      {"titulo": "Primeros estilos", "temas": ["Reglas CSS", "Selectores", "Cascada", "Colores", "Tipografía", "Bordes", "Unidades"], "temasTexto": "Reglas CSS, selectores, cascada, colores, tipografía, bordes y unidades", "actividades": ["Aplicar una guía visual y comparar los cambios mediante capturas."], "evidencia": "Hoja CSS organizada y página con identidad visual coherente."},
      {"titulo": "Modelo de caja", "temas": ["Margen", "Relleno", "Borde", "Ancho", "Clases", "Jerarquía visual"], "temasTexto": "Margen, relleno, borde, ancho, clases y jerarquía visual", "actividades": ["Diseñar tarjetas y un bloque destacado con espaciado consistente."], "evidencia": "Componentes reutilizables y breve explicación de clases."},
      {"titulo": "Formularios", "temas": ["Etiquetas", "Campos", "Tipos de entrada", "Botones", "Accesibilidad básica"], "temasTexto": "Etiquetas, campos, tipos de entrada, botones y accesibilidad básica", "actividades": ["Construir un formulario de contacto y revisarlo con teclado entre pares."], "evidencia": "Formulario etiquetado y navegable con lista de revisión."},
      {"titulo": "Flexbox", "temas": ["Ejes", "Alineación", "Distribución", "Flex-wrap", "Navegación adaptable"], "temasTexto": "Ejes, alineación, distribución, flex-wrap y navegación adaptable", "actividades": ["Convertir cabecera y tarjetas a Flexbox y revisar en varios tamaños."], "evidencia": "Diseño flexible con capturas de escritorio y móvil."},
      {"titulo": "CSS Grid y responsividad", "temas": ["Cuadrículas", "Columnas", "Áreas", "Media queries", "Puntos de quiebre"], "temasTexto": "Cuadrículas, columnas, áreas, media queries y puntos de quiebre", "actividades": ["Maquetar varias secciones con Grid y adaptar la composición a celular."], "evidencia": "Página responsive revisada en dos anchos."},
      {"titulo": "Sitio integrador", "temas": ["Consistencia visual", "Accesibilidad básica", "Validación", "Revisión final"], "temasTexto": "Consistencia visual, accesibilidad básica, validación y revisión final", "actividades": ["Completar un sitio pequeño, revisar enlaces y presentarlo en línea."], "evidencia": "Sitio de varias secciones, archivos ordenados y lista de revisión."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Agregue una sección o interacción pequeña y compruebe que la página siga siendo legible y navegable en pantalla angosta.", "preguntas": ["¿Qué ve o recibe la persona usuaria?", "¿Qué pasa si cambia la entrada o falla la conexión?", "¿Cómo lo comprobarías?"]}
  },
  {
    id: 4,
    titulo: "JavaScript para principiantes",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Híbrido",
    fase: "Próximamente",
    instructor: "Camila Ospino",
    descripcion: "Haz que las páginas cobren vida con botones que responden, formularios que validan y contenido que cambia según la persona usuaria. El curso combina sesiones virtuales con una práctica presencial guiada cada dos semanas; aprenderás las bases del lenguaje y las aplicarás al DOM y a los eventos.",
    objetivo: "Programar interacciones en una página web usando JavaScript y el DOM.",
    proyecto: "Lista de tareas interactiva que guarda datos en el navegador",
    temario: [
      "Entorno y ejecución: Relación HTML/CSS/JavaScript, consola, script y comentarios",
      "Datos y operadores: let, const, números, cadenas, booleanos, operadores y conversiones",
      "Condiciones: if/else, comparaciones, operadores lógicos y reglas de interfaz",
      "Funciones y repetición: Funciones, parámetros, retorno, for, while y descomposición",
      "DOM: Selección de elementos, texto, atributos, clases y estructura del documento",
      "Eventos y formularios: click, input, submit, escucha de eventos y validación",
      "Listas dinámicas: Arreglos de objetos sencillos, creación de nodos, renderizado y actualización",
      "Proyecto interactivo: Integración de eventos, funciones, DOM, validación y pruebas manuales"
    ],
    modulos: [
      {"titulo": "Entorno y ejecución", "temas": ["Relación HTML/CSS/JavaScript", "Consola", "Script", "Comentarios"], "temasTexto": "Relación HTML/CSS/JavaScript, consola, script y comentarios", "actividades": ["Preparación virtual con guía; práctica presencial para ejecutar y modificar scripts en el navegador."], "evidencia": "Página con script vinculado y registro de consola."},
      {"titulo": "Datos y operadores", "temas": ["Let", "Const", "Números", "Cadenas", "Booleanos", "Operadores", "Conversiones"], "temasTexto": "let, const, números, cadenas, booleanos, operadores y conversiones", "actividades": ["Ejercicios virtuales breves; en taller, construir una calculadora de una operación y probar entradas."], "evidencia": "Calculadora simple y hoja de pruebas."},
      {"titulo": "Condiciones", "temas": ["If/else", "Comparaciones", "Operadores lógicos", "Reglas de interfaz"], "temasTexto": "if/else, comparaciones, operadores lógicos y reglas de interfaz", "actividades": ["Diseñar reglas en línea; en práctica guiada, programar un clasificador y casos límite."], "evidencia": "Página que responde a entradas mediante decisiones."},
      {"titulo": "Funciones y repetición", "temas": ["Funciones", "Parámetros", "Retorno", "For", "While", "Descomposición"], "temasTexto": "Funciones, parámetros, retorno, for, while y descomposición", "actividades": ["Resolver retos de preparación y luego crear presencialmente un generador o secuencia."], "evidencia": "Script con funciones reutilizables y pruebas."},
      {"titulo": "DOM", "temas": ["Selección de elementos", "Texto", "Atributos", "Clases", "Estructura del documento"], "temasTexto": "Selección de elementos, texto, atributos, clases y estructura del documento", "actividades": ["Explorar selectores en línea; práctica presencial para cambiar contenido desde botones."], "evidencia": "Página con controles que actualizan elementos visibles."},
      {"titulo": "Eventos y formularios", "temas": ["Click", "Input", "Submit", "Escucha de eventos", "Validación"], "temasTexto": "click, input, submit, escucha de eventos y validación", "actividades": ["Planear interacción en línea; implementar presencialmente un formulario con mensajes."], "evidencia": "Formulario interactivo con casos probados."},
      {"titulo": "Listas dinámicas", "temas": ["Arreglos de objetos sencillos", "Creación de nodos", "Renderizado", "Actualización"], "temasTexto": "Arreglos de objetos sencillos, creación de nodos, renderizado y actualización", "actividades": ["Modelar los datos virtualmente; en taller, construir una lista para agregar y quitar elementos."], "evidencia": "Interfaz que administra una colección en memoria."},
      {"titulo": "Proyecto interactivo", "temas": ["Integración de eventos", "Funciones", "DOM", "Validación", "Pruebas manuales"], "temasTexto": "Integración de eventos, funciones, DOM, validación y pruebas manuales", "actividades": ["Avance virtual; práctica presencial para integrar, probar entre pares y presentar."], "evidencia": "Mini aplicación funcional, archivos fuente y lista de pruebas."}
    ],
    guia: {"modalidad": "Facilitación híbrida: antes del encuentro, publica una preparación virtual breve; realiza una práctica presencial guiada en este módulo (cada dos semanas) y cierra en línea con la evidencia y reflexión.", "nota": "", "reto": "Agregue un caso límite o una entrada inválida; ajuste la solución y muestre una prueba que compruebe el nuevo comportamiento.", "preguntas": ["¿Qué ve o recibe la persona usuaria?", "¿Qué pasa si cambia la entrada o falla la conexión?", "¿Cómo lo comprobarías?"]}
  },
  {
    id: 5,
    titulo: "Git y GitHub",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Próximamente",
    instructor: "Camila Ospino",
    descripcion: "Aprende una habilidad clave para colaborar en desarrollo: guardar el historial de un proyecto sin perder trabajo. Practica comandos esenciales, el archivo .gitignore, mensajes de commit, ramas, fusiones y repositorios remotos con push y pull.",
    objetivo: "Usar Git para versionar proyectos y publicarlos en GitHub.",
    proyecto: "Subir a GitHub un proyecto propio con al menos diez commits claros",
    temario: [
      "Versiones y repositorios: Control de versiones, repositorio, flujo de trabajo y configuración inicial",
      "Cambios y commits: Estado, área de preparación, commit, historial y mensajes claros",
      ".gitignore y orden: Archivos rastreados y locales, patrones de exclusión y estructura",
      "Ramas: Rama principal, creación y cambio de ramas y commits independientes",
      "Fusiones y conflictos: Merge, conflictos frecuentes, resolución y verificación",
      "Repositorios remotos: GitHub, clonar, conectar remoto, push y pull",
      "Colaboración y revisión: Issues, pull requests, revisión de cambios y acuerdos de equipo",
      "Flujo integrador: Ramas, sincronización, mensajes, revisión, conflictos e historial"
    ],
    modulos: [
      {"titulo": "Versiones y repositorios", "temas": ["Control de versiones", "Repositorio", "Flujo de trabajo", "Configuración inicial"], "temasTexto": "Control de versiones, repositorio, flujo de trabajo y configuración inicial", "actividades": ["Crear un repositorio de práctica y registrar una primera versión con guía virtual."], "evidencia": "Repositorio inicial y nota sobre su propósito."},
      {"titulo": "Cambios y commits", "temas": ["Estado", "Área de preparación", "Commit", "Historial", "Mensajes claros"], "temasTexto": "Estado, área de preparación, commit, historial y mensajes claros", "actividades": ["Editar un proyecto pequeño y guardar cambios en etapas con mensajes descriptivos."], "evidencia": "Historial con commits pequeños y explicados."},
      {"titulo": ".gitignore y orden", "temas": ["Archivos rastreados", "Locales", "Patrones de exclusión", "Estructura"], "temasTexto": "Archivos rastreados y locales, patrones de exclusión y estructura", "actividades": ["Preparar un repositorio limpio y comprobar qué archivos quedan excluidos."], "evidencia": "Repositorio con .gitignore pertinente."},
      {"titulo": "Ramas", "temas": ["Rama principal", "Creación", "Cambio de ramas", "Commits independientes"], "temasTexto": "Rama principal, creación y cambio de ramas y commits independientes", "actividades": ["Abrir una rama para una mejora y comparar el historial con la rama principal."], "evidencia": "Rama de funcionalidad con evidencia de trabajo aislado."},
      {"titulo": "Fusiones y conflictos", "temas": ["Merge", "Conflictos frecuentes", "Resolución", "Verificación"], "temasTexto": "Merge, conflictos frecuentes, resolución y verificación", "actividades": ["Provocar un conflicto sencillo en ejercicio guiado, resolverlo y explicar la decisión."], "evidencia": "Fusión completada y registro de resolución."},
      {"titulo": "Repositorios remotos", "temas": ["GitHub", "Clonar", "Conectar remoto", "Push", "Pull"], "temasTexto": "GitHub, clonar, conectar remoto, push y pull", "actividades": ["Subir el proyecto, clonar una copia de práctica y sincronizar cambios."], "evidencia": "Repositorio remoto actualizado e instrucciones para clonarlo."},
      {"titulo": "Colaboración y revisión", "temas": ["Issues", "Pull requests", "Revisión de cambios", "Acuerdos de equipo"], "temasTexto": "Issues, pull requests, revisión de cambios y acuerdos de equipo", "actividades": ["Simular una mejora colaborativa: proponer, revisar y responder comentarios."], "evidencia": "Pull request de práctica con descripción y revisión."},
      {"titulo": "Flujo integrador", "temas": ["Ramas", "Sincronización", "Mensajes", "Revisión", "Conflictos e historial"], "temasTexto": "Ramas, sincronización, mensajes, revisión, conflictos e historial", "actividades": ["Completar en equipo un cambio desde una tarea hasta la integración remota."], "evidencia": "Repositorio con historial claro y guía breve de flujo."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Realice una segunda mejora desde una rama independiente, guárdela con un commit claro y sincronícela sin perder el historial.", "preguntas": ["¿Qué cambia si modificas un dato o una condición?", "¿Qué caso todavía no probaste?", "¿Cómo sabes que el resultado es correcto?"]}
  },
  {
    id: 6,
    titulo: "Bases de datos con SQL",
    area: "Software",
    nivel: "Intermedio",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Próximamente",
    instructor: "Daniel Barrios",
    descripcion: "Entiende cómo las aplicaciones guardan y consultan información. Diseña una base de datos relacional, crea tablas y aprende a insertar, consultar, actualizar y borrar datos; luego filtra, resume y relaciona información con GROUP BY y JOIN.",
    objetivo: "Diseñar una base de datos relacional básica y consultarla con SQL.",
    proyecto: "Base de datos de una biblioteca o tienda con tres tablas relacionadas y un conjunto de consultas",
    temario: [
      "Modelo relacional: Tabla, fila, columna, tipos de datos, entidades y relaciones",
      "Tablas y claves: CREATE TABLE, claves primarias/foráneas y restricciones básicas",
      "Agregar y consultar: INSERT, SELECT, columnas y ORDER BY",
      "Filtros y cambios: WHERE, operadores, NULL, UPDATE y DELETE con condiciones",
      "Resúmenes: COUNT, SUM, AVG, MIN, MAX, GROUP BY y HAVING",
      "Relaciones y JOIN: Relaciones uno a muchos, INNER JOIN, LEFT JOIN y alias",
      "Calidad y combinación: Integridad, faltantes, filtros, agrupaciones y joins combinados",
      "Proyecto de base de datos: Diseño, creación, carga, consulta y documentación"
    ],
    modulos: [
      {"titulo": "Modelo relacional", "temas": ["Tabla", "Fila", "Columna", "Tipos de datos", "Entidades", "Relaciones"], "temasTexto": "Tabla, fila, columna, tipos de datos, entidades y relaciones", "actividades": ["Analizar un caso cotidiano y proponer entidades y atributos en tablero virtual."], "evidencia": "Modelo con entidades, atributos y reglas."},
      {"titulo": "Tablas y claves", "temas": ["CREATE TABLE", "Claves primarias/foráneas", "Restricciones básicas"], "temasTexto": "CREATE TABLE, claves primarias/foráneas y restricciones básicas", "actividades": ["Convertir el modelo en tablas y revisar las relaciones antes de crear la base."], "evidencia": "Esquema SQL y diccionario de datos breve."},
      {"titulo": "Agregar y consultar", "temas": ["INSERT", "SELECT", "Columnas", "ORDER BY"], "temasTexto": "INSERT, SELECT, columnas y ORDER BY", "actividades": ["Cargar datos de ejemplo y redactar consultas para responder preguntas sencillas."], "evidencia": "Script de carga y consultas con resultados esperados."},
      {"titulo": "Filtros y cambios", "temas": ["WHERE", "Operadores", "NULL", "UPDATE", "DELETE con condiciones"], "temasTexto": "WHERE, operadores, NULL, UPDATE y DELETE con condiciones", "actividades": ["Buscar y modificar datos en copia controlada con revisión de cada consulta."], "evidencia": "Consultas filtradas y script de cambios verificado."},
      {"titulo": "Resúmenes", "temas": ["COUNT", "SUM", "AVG", "MIN", "MAX", "GROUP BY", "HAVING"], "temasTexto": "COUNT, SUM, AVG, MIN, MAX, GROUP BY y HAVING", "actividades": ["Calcular indicadores por categoría y explicar qué pregunta responde cada consulta."], "evidencia": "Consultas agregadas e interpretación de resultados."},
      {"titulo": "Relaciones y JOIN", "temas": ["Relaciones uno a muchos", "INNER JOIN", "LEFT JOIN", "Alias"], "temasTexto": "Relaciones uno a muchos, INNER JOIN, LEFT JOIN y alias", "actividades": ["Unir tablas para responder preguntas que involucran varias entidades."], "evidencia": "Consultas JOIN probadas y diagrama actualizado."},
      {"titulo": "Calidad y combinación", "temas": ["Integridad", "Faltantes", "Filtros", "Agrupaciones", "Joins combinados"], "temasTexto": "Integridad, faltantes, filtros, agrupaciones y joins combinados", "actividades": ["Detectar inconsistencias del conjunto de datos y depurar consultas progresivamente."], "evidencia": "Hallazgos y conjunto de consultas depuradas."},
      {"titulo": "Proyecto de base de datos", "temas": ["Diseño", "Creación", "Carga", "Consulta", "Documentación"], "temasTexto": "Diseño, creación, carga, consulta y documentación", "actividades": ["Construir una base pequeña para una necesidad realista y responder preguntas acordadas."], "evidencia": "Archivo SQL, esquema, datos de prueba y catálogo de consultas."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Responda una nueva pregunta del caso combinando la consulta del módulo con un filtro o relación adicional; compruebe el resultado.", "preguntas": ["¿Qué cambia si modificas un dato o una condición?", "¿Qué caso todavía no probaste?", "¿Cómo sabes que el resultado es correcto?"]}
  },
  {
    id: 7,
    titulo: "Introducción a la IA",
    area: "Software",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Virtual",
    fase: "Lanzamiento",
    instructor: "Valeria De la Hoz",
    descripcion: "Explora la inteligencia artificial, el aprendizaje automático y la IA generativa con ejemplos cotidianos y una mirada honesta a sus límites y sesgos. Aprende a escribir buenos prompts, usar herramientas para estudiar y crear, y verificar sus respuestas con criterio ético. Sin matemáticas avanzadas.",
    objetivo: "Entender las capacidades y límites de la IA y usarla responsablemente.",
    proyecto: "Guía de prompts y asistente personalizado para un emprendimiento o una tarea real",
    temario: [
      "IA cotidiana: Conceptos iniciales, sistemas basados en reglas y ejemplos cercanos",
      "Aprendizaje automático: Datos, patrones, entrenamiento, predicción y diferencia con automatización",
      "IA generativa y límites: Generación de texto e imágenes, probabilidades, errores y alucinaciones",
      "Prompts claros: Contexto, objetivo, formato, restricciones y refinamiento iterativo",
      "Estudiar y crear con IA: Apoyo, ideación, síntesis, autoría y transparencia",
      "Verificación crítica: Contraste con fuentes confiables, actualidad, trazabilidad y errores",
      "Sesgos y ética: Sesgos, privacidad, consentimiento, equidad y límites de uso",
      "Proyecto responsable: Selección del problema, herramienta, verificación y comunicación transparente"
    ],
    modulos: [
      {"titulo": "IA cotidiana", "temas": ["Conceptos iniciales", "Sistemas basados en reglas", "Ejemplos cercanos"], "temasTexto": "Conceptos iniciales, sistemas basados en reglas y ejemplos cercanos", "actividades": ["Mapear herramientas cotidianas y debatir qué hacen y qué datos podrían utilizar."], "evidencia": "Mapa de ejemplos con preguntas de uso responsable."},
      {"titulo": "Aprendizaje automático", "temas": ["Datos", "Patrones", "Entrenamiento", "Predicción", "Diferencia con automatización"], "temasTexto": "Datos, patrones, entrenamiento, predicción y diferencia con automatización", "actividades": ["Clasificar ejemplos y describir qué datos necesitaría un sistema para aprender."], "evidencia": "Ficha de caso con datos, patrón y posible error."},
      {"titulo": "IA generativa y límites", "temas": ["Generación de texto e imágenes", "Probabilidades", "Errores", "Alucinaciones"], "temasTexto": "Generación de texto e imágenes, probabilidades, errores y alucinaciones", "actividades": ["Comparar respuestas a una consigna y marcar afirmaciones por verificar."], "evidencia": "Comparación anotada y lista de afirmaciones a comprobar."},
      {"titulo": "Prompts claros", "temas": ["Contexto", "Objetivo", "Formato", "Restricciones", "Refinamiento iterativo"], "temasTexto": "Contexto, objetivo, formato, restricciones y refinamiento iterativo", "actividades": ["Resolver una tarea de estudio con varias iteraciones y evaluar claridad y precisión."], "evidencia": "Secuencia de prompts y rúbrica de calidad."},
      {"titulo": "Estudiar y crear con IA", "temas": ["Apoyo", "Ideación", "Síntesis", "Autoría", "Transparencia"], "temasTexto": "Apoyo, ideación, síntesis, autoría y transparencia", "actividades": ["Diseñar un recurso educativo con asistencia de IA y documentar decisiones humanas."], "evidencia": "Recurso y declaración de uso revisada."},
      {"titulo": "Verificación crítica", "temas": ["Contraste con fuentes confiables", "Actualidad", "Trazabilidad", "Errores"], "temasTexto": "Contraste con fuentes confiables, actualidad, trazabilidad y errores", "actividades": ["Auditar una respuesta y contrastar afirmaciones con fuentes indicadas en el curso."], "evidencia": "Matriz de afirmaciones, evidencia y correcciones."},
      {"titulo": "Sesgos y ética", "temas": ["Sesgos", "Privacidad", "Consentimiento", "Equidad", "Límites de uso"], "temasTexto": "Sesgos, privacidad, consentimiento, equidad y límites de uso", "actividades": ["Analizar un escenario e identificar personas afectadas y salvaguardas."], "evidencia": "Análisis de caso con riesgos y recomendaciones."},
      {"titulo": "Proyecto responsable", "temas": ["Selección del problema", "Herramienta", "Verificación", "Comunicación transparente"], "temasTexto": "Selección del problema, herramienta, verificación y comunicación transparente", "actividades": ["Crear una demostración sencilla de apoyo con IA y presentarla virtualmente."], "evidencia": "Prototipo o guía, registro de verificación y reflexión."}
    ],
    guia: {"modalidad": "Facilitación virtual: comparte pantalla para la demostración, usa pizarra o sala de trabajo en parejas y recoge el archivo o registro en la plataforma.", "nota": "", "reto": "Repita la tarea con una consigna refinada, contraste una afirmación con evidencia y anote un límite o riesgo del resultado.", "preguntas": ["¿Qué afirmación se debe verificar?", "¿Qué sesgo o límite podría influir?", "¿Cómo explicarías el uso de la herramienta?"]}
  },
  {
    id: 8,
    titulo: "Electrónica básica",
    area: "Hardware",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Presencial",
    fase: "Lanzamiento",
    instructor: "Andrés Pacheco",
    descripcion: "Ten tu primer contacto práctico y seguro con la electrónica. Aprende corriente, voltaje, resistencia y ley de Ohm; conoce normas de seguridad y arma circuitos en protoboard con resistencias, LEDs y pulsadores mientras mides con multímetro.",
    objetivo: "Entender electricidad y armar, medir y depurar circuitos sencillos.",
    proyecto: "Luz nocturna que se enciende sola cuando hay poca luz gracias a un sensor LDR",
    temario: [
      "Seguridad y componentes: Normas del taller, polaridad, protoboard, resistencias, LED, pulsadores y baja tensión",
      "Magnitudes eléctricas: Voltaje, corriente, resistencia, unidades y circuito cerrado",
      "Ley de Ohm: Relación V-I-R, cálculo simple y selección de resistencia",
      "LED y serie: Polaridad, resistencias en serie, continuidad y esquemas",
      "Pulsadores: Contactos abiertos/cerrados, entradas manuales y conexiones limpias",
      "Circuitos en paralelo: Ramas paralelas, distribución de corriente y comparación con serie",
      "Medición y diagnóstico: Multímetro, voltaje, resistencia, continuidad y errores comunes",
      "Reto de circuitos: Diseño, cálculo, montaje, medición, seguridad y comunicación técnica"
    ],
    modulos: [
      {"titulo": "Seguridad y componentes", "temas": ["Normas del taller", "Polaridad", "Protoboard", "Resistencias", "LED", "Pulsadores", "Baja tensión"], "temasTexto": "Normas del taller, polaridad, protoboard, resistencias, LED, pulsadores y baja tensión", "actividades": ["Reconocer componentes y montar un circuito sin energizar hasta validar conexiones con instructor."], "evidencia": "Lista de seguridad y montaje revisado."},
      {"titulo": "Magnitudes eléctricas", "temas": ["Voltaje", "Corriente", "Resistencia", "Unidades", "Circuito cerrado"], "temasTexto": "Voltaje, corriente, resistencia, unidades y circuito cerrado", "actividades": ["Medir circuitos didácticos de baja tensión y asociar magnitudes con instrumento y medición."], "evidencia": "Registro de mediciones con unidades."},
      {"titulo": "Ley de Ohm", "temas": ["Relación V-I-R", "Cálculo simple", "Selección de resistencia"], "temasTexto": "Relación V-I-R, cálculo simple y selección de resistencia", "actividades": ["Calcular y armar un circuito LED seguro; comparar valor previsto y medido."], "evidencia": "Cálculos, circuito funcional y tabla de medidas."},
      {"titulo": "LED y serie", "temas": ["Polaridad", "Resistencias en serie", "Continuidad", "Esquemas"], "temasTexto": "Polaridad, resistencias en serie, continuidad y esquemas", "actividades": ["Montar varios LED y localizar fallas sencillas introducidas en una práctica."], "evidencia": "Circuito operativo y ficha de diagnóstico."},
      {"titulo": "Pulsadores", "temas": ["Contactos abiertos/cerrados", "Entradas manuales", "Conexiones limpias"], "temasTexto": "Contactos abiertos/cerrados, entradas manuales y conexiones limpias", "actividades": ["Construir un circuito controlado por pulsador y probar estados del contacto."], "evidencia": "Montaje con pulsador y esquema rotulado."},
      {"titulo": "Circuitos en paralelo", "temas": ["Ramas paralelas", "Distribución de corriente", "Comparación con serie"], "temasTexto": "Ramas paralelas, distribución de corriente y comparación con serie", "actividades": ["Montar dos ramas, medir puntos y observar el efecto de desconectar una."], "evidencia": "Diagrama y registro comparativo serie/paralelo."},
      {"titulo": "Medición y diagnóstico", "temas": ["Multímetro", "Voltaje", "Resistencia", "Continuidad", "Errores comunes"], "temasTexto": "Multímetro, voltaje, resistencia, continuidad y errores comunes", "actividades": ["Resolver fallas en un montaje siguiendo una secuencia de comprobación segura."], "evidencia": "Guía con síntoma, medición, causa y corrección."},
      {"titulo": "Reto de circuitos", "temas": ["Diseño", "Cálculo", "Montaje", "Medición", "Seguridad", "Comunicación técnica"], "temasTexto": "Diseño, cálculo, montaje, medición, seguridad y comunicación técnica", "actividades": ["Diseñar y presentar un indicador sencillo; validar conexiones antes de energizar."], "evidencia": "Prototipo, esquema, cálculos y checklist de seguridad."}
    ],
    guia: {"modalidad": "Facilitación presencial: prepara estaciones y materiales antes de iniciar; demuestra el procedimiento, verifica seguridad cuando aplica y observa la práctica directamente.", "nota": "Seguridad: revise herramientas, conexiones y alimentación antes de probar; el estudiantado no energiza ni manipula componentes sin la indicación docente.", "reto": "Modifique una sola parte del circuito, prediga el cambio, mida con el procedimiento seguro y compare el dato con la predicción.", "preguntas": ["¿Qué observaste o mediste?", "¿Qué componente explica el resultado?", "¿Qué verificación de seguridad haces antes de repetir?"]}
  },
  {
    id: 9,
    titulo: "Arduino desde cero",
    area: "Hardware",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Presencial",
    fase: "Lanzamiento",
    instructor: "Andrés Pacheco",
    descripcion: "Programa una placa Arduino para leer sensores y controlar luces, motores y otros dispositivos. Cada sesión combina montaje y código, para que observes enseguida el resultado de lo que programas.",
    objetivo: "Crear proyectos Arduino que interactúan con el mundo físico.",
    proyecto: "Sensor de parqueo con alarma sonora, presentado en una exhibición final",
    temario: [
      "Placa y taller: Pines, alimentación USB, entorno de programación y seguridad",
      "Salidas digitales: pinMode, digitalWrite, tiempos y resistencia limitadora",
      "Entradas digitales: Lectura digital, estados lógicos e interacción",
      "Entradas analógicas: analogRead, potenciómetro, sensores simples y monitor serial",
      "Sensores y decisiones: Lecturas, umbrales, condicionales y respuesta al entorno",
      "Servomotores: Señal de control, movimiento de servo, límites mecánicos y alimentación",
      "Integración: Entradas, salidas, ciclos, funciones y pruebas por etapas",
      "Proyecto final: Diseño de solución, integración, depuración y comunicación"
    ],
    modulos: [
      {"titulo": "Placa y taller", "temas": ["Pines", "Alimentación USB", "Entorno de programación", "Seguridad"], "temasTexto": "Pines, alimentación USB, entorno de programación y seguridad", "actividades": ["Conectar la placa, cargar un ejemplo y reconocer pines y componentes en el banco."], "evidencia": "Placa identificada y programa de prueba cargado."},
      {"titulo": "Salidas digitales", "temas": ["PinMode", "DigitalWrite", "Tiempos", "Resistencia limitadora"], "temasTexto": "pinMode, digitalWrite, tiempos y resistencia limitadora", "actividades": ["Montar LED, programar patrones y revisar polaridad en el taller."], "evidencia": "Circuito con patrones y código comentado."},
      {"titulo": "Entradas digitales", "temas": ["Lectura digital", "Estados lógicos e interacción"], "temasTexto": "Lectura digital, estados lógicos e interacción", "actividades": ["Armar un pulsador que controle una salida y verificar conexiones."], "evidencia": "Montaje interactivo y tabla de estados."},
      {"titulo": "Entradas analógicas", "temas": ["AnalogRead", "Potenciómetro", "Sensores simples", "Monitor serial"], "temasTexto": "analogRead, potenciómetro, sensores simples y monitor serial", "actividades": ["Leer un potenciómetro o sensor y mapear sus valores para controlar un LED."], "evidencia": "Registro serial y control proporcional sencillo."},
      {"titulo": "Sensores y decisiones", "temas": ["Lecturas", "Umbrales", "Condicionales", "Respuesta al entorno"], "temasTexto": "Lecturas, umbrales, condicionales y respuesta al entorno", "actividades": ["Integrar sensor disponible con una señal visual por umbral."], "evidencia": "Sistema que responde al sensor con umbral documentado."},
      {"titulo": "Servomotores", "temas": ["Señal de control", "Movimiento de servo", "Límites mecánicos", "Alimentación"], "temasTexto": "Señal de control, movimiento de servo, límites mecánicos y alimentación", "actividades": ["Controlar un servo con entrada manual o sensor y verificar límites."], "evidencia": "Mecanismo demostrativo y esquema."},
      {"titulo": "Integración", "temas": ["Entradas", "Salidas", "Ciclos", "Funciones", "Pruebas por etapas"], "temasTexto": "Entradas, salidas, ciclos, funciones y pruebas por etapas", "actividades": ["Construir sistema de aviso o control integrando al menos dos entradas o salidas."], "evidencia": "Prototipo integrado, código y plan de pruebas."},
      {"titulo": "Proyecto final", "temas": ["Diseño de solución", "Integración", "Depuración", "Comunicación"], "temasTexto": "Diseño de solución, integración, depuración y comunicación", "actividades": ["Desarrollar y demostrar un proyecto en equipo, documentando conexiones y ajustes."], "evidencia": "Prototipo, código, diagrama y demostración."}
    ],
    guia: {"modalidad": "Facilitación presencial: prepara estaciones y materiales antes de iniciar; demuestra el procedimiento, verifica seguridad cuando aplica y observa la práctica directamente.", "nota": "Seguridad: revise herramientas, conexiones y alimentación antes de probar; el estudiantado no energiza ni manipula componentes sin la indicación docente.", "reto": "Cambie una condición de entrada o salida, pruebe el nuevo comportamiento y documente una lectura o estado observado.", "preguntas": ["¿Qué observaste o mediste?", "¿Qué componente explica el resultado?", "¿Qué verificación de seguridad haces antes de repetir?"]}
  },
  {
    id: 10,
    titulo: "Armado y mantenimiento de computadores",
    area: "Hardware",
    nivel: "Básico",
    duracion: 16,
    modalidad: "Presencial",
    fase: "Próximamente",
    instructor: "Laura Mendoza",
    descripcion: "Conoce un computador por dentro e identifica procesador, memoria RAM, disco, placa base y fuente. Aprende medidas de seguridad, arma un equipo, instala el sistema operativo y configura controladores y particiones; termina con mantenimiento y diagnóstico.",
    objetivo: "Armar, configurar y dar mantenimiento básico a un computador de escritorio.",
    proyecto: "Diagnosticar y poner a punto un equipo con fallas simuladas",
    temario: [
      "Seguridad y componentes: Descarga electrostática, herramientas, piezas y compatibilidades básicas",
      "Procesador y refrigeración: Socket, orientación, pasta térmica y montaje según el equipo",
      "Memoria y alimentación: RAM, unidades, conectores y fuente de poder",
      "Ensamble y arranque: Orden de montaje, cableado, periféricos, POST y BIOS",
      "Sistema operativo: Medio de instalación, particiones, instalación y configuración inicial",
      "Controladores y configuración: Drivers, actualizaciones, dispositivos, red y cuentas",
      "Mantenimiento y diagnóstico: Limpieza segura, temperaturas, síntomas y pruebas básicas",
      "Reto de soporte: Recepción del caso, diagnóstico, intervención y verificación"
    ],
    modulos: [
      {"titulo": "Seguridad y componentes", "temas": ["Descarga electrostática", "Herramientas", "Piezas", "Compatibilidades básicas"], "temasTexto": "Descarga electrostática, herramientas, piezas y compatibilidades básicas", "actividades": ["Reconocer componentes de práctica, usar protección y preparar el área de trabajo."], "evidencia": "Inventario rotulado y checklist de seguridad."},
      {"titulo": "Procesador y refrigeración", "temas": ["Socket", "Orientación", "Pasta térmica", "Montaje según el equipo"], "temasTexto": "Socket, orientación, pasta térmica y montaje según el equipo", "actividades": ["Practicar instalación y retiro en equipos desenergizados siguiendo indicaciones."], "evidencia": "Secuencia ilustrada con puntos críticos."},
      {"titulo": "Memoria y alimentación", "temas": ["RAM", "Unidades", "Conectores", "Fuente de poder"], "temasTexto": "RAM, unidades, conectores y fuente de poder", "actividades": ["Instalar y verificar memoria, almacenamiento y alimentación en estación de trabajo."], "evidencia": "Equipo conectado y hoja de verificación."},
      {"titulo": "Ensamble y arranque", "temas": ["Orden de montaje", "Cableado", "Periféricos", "POST", "BIOS"], "temasTexto": "Orden de montaje, cableado, periféricos, POST y BIOS", "actividades": ["Completar el ensamble y revisar el arranque con lista de control."], "evidencia": "Equipo ensamblado y registro del primer arranque."},
      {"titulo": "Sistema operativo", "temas": ["Medio de instalación", "Particiones", "Instalación", "Configuración inicial"], "temasTexto": "Medio de instalación, particiones, instalación y configuración inicial", "actividades": ["Instalar sistema operativo autorizado en equipo o entorno de práctica."], "evidencia": "Registro del proceso, particiones y sistema iniciado."},
      {"titulo": "Controladores y configuración", "temas": ["Drivers", "Actualizaciones", "Dispositivos", "Red", "Cuentas"], "temasTexto": "Drivers, actualizaciones, dispositivos, red y cuentas", "actividades": ["Completar configuración y verificar funcionamiento de dispositivos principales."], "evidencia": "Lista de dispositivos verificados."},
      {"titulo": "Mantenimiento y diagnóstico", "temas": ["Limpieza segura", "Temperaturas", "Síntomas", "Pruebas básicas"], "temasTexto": "Limpieza segura, temperaturas, síntomas y pruebas básicas", "actividades": ["Inspeccionar equipo apagado y diagnosticar fallas simuladas de hardware/software."], "evidencia": "Informe de mantenimiento y acciones sugeridas."},
      {"titulo": "Reto de soporte", "temas": ["Recepción del caso", "Diagnóstico", "Intervención", "Verificación"], "temasTexto": "Recepción del caso, diagnóstico, intervención y verificación", "actividades": ["Resolver un caso en laboratorio y explicar el proceso al grupo."], "evidencia": "Orden de servicio con síntoma, diagnóstico y solución."}
    ],
    guia: {"modalidad": "Facilitación presencial: prepara estaciones y materiales antes de iniciar; demuestra el procedimiento, verifica seguridad cuando aplica y observa la práctica directamente.", "nota": "Seguridad: revise herramientas, conexiones y alimentación antes de probar; el estudiantado no energiza ni manipula componentes sin la indicación docente.", "reto": "Resuelva un segundo síntoma de diagnóstico: inspeccione, formule una hipótesis, haga una comprobación segura y registre la solución.", "preguntas": ["¿Qué observaste o mediste?", "¿Qué componente explica el resultado?", "¿Qué verificación de seguridad haces antes de repetir?"]}
  },
  {
    id: 11,
    titulo: "Robótica básica",
    area: "Hardware",
    nivel: "Intermedio",
    duracion: 16,
    modalidad: "Presencial",
    fase: "Próximamente",
    instructor: "Andrés Pacheco",
    descripcion: "Diseña, arma y programa un robot móvil en equipo, aprendiendo al probar, fallar y mejorar. Integra chasis, motores y sensores infrarrojos y ultrasónicos para que el robot siga líneas y esquive obstáculos; cada semana trae un reto.",
    objetivo: "Construir un robot que se mueva y reaccione a su entorno.",
    proyecto: "Reto de equipo: robot seguidor de línea que completa un circuito",
    temario: [
      "Reto, equipo y seguridad: Integración robótica, componentes, roles de equipo y cuidado del taller",
      "Chasis y movimiento: Chasis, ruedas, motores, dirección y montaje mecánico",
      "Control de motores: Driver, alimentación, sentido y velocidad",
      "Sensores infrarrojos: Lectura de línea, calibración, umbrales y contraste",
      "Lógica de seguimiento: Condiciones, corrección de trayectoria, pruebas y depuración",
      "Sensor ultrasónico: Distancia, lectura, umbral de obstáculo y limitaciones",
      "Navegación integrada: Sensores, motores, prioridades de decisión y pista combinada",
      "Desafío final: Diseño iterativo, colaboración, depuración y presentación técnica"
    ],
    modulos: [
      {"titulo": "Reto, equipo y seguridad", "temas": ["Integración robótica", "Componentes", "Roles de equipo", "Cuidado del taller"], "temasTexto": "Integración robótica, componentes, roles de equipo y cuidado del taller", "actividades": ["Explorar kit, asignar roles rotativos y acordar reglas de uso de herramientas."], "evidencia": "Inventario y plan de roles."},
      {"titulo": "Chasis y movimiento", "temas": ["Chasis", "Ruedas", "Motores", "Dirección", "Montaje mecánico"], "temasTexto": "Chasis, ruedas, motores, dirección y montaje mecánico", "actividades": ["Armar una base móvil y comprobar giro y estabilidad sobre pista sencilla."], "evidencia": "Chasis ensamblado y pruebas documentadas."},
      {"titulo": "Control de motores", "temas": ["Driver", "Alimentación", "Sentido", "Velocidad"], "temasTexto": "Driver, alimentación, sentido y velocidad", "actividades": ["Programar avance, giro y parada; ajustar el montaje para trayectorias estables."], "evidencia": "Robot que ejecuta secuencia y código inicial."},
      {"titulo": "Sensores infrarrojos", "temas": ["Lectura de línea", "Calibración", "Umbrales", "Contraste"], "temasTexto": "Lectura de línea, calibración, umbrales y contraste", "actividades": ["Probar sensores IR en pista y calibrar para mantener una línea."], "evidencia": "Robot seguidor y tabla de calibración."},
      {"titulo": "Lógica de seguimiento", "temas": ["Condiciones", "Corrección de trayectoria", "Pruebas", "Depuración"], "temasTexto": "Condiciones, corrección de trayectoria, pruebas y depuración", "actividades": ["Implementar seguimiento por etapas y mejorar según observaciones repetidas."], "evidencia": "Código de seguimiento y registro de ajustes."},
      {"titulo": "Sensor ultrasónico", "temas": ["Distancia", "Lectura", "Umbral de obstáculo", "Limitaciones"], "temasTexto": "Distancia, lectura, umbral de obstáculo y limitaciones", "actividades": ["Integrar sensor y programar detención o giro frente a obstáculos."], "evidencia": "Robot detector y mediciones de prueba."},
      {"titulo": "Navegación integrada", "temas": ["Sensores", "Motores", "Prioridades de decisión", "Pista combinada"], "temasTexto": "Sensores, motores, prioridades de decisión y pista combinada", "actividades": ["Completar una pista con línea y obstáculos y mejorar en rondas sucesivas."], "evidencia": "Robot integrado, diagrama y pruebas."},
      {"titulo": "Desafío final", "temas": ["Diseño iterativo", "Colaboración", "Depuración", "Presentación técnica"], "temasTexto": "Diseño iterativo, colaboración, depuración y presentación técnica", "actividades": ["Participar en reto de navegación y documentar fallas y mejoras."], "evidencia": "Robot en desafío, código, iteraciones y presentación."}
    ],
    guia: {"modalidad": "Facilitación presencial: prepara estaciones y materiales antes de iniciar; demuestra el procedimiento, verifica seguridad cuando aplica y observa la práctica directamente.", "nota": "Seguridad: revise herramientas, conexiones y alimentación antes de probar; el estudiantado no energiza ni manipula componentes sin la indicación docente.", "reto": "Cambie una condición de la pista o la posición del obstáculo; ajuste el robot y compare el resultado de dos pruebas.", "preguntas": ["¿Qué observaste o mediste?", "¿Qué componente explica el resultado?", "¿Qué verificación de seguridad haces antes de repetir?"]}
  },
  {
    id: 12,
    titulo: "Internet de las Cosas con ESP32",
    area: "Hardware",
    nivel: "Intermedio",
    duracion: 16,
    modalidad: "Híbrido",
    fase: "Próximamente",
    instructor: "Laura Mendoza",
    descripcion: "Conecta objetos a internet usando una placa ESP32. Conecta la placa a una red WiFi, lee sensores de temperatura y humedad, crea un pequeño servidor web y envía datos a la nube hasta armar un panel con información y alertas.",
    objetivo: "Construir un dispositivo conectado que envía y muestra datos.",
    proyecto: "Monitor de temperatura y humedad que se consulta desde cualquier lugar con internet",
    temario: [
      "IoT y ESP32: Objeto conectado, arquitectura, placa, entorno y seguridad",
      "Entradas y sensores: Entradas digitales/analógicas, lectura y monitor serial",
      "Conexión WiFi: Red, credenciales, estados y cuidado de claves",
      "Temperatura y humedad: Lecturas ambientales, unidades, intervalos y datos inválidos",
      "Servidor web: Petición/respuesta, HTTP básico y página de estado",
      "Datos en la nube: Telemetría, envío periódico, formato y privacidad",
      "Panel y alertas: Visualización, series temporales, umbrales y conectividad",
      "Proyecto IoT: Sensor, WiFi, servidor, visualización, pruebas y comunicación"
    ],
    modulos: [
      {"titulo": "IoT y ESP32", "temas": ["Objeto conectado", "Arquitectura", "Placa", "Entorno", "Seguridad"], "temasTexto": "Objeto conectado, arquitectura, placa, entorno y seguridad", "actividades": ["Preparación virtual y programa base; práctica presencial para identificar placa y cargar ejemplo."], "evidencia": "Diagrama IoT y placa ejecutando programa inicial."},
      {"titulo": "Entradas y sensores", "temas": ["Entradas digitales/analógicas", "Lectura", "Monitor serial"], "temasTexto": "Entradas digitales/analógicas, lectura y monitor serial", "actividades": ["Revisar ficha virtualmente; en taller conectar sensor y observar valores seriales."], "evidencia": "Registro de lecturas y conexiones documentadas."},
      {"titulo": "Conexión WiFi", "temas": ["Red", "Credenciales", "Estados", "Cuidado de claves"], "temasTexto": "Red, credenciales, estados y cuidado de claves", "actividades": ["Preparar lógica en línea; práctica guiada para conectar a red de prueba sin exponer claves."], "evidencia": "ESP32 conectado y estado verificado de forma segura."},
      {"titulo": "Temperatura y humedad", "temas": ["Lecturas ambientales", "Unidades", "Intervalos", "Datos inválidos"], "temasTexto": "Lecturas ambientales, unidades, intervalos y datos inválidos", "actividades": ["Planear formato virtualmente; medir en taller en distintos momentos y comparar."], "evidencia": "Programa que presenta datos con unidades y validación."},
      {"titulo": "Servidor web", "temas": ["Petición/respuesta", "HTTP básico", "Página de estado"], "temasTexto": "Petición/respuesta, HTTP básico y página de estado", "actividades": ["Diseñar vista en línea; práctica para servir desde la placa una página con mediciones."], "evidencia": "Página local accesible con valores actuales."},
      {"titulo": "Datos en la nube", "temas": ["Telemetría", "Envío periódico", "Formato", "Privacidad"], "temasTexto": "Telemetría, envío periódico, formato y privacidad", "actividades": ["Definir campos/frecuencia en línea; práctica para enviar datos al entorno aprobado."], "evidencia": "Registro de datos remotos y flujo descrito."},
      {"titulo": "Panel y alertas", "temas": ["Visualización", "Series temporales", "Umbrales", "Conectividad"], "temasTexto": "Visualización, series temporales, umbrales y conectividad", "actividades": ["Diseñar panel y umbrales en línea; práctica para integrar gráfica y alerta de prueba."], "evidencia": "Panel con indicadores y alerta comprobada."},
      {"titulo": "Proyecto IoT", "temas": ["Sensor", "WiFi", "Servidor", "Visualización", "Pruebas", "Comunicación"], "temasTexto": "Sensor, WiFi, servidor, visualización, pruebas y comunicación", "actividades": ["Documentar avances virtualmente; práctica final para probar condición límite y presentar."], "evidencia": "Prototipo, diagrama, panel, pruebas y reflexión de privacidad."}
    ],
    guia: {"modalidad": "Facilitación híbrida: antes del encuentro, publica una preparación virtual breve; realiza una práctica presencial guiada en este módulo (cada dos semanas) y cierra en línea con la evidencia y reflexión.", "nota": "Cuidado técnico: use una red de práctica y datos de ejemplo; no publique contraseñas ni información personal.", "reto": "Simule una lectura anormal o una interrupción de conectividad; ajuste la respuesta del sistema y compruebe que los datos y alertas sigan siendo seguros.", "preguntas": ["¿Qué ve o recibe la persona usuaria?", "¿Qué pasa si cambia la entrada o falla la conexión?", "¿Cómo lo comprobarías?"]}
  }
];

/* ---------- Fichas: cada grupo de un curso tiene un número para ubicarlo fácil (ej. 25896) ----------
   numero · curso_id · jornada · inicio (AAAA-MM-DD) · cupos · estado
   El docente de la ficha es el instructor del curso. */
window.TALENTO_CARIBE_FICHAS = [
  {numero:'25896',curso_id:1,jornada:'Mañana',inicio:'2026-09-07',cupos:25,estado:'En formación'},
  {numero:'25897',curso_id:1,jornada:'Noche',inicio:'2026-11-03',cupos:25,estado:'Inscripciones abiertas'},
  {numero:'25910',curso_id:2,jornada:'Tarde',inicio:'2026-10-19',cupos:25,estado:'Inscripciones abiertas'},
  {numero:'25921',curso_id:3,jornada:'Tarde',inicio:'2026-09-14',cupos:25,estado:'En formación'},
  {numero:'25922',curso_id:3,jornada:'Sábados',inicio:'2026-11-07',cupos:30,estado:'Inscripciones abiertas'},
  {numero:'25935',curso_id:4,jornada:'Tarde',inicio:'2027-02-01',cupos:25,estado:'Próximamente'},
  {numero:'25940',curso_id:5,jornada:'Noche',inicio:'2027-02-01',cupos:30,estado:'Próximamente'},
  {numero:'25952',curso_id:6,jornada:'Noche',inicio:'2027-02-08',cupos:25,estado:'Próximamente'},
  {numero:'25963',curso_id:7,jornada:'Noche',inicio:'2026-09-21',cupos:30,estado:'En formación'},
  {numero:'25974',curso_id:8,jornada:'Mañana',inicio:'2026-09-28',cupos:20,estado:'En formación'},
  {numero:'25985',curso_id:9,jornada:'Sábados',inicio:'2026-10-24',cupos:20,estado:'Inscripciones abiertas'},
  {numero:'25990',curso_id:10,jornada:'Sábados',inicio:'2027-02-06',cupos:16,estado:'Próximamente'},
  {numero:'26001',curso_id:11,jornada:'Sábados',inicio:'2027-03-06',cupos:16,estado:'Próximamente'},
  {numero:'26012',curso_id:12,jornada:'Tarde',inicio:'2027-03-01',cupos:20,estado:'Próximamente'}
];

// El catálogo de demostración admite ajustes locales desde el panel administrativo.
try {
  const guardados = JSON.parse(localStorage.getItem("tc_cursos_demo") || "[]");
  const base = window.TALENTO_CARIBE_CURSOS;
  window.TALENTO_CARIBE_CURSOS = base.map((curso) => ({ ...curso, ...(guardados.find((item) => Number(item.id) === Number(curso.id)) || {}) }));
  window.TALENTO_CARIBE_CURSOS.push(...guardados.filter((item) => !base.some((curso) => Number(curso.id) === Number(item.id))));
} catch { /* Si el almacenamiento está deshabilitado, se usa el catálogo inicial. */ }
// Los cursos están abiertos a principiantes; la edad se define por separado por programa.
window.TALENTO_CARIBE_CURSOS.forEach((curso) => { delete curso.requisitos; if (curso.edadMinima == null) curso.edadMinima = 14; });

// Fichas creadas desde el panel administrativo en modo demostración
try {
  const fichasDemo = JSON.parse(localStorage.getItem("tc_fichas_demo") || "[]");
  fichasDemo.forEach((f) => {
    const i = window.TALENTO_CARIBE_FICHAS.findIndex((x) => x.numero === f.numero);
    if (i >= 0) window.TALENTO_CARIBE_FICHAS[i] = f; else window.TALENTO_CARIBE_FICHAS.push(f);
  });
} catch { /* almacenamiento no disponible */ }

/* ---------- Módulos ----------
   Cada curso se divide en módulos con sus temas y actividades del plan.
   Si un curso todavía no tiene "modulos" definidos, se arman a partir de su temario:
   cada línea del temario es un módulo y sus partes (separadas por coma o "y") son los temas.
   Para escribirlos a mano, agrega al curso:
     modulos: [{ titulo: 'Nombre del módulo', temas: ['Tema 1', 'Tema 2'], actividades: ['Taller: ...'] }, ...] */
window.TCModulos = (curso) => {
  if (Array.isArray(curso.modulos) && curso.modulos.length) {
    return curso.modulos.map((m, i) => ({ numero: i + 1, titulo: m.titulo, temas: m.temas || [], temasTexto: m.temasTexto || (m.temas || []).join(", "), actividades: m.actividades || [], evidencia: m.evidencia || "" }));
  }
  const partir = (texto) => String(texto).split(/,\s*|\s+y\s+/).map((t) => t.trim()).filter(Boolean).map((t) => t[0].toUpperCase() + t.slice(1));
  return (curso.temario || []).map((linea, i) => {
    // "Nombre del módulo: tema 1, tema 2" -> título y temas por separado
    const dos = String(linea).match(/^([^:]{3,80}):\s*(.+)$/);
    return { numero: i + 1, titulo: dos ? dos[1].trim() : linea, temas: partir(dos ? dos[2] : linea), temasTexto: dos ? dos[2] : linea, actividades: [], evidencia: "" };
  });
};
window.TALENTO_CARIBE_CURSOS.forEach((curso) => { curso.modulos = window.TCModulos(curso); });

/* ---------- Guía de clase de un módulo (para docentes) ----------
   Cada módulo dura dos semanas con dos sesiones modelo de 90 minutos. La estructura es la del plan de cursos:
   se completa con el título, los temas, la actividad y la evidencia del módulo, y con la guía del curso. */
window.TCSesiones = (curso, m) => {
  const g = curso.guia || {}, actividad = (m.actividades && m.actividades[0]) || "la actividad del módulo";
  const temas = m.temasTexto || m.temas.join(", ");
  return [
    { nombre: "Primera semana · Sesión 1", pasos: [
      ["Inicio", 10, m.numero === 1 ? "Inicie con una pregunta breve sobre una situación cotidiana relacionada con el tema; use las respuestas para presentar el vocabulario de la clase." : "Inicie recuperando una idea del módulo anterior y pregunte cómo se aplicaría al nuevo reto."],
      ["Desarrollo", 25, `Explique ${m.titulo.toLowerCase()} en palabras sencillas. Desarrolle estos conceptos uno por uno: ${temas}. Dibuje o escriba cómo se conectan y use un caso concreto antes de pasar a la práctica.`],
      ["Modelado docente", 20, `Muestre la actividad «${actividad}» paso a paso: plantee el reto, modele una primera decisión, diga qué espera observar y compruebe el resultado. Pida al grupo que prediga el paso siguiente y explique una corrección frecuente.`],
      ["Práctica guiada", 25, "El grupo comienza la misma actividad con apoyo; haga dos pausas de revisión y pida que expliquen qué decisión tomaron."],
      ["Cierre", 10, "Cada estudiante dice qué entendió y deja una pregunta o un error que logró corregir."],
    ] },
    { nombre: "Segunda semana · Sesión 2", pasos: [
      ["Recuperación", 10, "Repase tres ideas clave con preguntas breves."],
      ["Revisión guiada", 10, "Reconstruyan los pasos y aclaren dudas."],
      ["Reto aplicado", 40, g.reto || "Proponga una variación del ejercicio y compruebe el resultado."],
      ["Revisión entre pares", 20, "Intercambien productos y comprueben con estas preguntas: " + ((g.preguntas || []).join(" ") || "¿Qué funcionó? ¿Qué mejorarías?")],
      ["Cierre y entrega", 10, `Incorporen una mejora y entreguen: ${(m.evidencia || "la evidencia del módulo").replace(/\.$/, "")}.`],
    ] },
  ];
};
