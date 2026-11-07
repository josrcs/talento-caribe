/* ==========================================================
   montar.jsx - Monta una página de React en <div id="root">
   Todas las páginas comparten:
   - <DatosProvider>: los datos de la API (GET /api/datos) y las acciones.
   - <Avisos /> y <Confirmacion />: mensajes breves y confirmaciones.
   - Los efectos visuales de src/lib/efectos.js.
   Cada entrada (src/entradas/*.jsx) importa primero src/i18n/idioma.js
   para aplicar el idioma y el tema antes de pintar.
   ========================================================== */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DatosProvider } from "../contexto/Datos.jsx";
import Avisos from "../componentes/Avisos.jsx";
import Confirmacion from "../componentes/Confirmacion.jsx";
import { iniciarEfectos } from "./efectos.js";

export function montar(pagina, { cargarDatos = true } = {}) {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <DatosProvider cargar={cargarDatos}>
        {pagina}
        <Avisos />
        <Confirmacion />
      </DatosProvider>
    </StrictMode>,
  );
  setTimeout(iniciarEfectos);
}
