/* PortalContexto.jsx - Lo que comparten las secciones y ventanas del portal:
   la sesión, el rol, la navegación entre secciones, los filtros y las acciones que abren ventanas. */
import { createContext, useContext } from "react";

export const PortalContexto = createContext(null);
export const usePortal = () => useContext(PortalContexto);
