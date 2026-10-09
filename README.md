# Talento Caribe

Plataforma educativa gratuita e híbrida de software y hardware para jóvenes de Barranquilla, el Caribe y Latinoamérica.
*Tu talento no tiene fronteras.*

## Estructura

```
talento-caribe/
├── index.html            Inicio: marca, nosotros, cursos destacados, mentores, asistente IA y contacto
├── cursos.html           Catálogo, detalle e inscripción de estudiantes registrados
├── registro.html         Registro de cuenta y perfil por país
├── admin/
│   ├── login.html        Acceso unificado: estudiantes, docentes y administrativos
│   └── panel.html        Panel por cargo, áreas y encuestas departamentales
├── portal.html           Espacios de estudiante, docente y administrativo (vista previa)
├── css/                  style.css (público) y admin.css (panel)
├── js/                   Lógica del frontend (incluye asistente global y permisos por cargo de demostración)
├── assets/img/           Logo, ilustraciones y favicon
├── database/
│   ├── schema.sql        Tablas de PostgreSQL
│   └── seed.sql          Datos iniciales (12 cursos y configuración del asistente)
└── README.md
```

## Dos formas de abrir el proyecto

| Cómo lo abres | Modo | Dónde se guardan los datos |
|---|---|---|
| `npm start` en `backend/` → **http://localhost:3000** | **Real** | PostgreSQL: cuentas (clave con bcrypt), inscripciones, actividades, entregas, notas, mensajes, gastos y cursos |
| Live Server (clic derecho en `index.html` → Open with Live Server) | Demostración | El navegador (`localStorage`), sin servidor |
| GitHub Pages | Demostración, o **Real** si `API_PUBLICADA` en `js/config.js` apunta al backend publicado | Igual que arriba |

`js/config.js` elige el modo solo: si la página la sirve el puerto 3000, usa la API; en GitHub Pages usa `API_PUBLICADA` cuando está llena.

## Correr el servidor (página + API + PostgreSQL)

Sigue la guía de [`backend/README.md`](backend/README.md). En resumen, dentro de `backend/`:

```
npm install
copy .env.ejemplo .env      (y pon tu contraseña de postgres)
npm run db:init
npm start                   → http://localhost:3000
```

## Crear la base de datos manualmente (opcional, con psql)

```
psql -U postgres -c "CREATE DATABASE talento_caribe;"
psql -U postgres -d talento_caribe -f database/schema.sql
psql -U postgres -d talento_caribe -f database/seed.sql
```

## Estado del frontend

- [x] Estructura HTML
- [x] Base de datos
- [x] CSS
- [x] Catálogo local de 12 cursos con búsqueda, filtros, detalle y preinscripción de vista previa por país
- [x] Acceso por cargo administrativo y vistas departamentales de demostración
- [x] Registro estudiantil por país, con documento, contacto, edad y datos de acudiente cuando aplica
- [x] Inscripción desde el catálogo: solicita cuenta, registra el perfil y permite continuar al curso
- [x] Asistente conversacional compartido entre catálogo, registro, login, portal y panel
- [x] Permisos de interfaz por departamento y cargo administrativo; encuestas agrupadas por departamento
- [x] Crear y editar cursos en el catálogo local de demostración, con edad mínima configurable
- [x] Encuestas de ejemplo organizadas por departamento para el equipo administrativo
- [x] Panel de estudiante con actividades pendientes y cursos solicitados
- [x] Servidor Node + Express que sirve la página y la API con PostgreSQL
- [x] Registro e inicio de sesión de los tres roles con contraseñas cifradas (bcrypt) y sesión JWT
- [x] Inscripciones, aprobación por admisiones, actividades, entregas y calificaciones guardadas en PostgreSQL
- [x] Permisos por rol y cargo validados en el servidor (no solo en la interfaz)
- [x] Cursos divididos en módulos (temas + actividades del plan) y fichas por grupo (ej. 25896)
- [x] Inscripción en una ficha, actividades por módulo y ficha, y seguimiento docente módulo por módulo
- [x] Asistente conectado a IA real (Claude) en `POST /api/chat`: conoce la marca, el catálogo y las fichas desde PostgreSQL y usa el tono que define el gerente
- [x] Efecto del cursor y destello de clics/toques solo en la página de inicio
- [x] Animación de entrada nueva, hero interactivo, revelado al hacer scroll, cifras animadas y transiciones en toda la plataforma
- [x] Preparado para publicar: `.nojekyll` para GitHub Pages, `render.yaml` para el backend, CORS y SSL configurables
- [x] Control de versiones con Git
- [x] Encuestas que guardan respuestas: el estudiante responde en su portal y el panel muestra resultados sin nombres
- [x] Recuperar contraseña por correo y correos de bienvenida, contacto e inscripción (con SMTP en `backend/.env`)
- [x] Vista previa con imagen al compartir el enlace (cambiar `TU-USUARIO` en `index.html` y `cursos.html` al publicar)
- [ ] Poner `ANTHROPIC_API_KEY` en `backend/.env` (sin ella el asistente usa respuestas locales)
- [ ] Subir el repositorio a GitHub
- [ ] Publicar: frontend en GitHub Pages y backend en Render (pasos en «Publicar el proyecto»)

