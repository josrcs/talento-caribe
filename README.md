# Talento Caribe

Plataforma educativa gratuita e híbrida de software y hardware para jóvenes de Barranquilla, el Caribe y Latinoamérica.
*Tu talento no tiene fronteras.*

| Parte | Tecnología | Dónde se publica |
|---|---|---|
| **Frontend** | **React 19** con **Vite** (JavaScript, JSX y CSS) | GitHub Pages: `https://josrcs.github.io/talento-caribe/` |
| **Backend** | Node.js + Express (API REST, JWT, bcrypt) | Render: `https://talento-caribe-api.onrender.com` |
| **Base de datos** | PostgreSQL | Render (u otro PostgreSQL) |

```
Navegador ── React (frontend/) ──fetch──▶ API Express (backend/) ──SQL──▶ PostgreSQL (database/)
             GitHub Pages                 Render                          Render
```

El frontend **siempre** trabaja con la API real: no hay modo de demostración. Todo lo que se ve
(cursos, inscripciones, actividades, notas, mensajes, gastos, encuestas) sale de PostgreSQL a
través de la API, y todo lo que se guarda pasa por ella.

## Estructura

```
talento-caribe/
├── frontend/                    Frontend en React (Vite)
│   ├── index.html, cursos.html, registro.html, recuperar.html, portal.html, 404.html
│   ├── privacidad.html, encuesta.html
│   ├── admin/login.html, admin/panel.html
│   │                            Cada página HTML solo tiene <div id="root"> y carga su entrada de React
│   ├── src/
│   │   ├── entradas/            Un archivo por página: importa sus estilos y monta el componente
│   │   ├── paginas/             Componentes de cada página
│   │   │   ├── inicio/          Inicio: orientador, rutas, cursos destacados, contacto
│   │   │   ├── cursos/          Catálogo, detalle del curso y preinscripción
│   │   │   ├── acceso/          Ingreso, registro, recuperar contraseña y 404
│   │   │   ├── legal/           Política de datos personales y encuesta pública anónima
│   │   │   ├── portal/          Espacio de estudiantes y docentes
│   │   │   └── panel/           Panel administrativo por cargo
│   │   ├── componentes/         Piezas reutilizables (encabezado, chat del asistente, ventanas, íconos...)
│   │   │   └── app/             Las que comparten portal y panel (cabecera, guía, intro, "Mi cuenta")
│   │   ├── contexto/Datos.jsx   Contexto de React: carga GET /api/datos y ofrece las acciones de escritura
│   │   ├── lib/                 Lógica sin interfaz: API, sesión, modelo de datos, asistente, utilidades
│   │   ├── i18n/                Idioma (español/inglés) y tema (claro/oscuro)
│   │   ├── estilos/             CSS (los mismos estilos de siempre)
│   │   └── assets/img/          Logos y favicon
│   ├── public/assets/img/       Imagen para compartir el enlace (se publica tal cual)
│   └── vite.config.js           Páginas, proxy de /api y política de seguridad (CSP)
├── backend/                     API en Node + Express (ver backend/README.md)
├── compartido/                  Datos que usan frontend y backend
│   ├── cursos.json              Catálogo inicial: 12 cursos, 96 módulos y fichas
│   └── encuestas.json           Encuestas por departamento y respuestas de ejemplo
├── database/                    schema.sql (tablas) y seed.sql (datos iniciales)
├── .github/workflows/pages.yml  Compila React y lo publica en GitHub Pages
└── render.yaml                  Despliegue del backend y la base en Render
```

## Cómo está hecho el frontend en React

