/* PanelContexto.jsx - Lo que comparten las secciones del panel: sesión, perfil del cargo,
   navegación y utilidades del catálogo visible para el área del cargo. */
import { createContext, useContext } from "react";

export const PanelContexto = createContext(null);
export const usePanel = () => useContext(PanelContexto);