## Cuentas de prueba

Funcionan igual en los dos modos (con servidor vienen de `database/seed.sql`).

| Perfil | Correo | Contraseña | Entra a |
|---|---|---|---|
| Estudiante | estudiante@talentocaribe.co | Estudiante123 | portal.html |
| Docente | docente@talentocaribe.co | Docente123 | portal.html |
| Administrativo | admin@talentocaribe.co | Admin123 | admin/panel.html |

**En modo demostración** las cuentas y perfiles de estudiante se guardan localmente en `localStorage`, incluidos los números de documento y datos de contacto; las contraseñas se guardan derivadas mediante PBKDF2. **No ingreses documentos reales en esta demostración:** cualquier persona con acceso al navegador puede inspeccionar esos datos. El correo activo se solicita, pero el envío de confirmaciones todavía requiere un servicio de correo conectado.

En modo demostración los cargos y permisos solo se aplican en la interfaz. **Con el servidor** los valida el backend: cada rol y cargo recibe solo sus datos (por ejemplo, solo admisiones ve documentos y teléfonos de los estudiantes). En modo demostración el asistente contesta con reglas locales; con el servidor usa la IA real de `/api/chat` (ver «Asistente con IA real»). Las encuestas siguen siendo plantillas; todavía no recopilan respuestas.

## Asistente con IA real

`backend/src/rutas/chat.js` recibe la pregunta en `POST /api/chat` y se la envía a Claude (Anthropic) con unas instrucciones que el servidor arma en cada mensaje:

- **Conoce el negocio:** historia, misión, visión, valores, mentores, cómo inscribirse y contacto de Talento Caribe.
- **Conoce los productos:** los cursos y fichas se leen de PostgreSQL. Si el equipo crea un curso o una ficha en el panel, el asistente lo sabe de inmediato.
- **Usa el tono de la marca:** el tono y el contexto extra los define el gerente en el panel (sección «Configurar IA», tabla `config_ia`).
- **Responde como el negocio:** solo con esa información, sin inventar fechas ni datos, sin pedir contraseñas ni documentos, y sugiere 2 o 3 preguntas para seguir.
- **Seguro y económico:** el rol del usuario sale de su sesión (JWT), no de lo que diga el navegador; máximo 20 mensajes cada 10 minutos por persona; las instrucciones se reutilizan con la caché de la API.

Para activarlo agrega tu clave en `backend/.env` y reinicia el servidor:

```
ANTHROPIC_API_KEY=sk-ant-...
```

La clave se crea en https://platform.claude.com → API Keys. Sin clave, el chat sigue funcionando con las respuestas locales y muestra «la IA todavía no está configurada». `GET /api/salud` indica si el asistente está conectado.

## Encuestas, correos y recuperar contraseña

| Qué | Cómo funciona |
|---|---|
| Encuestas (`js/encuestas-data.js`) | 5 encuestas por departamento. El estudiante las responde una vez en *Mi espacio → Encuestas* (el menú muestra cuántas le faltan). El panel muestra promedios, barras por opción y comentarios, sin nombres. El servidor valida cada respuesta con el mismo archivo. |
| Recuperar contraseña (`recuperar.html`) | Desde «¿Olvidaste tu contraseña?» en el ingreso. Llega un enlace al correo que sirve una sola vez y vence en 1 hora; en la base solo se guarda su huella (SHA-256). |
| Correos (`backend/src/correo.js`) | Bienvenida al crear la cuenta, recuperar contraseña, contraseña cambiada, confirmación del formulario de contacto (y copia al equipo con `CORREO_EQUIPO`), solicitud de inscripción recibida y aprobada o no aprobada. |

Para enviar correos de verdad, configura SMTP en `backend/.env` (ver `backend/.env.ejemplo`; con Gmail se usa una «contraseña de aplicación»). Sin esa configuración los correos no se envían: aparecen en la terminal del servidor, así se puede probar todo en el computador.

> **Si ya tenías la base creada**, ejecuta `npm run db:actualizar` en `backend/`: crea las tablas nuevas, corrige la duración de los cursos y carga respuestas de ejemplo, sin borrar nada.

## Animaciones e interacción

Todas las animaciones están hechas con CSS y JavaScript propios (sin librerías externas) y usan solo `transform` y `opacity`, que el navegador anima sin trabarse. Con «reducir movimiento» activado en el sistema no se muestra ninguna.