| Pieza | Archivo | Qué hace |
|---|---|---|
| Páginas | `src/paginas/**/*.jsx` | Cada página es un componente (`Inicio`, `Cursos`, `Login`, `Portal`, `Panel`...) armado con componentes más pequeños. |
| Estado | `useState`, `useMemo`, `useEffect` | Filtros, formularios, ventanas abiertas, sección actual del portal y del panel. |
| Datos | `src/contexto/Datos.jsx` | `<DatosProvider>` pide `GET /api/datos` al abrir la página y comparte, con el hook `useDatos()`, el **modelo** (consultas: cursos de un docente, progreso por módulo...) y las **acciones** (inscribirse, entregar, calificar, crear cursos...). Cada acción llama a la API y recarga los datos. |
| API | `src/lib/api.js` | `pedir(metodo, ruta, cuerpo)`: `fetch` con el token JWT; si la sesión venció, vuelve al ingreso. |
| Sesión | `src/lib/sesion.js` | Guarda el token y el perfil público tras iniciar sesión. |
| Contextos de página | `PortalContexto.jsx`, `PanelContexto.jsx` | Comparten la navegación y las ventanas entre las secciones del portal y del panel. |
| Formularios | `src/lib/validacion.jsx` | Hook `useValidacion()` con las mismas reglas que valida el servidor. |
| Asistente | `src/componentes/ChatIA.jsx`, `src/lib/asistente.js` | Chat como componente; envía la pregunta a `POST /api/chat` (Gemini) y, si no hay IA, responde con reglas locales. |

**¿Por qué varias páginas HTML y no una sola?** Cada página (`index.html`, `cursos.html`, `admin/login.html`...) monta su propio componente de React. Así las direcciones son las mismas de siempre: los enlaces de los correos (`recuperar.html?token=...`, `admin/login.html`) siguen funcionando y GitHub Pages no necesita trucos para las rutas.

**¿Qué guarda el navegador?** Solo lo que es de esa persona en ese navegador: el token de la sesión, el idioma, el tema, si ya vio la guía de bienvenida y el historial del asistente. Los datos de la plataforma están en PostgreSQL.

## Correr el proyecto en tu computador

Necesitas **Node.js 20.19 o superior** y **PostgreSQL**. Primero el backend (guía completa en [`backend/README.md`](backend/README.md)):

```
cd backend
npm install
copy .env.ejemplo .env      (y pon tu contraseña de postgres)
npm run db:init
npm start                   → API en http://localhost:3000
```

Luego, en **otra terminal**, el frontend:

```
cd frontend
npm install
npm run dev                 → http://localhost:5173
```

Vite recarga la página al instante cuando guardas un archivo y envía las peticiones de `/api` al backend del puerto 3000 (proxy en `vite.config.js`).

**Ver la versión final:** `npm run build` dentro de `frontend/` crea `frontend/dist`. Con eso, `npm start` en `backend/` sirve la página y la API juntas en **http://localhost:3000**.

> Live Server ya no sirve para abrir el proyecto: React se escribe en JSX y Vite tiene que compilarlo. Usa `npm run dev`.

## Crear la base de datos manualmente (opcional, con psql)

```
psql -U postgres -c "CREATE DATABASE talento_caribe;"
psql -U postgres -d talento_caribe -f database/schema.sql
psql -U postgres -d talento_caribe -f database/seed.sql
```

## Funcionalidades

