# Servidor de Talento Caribe (Node + Express + PostgreSQL)

Un solo servidor sirve **la página web** y **la API** conectada a PostgreSQL.
Después de seguir estos pasos abres `http://localhost:3000` y listo.

## Requisitos (una sola vez)

1. **Node.js** 18 o superior → https://nodejs.org (versión LTS). Comprueba con `node -v`.
2. **PostgreSQL** → https://www.postgresql.org/download/windows/
   Durante la instalación **anota la contraseña** del usuario `postgres`. Deja el puerto 5432.

## Pasos

Abre una terminal (en VS Code: *Terminal → New Terminal*) dentro de la carpeta `backend`:

```bash
cd backend
npm install
```

Copia el archivo de configuración y pon tu contraseña:

```bash
copy .env.ejemplo .env
```

Abre `backend/.env` y cambia `TU_CONTRASEÑA` por la clave de `postgres`:

```
DATABASE_URL=postgresql://postgres:miClave123@localhost:5432/talento_caribe
```

Crea la base de datos, las tablas y los 12 cursos (no necesitas `psql`):

```bash
npm run db:init
```

Enciende el servidor:

```bash
npm start
```

Verás:

```
🌴 Talento Caribe en http://localhost:3000
   API:    http://localhost:3000/api/salud
   Base de datos: ✅ conectada
```

Abre **http://localhost:3000** en el navegador. Para apagar el servidor: `Ctrl + C`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Enciende el servidor |
| `npm run dev` | Igual, pero se reinicia solo cuando guardas cambios en el servidor |
| `npm run db:init` | Crea la base, las tablas y los datos iniciales (si ya existen, no toca nada) |
| `npm run db:actualizar` | Agrega lo que falte de versiones nuevas (módulos, guía, fichas) **sin borrar** cuentas, actividades ni entregas |
| `npm run db:reiniciar` | **Borra** todas las tablas y las crea de nuevo (pierdes los datos guardados) |
| `npm run cuenta -- lista` | Muestra las cuentas con su rol y si están activas |
| `npm run cuenta -- clave <correo>` | Pone una contraseña nueva y segura a esa cuenta (la muestra una sola vez) y cierra sus sesiones. Con `clave <correo> "MiClave2026"` usa la que escribas |
| `npm run cuenta -- desactivar <correo>` | La cuenta ya no puede ingresar (`activar` la habilita de nuevo) |
| `npm run pruebas:crear` | Crea (o vuelve a crear desde cero) una **base de pruebas aparte**, `talento_caribe_pruebas`, con los datos iniciales y cuentas para ensayar bloqueos y cuentas administrativas. La base de siempre no se toca |
| `npm run pruebas` | Enciende el servidor con la base de pruebas → **http://localhost:3001** (puede estar encendido a la vez que `npm start`) |
| `npm run pruebas:cuenta -- lista` | `npm run cuenta` sobre la base de pruebas |

### Base de pruebas: cuentas, bloqueos y cuentas administrativas

Para probar sin ensuciar tus datos: `npm run pruebas:crear` y luego `npm run pruebas`. Además de las cuentas del README principal, trae:

| Cuenta | Contraseña | Para probar |
|---|---|---|
| gerente.prueba@talentocaribe.co | Admin123 | Cargo fijo Gerente: sección «Cuentas» → crear y eliminar cuentas administrativas |
| admisiones.prueba@talentocaribe.co | Admin123 | Cargo fijo Coordinador(a) de admisiones: bloquear y desbloquear estudiantes |
| finanzas.prueba@talentocaribe.co | Admin123 | Cargo fijo sin permiso de cuentas (no ve esa sección) |
| pedro.inactivo@correo.com · ana.inactiva@correo.com | Estudiante123 | 120 y 35 días sin ingresar: se pueden bloquear |
| valentina.reciente@correo.com | Estudiante123 | 2 días sin ingresar: el bloqueo se rechaza |
| carlos.bloqueado@correo.com | Estudiante123 | Ya bloqueado: al ingresar ve el aviso hasta que lo desbloqueen |