| Dónde | Qué pasa |
|---|---|
| Entrada (`js/intro.js`) | Amanecer en el Caribe: se dibuja el horizonte, sale el sol y brilla en el agua, el emblema aparece desde su propio sol, "TALENTO" sube letra por letra y "CARIBE" se cierra. La barra espera a que la página cargue. Al salir, el telón sube como una ola y el emblema **vuela hasta el logo del hero** (técnica FLIP). Una vez por sesión; para verla otra vez: `index.html?intro`. |
| Hero | El título sube por líneas, el texto entra en cascada y el disco del logo crece. Con mouse, la escena del logo se inclina hacia el puntero y los botones se acercan al cursor. |
| Inicio | Cifras que cuentan desde cero (salen del catálogo), cinta de temas en movimiento, línea de tiempo en «Cómo funciona», anillo de colores en los mentores y tarjetas de cursos que giran en 3D. |
| Todas las páginas | Revelado al hacer scroll (`data-revelar`, `data-escalonar` en el HTML), barra superior que se esconde al bajar y vuelve al subir, línea de lectura, transición suave entre páginas y tarjetas esqueleto mientras cargan los cursos. |
| Plataforma | Cada sección del portal y del panel entra en cascada, los indicadores cuentan, las barras crecen y los anillos de avance se llenan. |

El **efecto que sigue el cursor** (aura y estela de luces), el reflejo y giro de las tarjetas y el **destello al hacer clic o tocar la pantalla** solo se activan en la página de inicio (`<body class="page-home">`); en catálogo, registro, login, portal y panel la interfaz queda limpia para trabajar.

## Publicar el proyecto

**1. Subir a GitHub.** Crea un repositorio vacío llamado `talento-caribe` en GitHub (sin README ni .gitignore) y, en la carpeta del proyecto:

```
git remote add origin https://github.com/TU-USUARIO/talento-caribe.git
git push -u origin main
```

Después, por cada cambio con sentido (un arreglo, una sección, una función): `git add .`, `git commit -m "Qué cambió"` y `git push`. `backend/.env` no se sube (está en `.gitignore`).

**2. Frontend en GitHub Pages.** En GitHub: *Settings → Pages → Source: Deploy from a branch → main / (root)*. La página queda en `https://TU-USUARIO.github.io/talento-caribe/`. Sin backend funciona en modo demostración. Cambia `TU-USUARIO` por tu usuario en las etiquetas `og:` de `index.html` y `cursos.html` para que se vea la imagen al compartir el enlace por WhatsApp.

**3. Backend en Render (para cuentas reales, contacto real e IA).** En https://render.com: *New → Blueprint* → elige el repositorio. `render.yaml` crea la base PostgreSQL y el servidor, y te pide:
- `ANTHROPIC_API_KEY`: la clave del asistente.
- `CORS_ORIGENES`: `https://TU-USUARIO.github.io`

Render también pide `SITIO_URL` (la dirección de la página en GitHub Pages, para los enlaces de los correos) y los datos de SMTP; puedes dejarlos vacíos al principio. Cuando Render termine, copia la URL del servidor (por ejemplo `https://talento-caribe-api.onrender.com`) en `API_PUBLICADA` de `js/config.js`, haz commit y push: GitHub Pages pasará a usar la API real. El plan gratis de Render se duerme tras 15 minutos sin uso (la primera petición tarda ~1 minuto) y su base gratis vence a los 30 días; para una base permanente puedes usar Neon o Supabase con `DATABASE_SSL=true`.

## Plataforma: roles, actividades y asistente IA (modo demostración)

| Archivo | Qué hace |
|---|---|
| `js/datos.js` | Modelo compartido: matrículas, actividades y entregas. Con servidor los pide a `GET /api/datos` y guarda con la API; sin servidor usa `localStorage`. |
| `js/auth.js` | Registro, inicio de sesión y perfil (API con JWT, o local en modo demostración). |
| `js/asistente-ia.js` | Asistente IA por rol (estudiante, docente, administrativo, visitante) con datos reales del usuario + componente de chat completo. Con `MODO_DEMO: false` envía la pregunta y el contexto a `POST /api/chat`. |
| `js/portal.js` | Espacio de estudiantes (inicio didáctico, cursos, actividades, logros, tutor IA) y de docentes (crear actividades, calificar entregas, seguimiento). |
| `js/panel.js` | Panel administrativo por cargo: indicadores, gráficas, actividad académica, asistente de gestión. |
| `js/login.js` | Acceso por rol, selector visual de cargo y selector de docente. |
| `js/guia.js` | Guía paso a paso que aparece la primera vez en cada espacio (botón «Guía» para repetirla). |
| `js/iconos.js` | Íconos SVG de línea. |
| `css/plataforma.css` | Estilos de login, portal, panel, chat y guía (vidrio). |