- [x] **Frontend en React 19 + Vite**: componentes, hooks, contexto y páginas con la misma apariencia de siempre
- [x] El frontend trabaja siempre con la API real (sin modo demostración)
- [x] Catálogo de 12 cursos con búsqueda, filtros por área, nivel, modalidad y número de ficha, detalle y preinscripción guiada por país
- [x] Registro estudiantil por país, con documento, contacto, edad y datos de acudiente cuando aplica
- [x] Registro e inicio de sesión de los tres roles con contraseñas cifradas (bcrypt) y sesión JWT
- [x] Inscripciones, aprobación por admisiones, actividades, entregas y calificaciones guardadas en PostgreSQL
- [x] Permisos por rol y cargo validados en el servidor (no solo en la interfaz)
- [x] Cursos divididos en módulos (temas + actividades del plan) y fichas por grupo (ej. 25896)
- [x] Inscripción en una ficha, actividades por módulo y ficha, y seguimiento docente módulo por módulo
- [x] Portal del estudiante: inicio didáctico, cursos, actividades, logros, encuestas y tutor IA
- [x] Portal del docente: cursos con guía de clase, actividades con plantillas, entregas por calificar y seguimiento
- [x] Panel por cargo: indicadores, gráficas, actividad académica, cursos y fichas, inscripciones, mensajes, encuestas, finanzas, configuración de la IA, seguridad y cuentas
- [x] Gerencia con acceso a todas las áreas: supervisa y corrige cursos, admisiones, mensajes, finanzas, actividades y notas de los docentes
- [x] Cuentas: el Gerente crea y elimina cuentas administrativas; Coordinación de admisiones bloquea estudiantes inactivos y los desbloquea
- [x] Asistente conectado a IA real y gratuita (Google Gemini) en `POST /api/chat`, con respuestas locales de respaldo
- [x] Encuestas que guardan respuestas: el estudiante responde en su portal y el panel muestra resultados sin nombres
- [x] Encuesta pública y anónima (`encuesta.html`): cualquier visitante responde sin cuenta y el panel muestra los resultados
- [x] Política de Tratamiento de Datos Personales (`privacidad.html`, Ley 1581 de 2012) y autorización guardada con versión y fecha; los menores de 18 años necesitan la autorización de su acudiente
- [x] Recuperar contraseña por correo y correos de bienvenida, contacto e inscripción (Brevo o SMTP)
- [x] Seguridad: bloqueo por intentos fallidos, sesiones revocables, «Mi cuenta», registro de seguridad, CSP y archivos del servidor privados
- [x] Toda la interfaz en inglés y modo claro u oscuro
- [x] Animación de entrada, revelado al hacer scroll, cifras animadas y transiciones
- [x] Accesibilidad: contraste AA, todo se usa con teclado, foco visible y diálogos propios (Esc cancela)
- [x] Página 404 con la marca (GitHub Pages y servidor)
- [x] Publicación automática del frontend en GitHub Pages con GitHub Actions
- [x] Backend publicado en Render (`https://talento-caribe-api.onrender.com`)
- [ ] Poner `GEMINI_API_KEY` (gratis en https://aistudio.google.com/apikey) en `backend/.env` (sin ella el asistente usa respuestas locales)

## Cuentas de prueba

Las crea `database/seed.sql`. **En la plataforma publicada no funcionan:** al arrancar en producción (`NODE_ENV=production`, como en Render), `npm run db:init` les cambia la contraseña por una al azar, muestra **una sola vez** en los registros (logs) la nueva del administrador y el login deja de mostrar el recuadro «Cuenta de prueba». Así nadie puede entrar al panel con las claves de este README.

| Perfil | Correo | Contraseña | Entra a |
|---|---|---|---|
| Estudiante | estudiante@talentocaribe.co | Estudiante123 | portal.html |
| Docente | docente@talentocaribe.co (también `daniel@`, `valeria@`, `andres@`, `laura@`) | Docente123 | portal.html |
| Administrativo | admin@talentocaribe.co (con cualquier cargo) | Admin123 | admin/panel.html |

Cada rol y cargo recibe del servidor **solo sus datos** (por ejemplo, solo admisiones ve documentos y teléfonos de los estudiantes).

**Flujo de actividades:** el docente publica una actividad en un curso que dicta → la ven los estudiantes con inscripción *aprobada* en ese curso → el estudiante entrega → el docente califica (1.0 a 5.0) con retroalimentación → el estudiante ve su nota.

## Asistente con IA real

`backend/src/rutas/chat.js` recibe la pregunta en `POST /api/chat` y se la envía a **Google Gemini** (`gemini-3.5-flash`, con `gemini-3.5-flash-lite` de respaldo) usando su **plan gratuito**, con unas instrucciones que el servidor arma en cada mensaje:

- **Conoce el negocio:** historia, misión, visión, valores, mentores, cómo inscribirse y contacto de Talento Caribe.
- **Conoce los productos:** los cursos y fichas se leen de PostgreSQL. Si el equipo crea un curso o una ficha en el panel, el asistente lo sabe de inmediato.
- **Usa el tono de la marca:** el tono y el contexto extra los define el gerente en el panel (sección «Configurar IA», tabla `config_ia`).
- **Responde como el negocio:** solo con esa información, sin inventar fechas ni datos, sin pedir contraseñas ni documentos, y sugiere 2 o 3 preguntas para seguir.
- **Seguro y dentro de la cuota gratis:** el rol del usuario sale de su sesión (JWT), no de lo que diga el navegador; máximo 20 mensajes cada 10 minutos por persona y un tope diario (`IA_LIMITE_DIARIO`, 200 por defecto). Si Google corta la cuota, el chat no se rompe: contesta con las respuestas locales y avisa.

1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google (es gratis y **no pide tarjeta**).
2. Pulsa **Create API key** (Crear clave de API) y cópiala completa (según la cuenta empieza por `AQ.` o por `AIza`).
3. Pégala en `backend/.env` y reinicia el servidor (`Ctrl + C` y `npm start`):

```
GEMINI_API_KEY=pega-aquí-tu-clave
```

Sin clave, el chat sigue funcionando con las respuestas locales y muestra «la IA todavía no está configurada». `GET /api/salud` indica si el asistente está conectado.

**Privacidad:** en el plan gratuito, Google puede usar las conversaciones para mejorar sus productos. El asistente pide no compartir contraseñas ni documentos; si más adelante el proyecto consigue recursos, activar la facturación en Google AI Studio quita ese uso. **Cuota:** Google limita los mensajes gratis por minuto y por día y cambia esos números con el tiempo; se consultan en AI Studio.

## Encuestas, correos y recuperar contraseña

| Qué | Cómo funciona |
|---|---|
| Encuestas (`compartido/encuestas.json`) | 5 encuestas por departamento. El estudiante las responde una vez en *Mi espacio → Encuestas* (el menú muestra cuántas le faltan). El panel muestra promedios, barras por opción y comentarios, sin nombres. El servidor valida cada respuesta con el mismo archivo. |
| Recuperar contraseña (`recuperar.html`, `src/paginas/acceso/Recuperar.jsx`) | Desde «¿Olvidaste tu contraseña?» en el ingreso. Llega un enlace al correo que sirve una sola vez y vence en 1 hora; en la base solo se guarda su huella (SHA-256). |
| Correos (`backend/src/correo.js`) | Bienvenida al crear la cuenta, recuperar contraseña, contraseña cambiada, confirmación del formulario de contacto (y copia al equipo con `CORREO_EQUIPO`), solicitud de inscripción recibida y aprobada o no aprobada. |

Para enviar correos de verdad, configura **Brevo** (`BREVO_API_KEY` y `CORREO_REMITENTE`, gratis hasta 300 al día; pasos en [backend/README.md](backend/README.md)). Es la opción que funciona en Render gratis, que bloquea los puertos SMTP. En tu computador también sirve SMTP (ver `backend/.env.ejemplo`). Sin esa configuración los correos no se envían: aparecen en la terminal del servidor, así se puede probar todo en el computador.

> **Si ya tenías la base creada**, ejecuta `npm run db:actualizar` en `backend/`: crea las tablas nuevas, corrige la duración de los cursos y carga respuestas de ejemplo, sin borrar nada.

## Diseño, animaciones e interacción

Todo el sitio (páginas públicas, login, portal y panel) sigue el mismo criterio sobrio: superficies sólidas, bordes finos, un solo color de acción (azul océano) y el naranja del sol reservado para detalles (etiquetas de sección, números de paso, logros). Los títulos de las páginas públicas usan **Source Serif 4** y el texto **Public Sans**; se cargan con `<link>` y `preconnect` en el `<head>` de cada página (`frontend/*.html`). No hay vidrio esmerilado, manchas de color, texto con degradado, brillos ni efectos que sigan al cursor.

Los colores de texto cumplen contraste **WCAG AA** (4,5:1) en los dos temas; se revisó en todas las páginas con un recorrido automático en el navegador.

Las animaciones son cortas y con propósito: orientar al bajar por la página o confirmar una acción. Todas usan solo `transform` y `opacity`, y con «reducir movimiento» activado en el sistema no se muestra ninguna.

| Dónde | Qué pasa |
|---|---|
| Inicio (`src/paginas/inicio/`, `src/estilos/inicio.css`) | Hero con una **vista real del primer módulo** de Lógica de programación; **orientador** de dos preguntas que recomienda un curso con su próximo grupo; **rutas** de Software y Hardware armadas desde el catálogo; el **ritmo de cada módulo** (dos clases de 90 minutos, con la práctica marcada); proceso de inscripción, cursos abiertos, mentores, nosotros, **preguntas frecuentes** (`<details>`), asistente y contacto. |
| Todas las páginas | Revelado suave al hacer scroll (`data-revelar`, `data-escalonar` en los componentes; los anima `src/lib/efectos.js`), cifras que cuentan desde cero, barra superior que se esconde al bajar y vuelve al subir, línea de lectura, fundido corto entre páginas y tarjetas esqueleto mientras cargan los cursos. |
| Entrada (`src/componentes/app/Intro.jsx`, solo portal y panel) | Amanecer en el Caribe con el emblema que vuela hasta el logo de la barra. Una vez por sesión. |
| Plataforma | Cada sección del portal y del panel entra en cascada, los indicadores cuentan, las barras crecen y los anillos de avance se llenan. |

`cursos.html?curso=ID` abre directamente la ficha de un curso (lo usan las rutas, el orientador y los cursos destacados del inicio).

## Datos personales y encuesta pública

| Qué | Cómo funciona |
|---|---|
| Política de datos (`privacidad.html`, `src/paginas/legal/Privacidad.jsx`) | Política de Tratamiento de Datos Personales según la Ley 1581 de 2012 (Colombia). Está enlazada desde el pie de página, el registro, el contacto y la encuesta. **Antes de publicar** revisa que el responsable y el correo (`CORREO_DATOS` en `frontend/src/lib/config.js`) sean reales. |
| Autorización en el registro | Para crear la cuenta hay que marcar la autorización. El servidor (`POST /api/auth/registro`) la exige y guarda en `usuarios` la versión de la política (`consentimiento_version`) y la fecha (`consentimiento_en`). Si la persona es menor de 18 años, también exige la autorización y los datos de su madre, padre o acudiente. |
| Contacto | `POST /api/contacto` exige la casilla de aceptación y guarda la versión de la política en `mensajes_contacto.politica_version`. |
| Encuesta pública (`encuesta.html`, `src/paginas/legal/Encuesta.jsx`) | Cualquier visitante responde sin cuenta y sin dar su nombre. `POST /api/encuestas/:id/respuestas-publicas` valida las respuestas con `compartido/encuestas.json` y las guarda en PostgreSQL sin ningún dato de quien responde (máximo 5 envíos cada 10 minutos por conexión). El panel las muestra agrupadas junto a las de los estudiantes, en la sección **Encuestas**. |

Si cambias el texto de la política, sube `POLITICA_VERSION` en `frontend/src/lib/config.js` y en `backend/src/validar.js`. Si ya tenías la base creada, `npm run db:actualizar` agrega las columnas nuevas sin borrar nada.

## Seguridad

Con el servidor, la plataforma se protege así (detalle en [backend/README.md](backend/README.md#seguridad)):

- **Contraseñas** cifradas con bcrypt, de 8 caracteres o más con letras y números y fuera de las más comunes. Cada persona puede cambiarla desde **Mi cuenta** (portal y panel) escribiendo la actual, y cerrar su sesión en todos los equipos.
- **Sesiones revocables**: cambiar o recuperar la contraseña anula al instante las sesiones abiertas en otros equipos.
- **Contra la fuerza bruta**: tras varios intentos fallidos se bloquean por 15 minutos la conexión y la cuenta atacada; registro, contacto, recuperación y asistente IA tienen límites de uso.
- **Registro de seguridad** en el panel (sección **Seguridad**, para gerencia, dirección general y tecnología): ingresos, fallos, bloqueos y conexiones sospechosas.
- **Navegador blindado**: una política CSP solo deja ejecutar los scripts del propio sitio, la página no se puede meter en iframes y todo texto de la base se escapa antes de mostrarse.
- **Archivos privados**: el servidor solo publica el React compilado (`frontend/dist`); el código del servidor y los scripts SQL no se pueden descargar.
- **React escapa todo el texto** que pinta (nombres, respuestas, mensajes): un dato malicioso guardado en la base no puede convertirse en código.

La política CSP también va como etiqueta `<meta>` en cada página (GitHub Pages no permite cabeceras propias): la agrega `frontend/vite.config.js` al compilar (en `npm run dev` no se pone, porque Vite necesita sus propios scripts para recargar al instante). Si publicas la API en un dominio que no termine en `onrender.com`, agrégalo a `connect-src` en la constante `CSP` de ese archivo.

## Publicar el proyecto

**1. Subir a GitHub.** Por cada cambio con sentido (un arreglo, una sección, una función): `git add .`, `git commit -m "Qué cambió"` y `git push`. `backend/.env`, `node_modules` y `frontend/dist` no se suben (están en `.gitignore`).

**2. Frontend en GitHub Pages (con GitHub Actions).** Como React se compila, GitHub Pages ya no publica la carpeta del repositorio tal cual: lo hace la acción `.github/workflows/pages.yml`, que en cada `push` a `main` ejecuta `npm ci` y `npm run build` en `frontend/` y publica `frontend/dist`. **Configuración única:** en GitHub → *Settings → Pages → Build and deployment → Source* elige **GitHub Actions**. La página queda en `https://josrcs.github.io/talento-caribe/` y cada publicación se ve en la pestaña *Actions*. Cambia `josrcs` por tu usuario en las etiquetas `og:` de `frontend/index.html` y `frontend/cursos.html` para que se vea la imagen al compartir el enlace.

**3. Backend en Render.** En https://render.com: *New → Blueprint* → elige el repositorio. `render.yaml` crea la base PostgreSQL y el servidor, y te pide:
- `GEMINI_API_KEY`: la clave gratuita del asistente (https://aistudio.google.com/apikey).
- `CORS_ORIGENES`: `https://josrcs.github.io`
- `SITIO_URL`: la dirección de la página en GitHub Pages (para los enlaces de los correos), y los datos de Brevo (`BREVO_API_KEY`, `CORREO_REMITENTE`); puedes dejarlos vacíos al principio.

La dirección del backend está en `API_PUBLICADA` de `frontend/src/lib/config.js` (o en la variable `VITE_API_URL`, ver `frontend/.env.ejemplo`). El plan gratis de Render se duerme tras 15 minutos sin uso: la primera petición tarda alrededor de un minuto mientras despierta (mientras tanto la página muestra las tarjetas de carga; si se agota la espera, aparece un botón para reintentar). Abre la página un minuto antes de presentarla. La base gratis de Render vence a los 30 días; para una base permanente puedes usar Neon o Supabase con `DATABASE_SSL=true`.

**Primer ingreso al panel publicado:** en Render abre el servicio `talento-caribe-api` → **Logs** y busca `🔐 Contraseña nueva del administrador`. Entra con `admin@talentocaribe.co` y esa contraseña, y cámbiala en **Mi cuenta**. Si la pierdes: en **Environment** agrega `ADMIN_CLAVE_NUEVA` con una contraseña segura, guarda (Render reinicia solo), ingresa con ella y **borra la variable** después.

**4. Después de la presentación.** En Render → el servicio → *Shell*: `npm run cuenta -- clave admin@talentocaribe.co` (genera una contraseña segura y la muestra una vez), `npm run cuenta -- desactivar estudiante@talentocaribe.co` o `npm run cuenta -- lista`.

## Idioma, tema y animación de entrada

| Archivo | Qué hace |
|---|---|
| `src/i18n/idioma.js` | Aplica el tema y el idioma antes de montar React. En inglés, un `MutationObserver` traduce lo que React pinta (textos y atributos) con el diccionario; React compara con sus propios datos, así que lo traducido no se pierde al volver a pintar. Exporta `t()` para frases con variables. |
| `src/i18n/diccionario-en.js` | Diccionario español → inglés. `#` = cualquier número. `TC_EN_PATRONES` cubre frases con nombres. |
| `src/i18n/diccionario-en-cursos.js` | Diccionario del plan de cursos (módulos, temas, actividades, evidencias y guía de clase). |
| `src/componentes/Preferencias.jsx` | Botones ☀/🌙 y ES/EN. |
| `src/componentes/app/Intro.jsx` | Animación de entrada del portal y el panel. Una vez por sesión (o con `?intro`); se salta con clic, rueda del mouse o Esc; respeta "reducir movimiento". |
| `src/estilos/tema.css` | Paletas: oscuro (azul tinta) y claro (papel cálido). |

- Para traducir un texto nuevo, agrega `"Texto en español": "English text"` en `src/i18n/diccionario-en.js`. Escribe cada frase completa en un solo texto (por ejemplo ``{`${n} cursos encontrados`}``): si se parte en varios pedazos, el diccionario no la reconoce.
- El contenido escrito por personas (respuestas, mensajes del chat) lleva `data-no-traducir` y no se modifica.

## Módulos y fichas

| Concepto | Qué es | Dónde se define |
|---|---|---|
| **Módulo** | Parte de un curso (2 semanas) con sus temas, la actividad del plan y la evidencia que se entrega. Los 96 módulos (8 por curso, 16 semanas) vienen del documento *Plan de cursos y clases desarrolladas*. | `compartido/cursos.json` (propiedad `modulos` de cada curso) y, con el servidor, la tabla `cursos`. Si no existe, se arma desde `temario` (`modulosDe` en `frontend/src/lib/cursos.js`): cada línea es un módulo. En el panel: «Nombre del módulo: tema 1, tema 2». |
| **Ficha** | Grupo de un curso con número propio, jornada, fecha de inicio, cupos y estado. | `fichas` en `compartido/cursos.json` (datos iniciales); en el panel → Cursos → Fichas. Se guardan en la tabla `fichas`. |

- **Estudiante:** en el catálogo elige la ficha (solo las que tienen *Inscripciones abiertas*). En *Mis cursos* ve su avance en cada módulo.
- **Guía de clase:** en *Mis cursos*, cada módulo muestra al docente sus dos sesiones de 90 minutos (inicio, desarrollo, modelado, práctica, cierre, reto, revisión entre pares y entrega), la forma de trabajo según la modalidad y las normas de seguridad. El botón *Publicar la actividad de este módulo* deja la actividad lista para revisar y publicar.
- **Docente:** al publicar una actividad elige el **módulo** y la **ficha** (o *todas las fichas*). En *Seguimiento* ve una tabla por ficha: cada estudiante × cada módulo, con porcentaje de entregas; tocando un estudiante ve el detalle y puede calificar.
- **Búsqueda por ficha:** en el catálogo (`cursos.html?ficha=25896`), en Seguimiento del docente y en Inscripciones del panel.

Formato de los módulos de un curso en `compartido/cursos.json`:

```json
"modulos": [
  { "titulo": "Fundamentos", "temas": ["Variables", "Tipos de datos"], "actividades": ["Taller: mi primera variable"] },
  { "titulo": "Decisiones", "temas": ["Condicionales", "Ciclos"], "actividades": ["Quiz de condicionales"] }
]
```

Después de cambiar ese archivo, regenera los datos de PostgreSQL con `node scripts/generar-seed.js` (en `backend/`) y luego `npm run db:reiniciar`.

> **Si ya tenías la base creada:** las tablas cambiaron (nueva tabla `fichas` y columnas `modulos`, `ficha_id` y `modulo`). Ejecuta `npm run db:reiniciar` en `backend/` (borra los datos de prueba y los vuelve a crear).