Para volver a empezar, `npm run pruebas:crear` borra solo la base de pruebas y la arma de nuevo.

## Asistente con IA (Claude)

Agrega tu clave en `backend/.env` y reinicia el servidor (`Ctrl + C` y `npm start`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Al encender verás `Asistente IA: ✅ conectado a Claude`. Sin la clave el chat responde con reglas locales. Opcional: `IA_MODELO=` para usar otro modelo (por defecto `claude-haiku-5-5`, rápido y económico).

## Correos (opcional)

Para que lleguen los correos de bienvenida, recuperar contraseña y avisos de inscripción, agrega en `.env` los datos de un servidor SMTP (ver `.env.ejemplo`). Con Gmail: activa la verificación en 2 pasos, crea una *contraseña de aplicación* en https://myaccount.google.com/apppasswords y úsala en `SMTP_CLAVE`. Al encender verás `Correo: ✅ SMTP configurado`. Sin esos datos, cada correo aparece en esta terminal (sirve para probar).

## ¿Ya tenías la base creada de antes?

Si el portal muestra errores y la terminal dice `no existe la columna «modulos»`, tu base es de una versión anterior. Ponla al día **sin perder datos**:

```bash
npm run db:actualizar
```

Si la base es todavía más antigua (sin usuarios, actividades ni entregas) y `npm run db:init` te avisa que la base es antigua:

1. En `backend/.env` agrega una línea con una frase secreta larga (firma las sesiones):
   ```
   JWT_SECRETO=escribe-aqui-una-frase-larga-y-dificil-de-adivinar
   ```
2. Instala las librerías nuevas y reinicia la base (**borra los datos de prueba anteriores**):
   ```bash
   npm install
   npm run db:reiniciar
   npm start
   ```

## Rutas de la API

🔒 = necesita sesión (cabecera `Authorization: Bearer <token>`, la pone el frontend solo).

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| GET | `/api/salud` | todos | Estado del servidor y de la base de datos |
| GET | `/api/cursos` · `/api/cursos/:id` | todos | Catálogo |
| POST | `/api/contacto` | todos (máx. 5 / 15 min) | Mensaje del formulario de contacto |
| POST | `/api/chat` | todos (máx. 20 mensajes / 10 min por conexión y `IA_LIMITE_DIARIO` al día en total) | Asistente con IA: conoce la marca, el catálogo y las fichas; usa el tono de `config_ia` |
| POST | `/api/auth/recuperar` | todos (máx. 5 / 15 min) | Envía al correo un enlace para crear una contraseña nueva (misma respuesta exista o no la cuenta) |
| POST | `/api/auth/restablecer` | todos (máx. 10 / 15 min) | Cambia la contraseña con el enlace (un solo uso, vence en 1 hora) y cierra las sesiones abiertas |
| POST | `/api/encuestas/:id/respuestas` | 🔒 estudiante | Guarda las respuestas de una encuesta (una vez por encuesta) |
| POST | `/api/auth/registro` | todos (máx. 5 / hora) | Crea cuenta de estudiante (clave cifrada con bcrypt) y devuelve el token |
| POST | `/api/auth/login` | todos (ver «Seguridad») | Inicio de sesión de estudiantes, docentes y administrativos |
| PUT | `/api/auth/clave` | 🔒 | Cambiar la contraseña con la actual; cierra las sesiones de los demás equipos y devuelve un token nuevo |
| POST | `/api/auth/cerrar-sesiones` | 🔒 | Cierra la sesión en todos los equipos |
| GET · PUT | `/api/auth/yo` · `/api/auth/perfil` | 🔒 | Ver / completar el perfil |
| GET | `/api/datos` | todos | Lo que el usuario puede ver según su rol y cargo |
| POST | `/api/inscripciones` | 🔒 estudiante | Solicitar cupo en un curso |
| PATCH | `/api/inscripciones/:id` | 🔒 admisiones y gerente | Aprobar o rechazar |
| GET | `/api/estudiantes/:correo` | 🔒 admisiones y gerente | Ficha completa del estudiante |
| POST · PUT · DELETE | `/api/actividades/:id?` | 🔒 docente del curso (el gerente puede editar y borrar las de cualquier docente) | Crear, editar y borrar actividades |
| PUT | `/api/actividades/:id/entrega` | 🔒 estudiante aprobado | Entregar (o corregir antes de la nota) |
| PATCH | `/api/entregas/:id` | 🔒 docente del curso o gerente | Calificar (1.0 a 5.0) con retroalimentación, o corregir la nota |
| POST · PUT | `/api/cursos/:id?` | 🔒 cargos académicos | Crear y editar cursos |
| PATCH | `/api/mensajes/:id/leido` | 🔒 admisiones / comunicaciones / gerente | Marcar mensaje como leído |
| POST · PUT · DELETE | `/api/gastos/:id?` | 🔒 finanzas y gerente | Registrar, corregir y eliminar gastos (pesos enteros de 1 a 1.000.000.000) |
| GET · POST · DELETE | `/api/cuentas/equipo/:id?` | 🔒 gerente | Ver, crear (con contraseña temporal que se muestra una vez) y eliminar cuentas administrativas. No deja borrar la propia ni la última que puede entrar como Gerente |
| GET | `/api/cuentas/estudiantes` | 🔒 coordinación de admisiones y gerente | Estudiantes con su último ingreso y días sin uso |
| POST | `/api/cuentas/estudiantes/:id/bloquear` · `/bloquear-inactivas` | 🔒 coordinación de admisiones y gerente | Bloquear una cuenta o todas las que no ingresan hace N días (mínimo 30). Cierra sus sesiones y avisa por correo |
| POST | `/api/cuentas/estudiantes/:id/desbloquear` | 🔒 coordinación de admisiones y gerente | Desbloquear en cualquier momento; la inactividad se vuelve a contar desde ese día |
| PUT | `/api/config-ia` | 🔒 gerente | Tono y contexto del asistente |
| GET | `/api/seguridad/eventos?tipo=` | 🔒 gerencia, dirección general y tecnología | Registro de seguridad: últimos 200 eventos, resumen de 24 horas y conexiones con muchos fallos |

Para ver lo que se guarda: pgAdmin → `talento_caribe` → Query Tool, por ejemplo
`SELECT nombre, correo, rol FROM usuarios;` o `SELECT * FROM vista_resumen_cursos;`.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| `La contraseña del usuario postgres no es correcta` | Revisa `DATABASE_URL` en `backend/.env`. Si la clave tiene `@`, `#` o `/`, escríbela codificada (`@` → `%40`, `#` → `%23`, `/` → `%2F`). |
| `PostgreSQL no está encendido` | Windows → busca **Servicios** → `postgresql-x64-16` (o tu versión) → *Iniciar*. |
| `faltan las tablas` | Ejecuta `npm run db:init`. |
| `la base es de una versión anterior` | Sigue la sección «¿Ya tenías la base creada de antes?». |
| `Cannot find module 'bcryptjs'` | Ejecuta `npm install` dentro de `backend`. |
| Al entrar te devuelve al login | La sesión dura 8 horas; vuelve a iniciar sesión. También pasa si la contraseña cambió o se cerraron las sesiones desde otro equipo. Si pasa cada vez que reinicias el servidor, falta `JWT_SECRETO` en `.env`. |
| `Demasiados intentos fallidos` | Es el bloqueo contra ataques: espera 15 minutos o recupera la contraseña. Mientras pruebas en tu computador también se quita al reiniciar el servidor. |
| `JWT_SECRETO falta o es débil` (el servidor no arranca) | En producción se exige un secreto de 32 caracteres o más que no sea el del ejemplo. Genera uno con el comando que muestra el mensaje. |
| `no existe la columna «sesiones_desde»` | Ejecuta `npm run db:actualizar` (no borra datos). |
| `no existe la columna «modulos»` | Ejecuta `npm run db:actualizar` (no borra datos). |
| El chat dice «la IA todavía no está configurada» | Falta `ANTHROPIC_API_KEY` en `.env`, o reinicia el servidor después de agregarla. |
| `EADDRINUSE :::3000` | Ya hay un servidor encendido en otra terminal. Ciérralo o cambia `PORT` en `.env`. |
| `'npm' no se reconoce` | Reinstala Node.js y abre una terminal nueva. |
| PowerShell: `la ejecución de scripts está deshabilitada` | Usa la terminal **Command Prompt** (cmd) en VS Code, o ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |

## Seguridad

**Datos y secretos**
- `backend/.env` tiene tus claves: **nunca** lo subas a GitHub (ya está en `.gitignore`). En producción el servidor no arranca si `JWT_SECRETO` falta, es corto o es el del ejemplo: con un secreto conocido cualquiera podría fabricar una sesión de administrador.
- El servidor publica **solo** lo que está en una lista blanca: las páginas (`index`, `cursos`, `portal`, `registro`, `recuperar`) y las carpetas `css`, `js`, `assets` y `admin`. El código del servidor, `database/`, el README y los archivos de configuración no se pueden descargar, ni siquiera escribiendo la ruta de otra forma (`/%62ackend/...`).
- Las consultas usan parámetros (`$1, $2…`), lo que evita la inyección SQL. Ninguna consulta puede tardar más de 15 segundos.
- Los permisos (quién ve y cambia qué) se revisan en el servidor en cada petición. Un cargo de un área no puede tocar cursos ni fichas de otra.

**Contraseñas y sesiones**
- Se guardan cifradas con bcrypt: ni tú puedes leerlas en pgAdmin.
- Deben tener 8 a 72 caracteres, letras y números, y no pueden ser de las más comunes ni contener el correo.
- La sesión es un token JWT firmado (solo HS256) que dura 8 horas. Cada petición revisa en la base que la cuenta siga activa y que el token tenga la **versión de sesión** vigente: cambiar o recuperar la contraseña, o usar «Cerrar sesión en todos los equipos» (botón **Mi cuenta**), anula al instante los tokens de los demás equipos.
- Los enlaces para recuperar la contraseña sirven una vez, vencen en 1 hora y en la base solo se guarda su huella SHA-256.

**Contra ataques automáticos**
- Inicio de sesión: una conexión con 10 intentos fallidos en 15 minutos queda bloqueada 15 minutos; una cuenta con 8 fallos también (venga de donde venga el ataque); y nadie puede hacer más de 30 intentos cada 15 minutos. La respuesta es la misma, y tarda lo mismo, exista o no el correo.
- Límites por conexión en registro (5 por hora), contacto (5 cada 15 min), recuperar contraseña y asistente IA, más un límite general de 300 peticiones por minuto a la API. El asistente además tiene un tope diario (`IA_LIMITE_DIARIO`) para que la factura de la IA no se dispare.
- Los nombres, asuntos y títulos no aceptan saltos de línea ni caracteres de control (evita inyectar cabeceras en los correos). El correo de confirmación del contacto tiene un asunto fijo.

**En el navegador**
- Cabeceras HTTP: `Content-Security-Policy` (solo se ejecutan scripts del propio sitio, así un texto malicioso guardado en la base no puede robar sesiones), `X-Frame-Options: DENY` (nadie puede meter la página en un iframe), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y, en producción, HSTS. Las respuestas de la API no se guardan en caché.
- Todo el texto que viene de la base se escapa antes de mostrarse.

**Registro de seguridad.** Ingresos, intentos fallidos, bloqueos, cuentas nuevas y cambios de contraseña quedan en la tabla `eventos_seguridad` (90 días, sin contraseñas). Gerencia, dirección general y dirección de tecnología los ven en el panel, sección **Seguridad**, con las conexiones sospechosas destacadas.

**Antes de publicar**
- Las cuentas de prueba tienen contraseñas públicas (están en el README). Después de la presentación, cámbialas o desactívalas con `npm run cuenta`; la cuenta `admin@` puede elegir cualquier cargo, incluido Gerente.
- Los límites se cuentan en la memoria del servidor: se reinician si el servidor se reinicia (suficiente para un solo servidor como el de Render).