**Cuentas de prueba:** estudiante `estudiante@talentocaribe.co / Estudiante123` · docentes `docente@`, `daniel@`, `valeria@`, `andres@`, `laura@talentocaribe.co` con clave `Docente123` · administrativo `admin@talentocaribe.co / Admin123` (con cualquier cargo).

**Flujo de actividades:** el docente publica una actividad en un curso que dicta → la ven los estudiantes con inscripción *aprobada* en ese curso → el estudiante entrega → el docente califica (1.0 a 5.0) con retroalimentación → el estudiante ve su nota.

## Animación de entrada, modo claro e inglés

| Archivo | Qué hace |
|---|---|
| `js/intro.js` | Animación de entrada (amanecer caribeño, emblema que aparece desde su sol, "TALENTO CARIBE" letra a letra, lema, barra de carga y salida en forma de ola con el emblema volando al logo). Una vez por sesión (o con `?intro`); se salta con clic, rueda del mouse o Esc; respeta "reducir movimiento". |
| `css/tema.css` | Paletas: oscuro (original) y claro "arena y mar". Se carga antes de `style.css`. Los colores de los demás CSS usan variables (`--tinte`, `--texto-fuerte`, `--o-*`...). |
| `js/i18n.js` | Aplica tema e idioma antes de pintar, traduce textos y atributos (también lo que el JS pinta después) y añade los botones ☀/🌙 y ES/EN. Expone `TCIdioma` y `TCi18n.t()`. |
| `js/i18n-en.js` | Diccionario español → inglés. `#` = cualquier número. `TC_EN_PATRONES` cubre frases con nombres. |

- Preferencias guardadas en `localStorage`: `tc_tema` (`claro`/`oscuro`; por defecto sigue al sistema) y `tc_idioma` (`es`/`en`; por defecto español).
- Para traducir un texto nuevo, agrega la línea `"Texto en español": "English text"` en `js/i18n-en.js`.
- El contenido escrito por personas (respuestas, mensajes del chat) lleva `data-no-traducir` y no se modifica.

## Módulos y fichas

| Concepto | Qué es | Dónde se define |
|---|---|---|
| **Módulo** | Parte de un curso (2 semanas) con sus temas, la actividad del plan y la evidencia que se entrega. Los 96 módulos (8 por curso, 16 semanas) vienen del documento *Plan de cursos y clases desarrolladas*. | `js/cursos-data.js` (propiedad `modulos` de cada curso). Si no existe, se arma desde `temario`: cada línea es un módulo. En el panel: «Nombre del módulo: tema 1, tema 2». |
| **Ficha** | Grupo de un curso con número propio, jornada, fecha de inicio, cupos y estado. | `TALENTO_CARIBE_FICHAS` en `js/cursos-data.js`; en el panel → Cursos → Fichas. Con servidor: tabla `fichas`. |

- **Estudiante:** en el catálogo elige la ficha (solo las que tienen *Inscripciones abiertas*). En *Mis cursos* ve su avance en cada módulo.
- **Guía de clase:** en *Mis cursos*, cada módulo muestra al docente sus dos sesiones de 90 minutos (inicio, desarrollo, modelado, práctica, cierre, reto, revisión entre pares y entrega), la forma de trabajo según la modalidad y las normas de seguridad. El botón *Publicar la actividad de este módulo* deja la actividad lista para revisar y publicar.
- **Docente:** al publicar una actividad elige el **módulo** y la **ficha** (o *todas las fichas*). En *Seguimiento* ve una tabla por ficha: cada estudiante × cada módulo, con porcentaje de entregas; tocando un estudiante ve el detalle y puede calificar.
- **Búsqueda por ficha:** en el catálogo (`cursos.html?ficha=25896`), en Seguimiento del docente y en Inscripciones del panel.

Formato para escribir los módulos de un curso a mano en `js/cursos-data.js`:

```js
modulos: [
  { titulo: 'Fundamentos', temas: ['Variables', 'Tipos de datos'], actividades: ['Taller: mi primera variable'] },
  { titulo: 'Decisiones', temas: ['Condicionales', 'Ciclos'], actividades: ['Quiz de condicionales'] }
]
```

Después de cambiar el catálogo o las fichas, regenera los datos de PostgreSQL con `node scripts/generar-seed.js` (en `backend/`) y luego `npm run db:reiniciar`.

> **Si ya tenías la base creada:** las tablas cambiaron (nueva tabla `fichas` y columnas `modulos`, `ficha_id` y `modulo`). Ejecuta `npm run db:reiniciar` en `backend/` (borra los datos de prueba y los vuelve a crear).
