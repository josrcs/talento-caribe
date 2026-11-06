/* ==========================================================
   vite.config.js - Construcción del frontend de Talento Caribe
   - El sitio público está hecho en React: inicio, catálogo de cursos,
     registro, recuperar contraseña y la página 404 (src/paginas/*).
   - El portal del estudiante y el panel administrativo siguen en
     JavaScript sin framework (js/*, portal.html y admin/*): se copian
     tal cual a dist/ para que todo quede publicado junto.
   npm run dev    -> http://localhost:5173 (modo demostración, recarga al guardar)
   npm run build  -> dist/ (lo que se publica en GitHub Pages y lo que sirve el backend)
   ========================================================== */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const raiz = import.meta.dirname;

// Páginas hechas con React (cada una tiene su punto de entrada en src/paginas/)
const PAGINAS_REACT = ["index", "cursos", "registro", "recuperar", "404"];

// Lo que no pasa por Vite y se copia tal cual: scripts compartidos, estilos, imágenes y las páginas sin React
const COPIAR = ["js", "css", "assets", "admin", "portal.html"];

/* Copia a dist/ lo que usan las páginas sin React (y los scripts compartidos que cargan las de React) */
function copiarSitioSinReact() {
  return {
    name: "talento-caribe:copiar-sitio",
    apply: "build",
    closeBundle() {
      for (const ruta of COPIAR) {
        const origen = resolve(raiz, ruta);
        if (existsSync(origen)) cpSync(origen, resolve(raiz, "dist", ruta), { recursive: true });
      }
    },
  };
}

/* En desarrollo, la recarga en vivo de React necesita un script en línea y una conexión WebSocket.
   La política de seguridad (CSP) de las páginas lo prohíbe: solo mientras se desarrolla se le permite.
   La versión publicada (npm run build) conserva la política estricta. */
function cspDeDesarrollo() {
  return {
    name: "talento-caribe:csp-desarrollo",
    apply: "serve",
    transformIndexHtml(html) {
      return html
        .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
        .replace("connect-src 'self'", "connect-src 'self' ws: wss:");
    },
  };
}

export default defineConfig({
  // Rutas relativas: el mismo resultado funciona en GitHub Pages (/talento-caribe/) y en el servidor (/)
  base: "./",
  plugins: [react(), copiarSitioSinReact(), cspDeDesarrollo()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Los archivos que genera Vite van en dist/app/ (assets/ ya es la carpeta de imágenes del proyecto)
    assetsDir: "app",
    rollupOptions: {
      input: Object.fromEntries(PAGINAS_REACT.map((p) => [p, resolve(raiz, `${p}.html`)])),
    },
  },
  server: { port: 5173, open: false },
});
