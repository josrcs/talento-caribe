/* ganchos.js - Hooks de React reutilizables */
import { useEffect, useRef, useState } from "react";
import { datosListos, revelar } from "./plataforma.js";

/* Devuelve true cuando los datos de la plataforma están listos (catálogo, fichas y, con API, lo del servidor) */
export function useDatosListos() {
  const [listos, setListos] = useState(false);
  useEffect(() => {
    let activo = true;
    datosListos().then(() => activo && setListos(true));
    return () => { activo = false; };
  }, []);
  return listos;
}

/* Ref para un contenedor: lo que tenga data-revelar dentro aparece con animación al hacer scroll.
   `dependencias` vuelve a revisar cuando cambian (por ejemplo, la lista filtrada del catálogo). */
export function useRevelar(dependencias = []) {
  const ref = useRef(null);
  useEffect(() => { revelar(ref.current); }, dependencias); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

/* Abre o cierra un <dialog> según `abierto`. Devuelve la ref para el elemento <dialog>. */
export function useDialogo(abierto, alCerrar) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Esc y clic en el fondo oscuro también cierran
    const cerrar = () => alCerrar();
    const clicFondo = (e) => { if (e.target === d) alCerrar(); };
    d.addEventListener("close", cerrar);
    d.addEventListener("click", clicFondo);
    return () => { d.removeEventListener("close", cerrar); d.removeEventListener("click", clicFondo); };
  }, [alCerrar]);
  return ref;
}
