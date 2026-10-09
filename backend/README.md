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

## Asistente con IA (Claude)

Agrega tu clave en `backend/.env` y reinicia el servidor (`Ctrl + C` y `npm start`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Al encender verás `Asistente IA: ✅ conectado a Claude`. Sin la clave el chat responde con reglas locales. Opcional: `IA_MODELO=` para usar otro modelo (por defecto `claude-opus-5-5`).

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
| POST | `/api/contacto` | todos | Mensaje del formulario de contacto |
| POST | `/api/chat` | todos (máx. 20 mensajes / 10 min) | Asistente con IA: conoce la marca, el catálogo y las fichas; usa el tono de `config_ia` |
| POST | `/api/auth/registro` | todos | Crea cuenta de estudiante (clave cifrada con bcrypt) y devuelve el token |
| POST | `/api/auth/login` | todos | Inicio de sesión de estudiantes, docentes y administrativos |
| GET · PUT | `/api/auth/yo` · `/api/auth/perfil` | 🔒 | Ver / completar el perfil |
| GET | `/api/datos` | todos | Lo que el usuario puede ver según su rol y cargo |
| POST | `/api/inscripciones` | 🔒 estudiante | Solicitar cupo en un curso |
| PATCH | `/api/inscripciones/:id` | 🔒 admisiones | Aprobar o rechazar |
| GET | `/api/estudiantes/:correo` | 🔒 admisiones | Ficha completa del estudiante |
| POST · PUT · DELETE | `/api/actividades/:id?` | 🔒 docente del curso | Crear, editar y borrar actividades |
| PUT | `/api/actividades/:id/entrega` | 🔒 estudiante aprobado | Entregar (o corregir antes de la nota) |
| PATCH | `/api/entregas/:id` | 🔒 docente del curso | Calificar (1.0 a 5.0) con retroalimentación |
| POST · PUT | `/api/cursos/:id?` | 🔒 cargos académicos | Crear y editar cursos |
| PATCH | `/api/mensajes/:id/leido` | 🔒 admisiones / comunicaciones | Marcar mensaje como leído |
| POST | `/api/gastos` | 🔒 finanzas | Registrar un gasto |
| PUT | `/api/config-ia` | 🔒 gerente | Tono y contexto del asistente |

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
| Al entrar te devuelve al login | La sesión dura 8 horas; vuelve a iniciar sesión. Si pasa cada vez que reinicias el servidor, falta `JWT_SECRETO` en `.env`. |
| `no existe la columna «modulos»` | Ejecuta `npm run db:actualizar` (no borra datos). |
| El chat dice «la IA todavía no está configurada» | Falta `ANTHROPIC_API_KEY` en `.env`, o reinicia el servidor después de agregarla. |
| `EADDRINUSE :::3000` | Ya hay un servidor encendido en otra terminal. Ciérralo o cambia `PORT` en `.env`. |
| `'npm' no se reconoce` | Reinstala Node.js y abre una terminal nueva. |
| PowerShell: `la ejecución de scripts está deshabilitada` | Usa la terminal **Command Prompt** (cmd) en VS Code, o ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |

## Seguridad

- `backend/.env` tiene tu contraseña: **nunca** lo subas a GitHub (ya está en `.gitignore`).
- El servidor no publica las carpetas `backend/` ni `database/`.
- Las consultas usan parámetros (`$1, $2…`), lo que evita la inyección SQL.
- Las contraseñas se guardan cifradas con bcrypt: ni tú puedes leerlas en pgAdmin.
- Los permisos (quién ve y cambia qué) se revisan en el servidor en cada petición.
