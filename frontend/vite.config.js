/* ==========================================================
   vite.config.js - Construcción del frontend en React
   - Varias páginas (index.html, cursos.html, admin/login.html...): cada una
     monta su propio componente de React. Así las direcciones son las mismas de
     siempre y los enlaces de los correos (recuperar.html?token=...) siguen sirviendo.
   - base "./": rutas relativas, para que funcione igual en GitHub Pages
     (josrcs.github.io/talento-caribe/) y servido por el backend (localhost:3000).
   - npm run dev: las peticiones a /api se envían al backend (localhost:3000).
   ========================================================== */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const raiz = import.meta.dirname;
const paginas = ["index", "cursos", "registro", "recuperar", "portal", "404", "admin/login", "admin/panel"];

/* Política de seguridad (CSP): el navegador solo ejecuta scripts de este sitio y solo se conecta a la API.
   Se agrega al construir (en desarrollo Vite necesita scripts propios para recargar al instante). */
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://localhost:3000 https://*.onrender.com; object-src 'none'; base-uri 'self'; form-action 'self'";
/* 404.html: GitHub Pages la muestra en cualquier dirección que no existe (también /talento-caribe/admin/algo),
   así que sus enlaces necesitan una base fija. Si el repositorio cambia de nombre, cambia BASE_404. */
const BASE_404 = process.env.VITE_BASE_404 || "/talento-caribe/";
const politicaSeguridad = {
  name: "politica-de-seguridad",
  apply: "build",
  transformIndexHtml: (html, ctx) => html.replace("<head>", `<head>\n  <meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    (ctx.filename.endsWith("404.html") ? `\n  <base href="${BASE_404}">` : "")),
};

export default defineConfig({
  base: "./",
  plugins: [react(), politicaSeguridad],
  build: {
    outDir: "dist",
    assetsDir: "static",
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(paginas.map((p) => [p, resolve(raiz, `${p}.html`)])) },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3000" },
  },
  preview: { port: 4173, proxy: { "/api": "http://localhost:3000" } },
});
