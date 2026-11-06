/* montar.jsx - Arranca una página React.
   Espera a que el documento termine de cargar: así ya corrieron los scripts compartidos
   que van con defer (efectos.js, asistente-global.js) y i18n.js tradujo lo inicial.
   Luego muestra el componente dentro de <div id="raiz">. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

export function montarPagina(Pagina) {
  const iniciar = () => {
    const contenedor = document.getElementById("raiz");
    if (!contenedor) return;
    createRoot(contenedor).render(
      <StrictMode>
        <Pagina />
      </StrictMode>,
    );
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
}
