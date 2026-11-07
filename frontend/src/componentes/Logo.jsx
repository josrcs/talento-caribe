/* Logo.jsx - Logo según el tema: las versiones "claras" son para fondo oscuro y las de color para fondo claro.
   <Logo tipo="emblema" />  ·  tipo: "emblema", "emblema-hd", "completo" o "completo-sm" */
import { useEffect, useState } from "react";
import { temaActual } from "../i18n/idioma.js";
import emblema from "../assets/img/logo-emblema.png";
import emblemaColor from "../assets/img/logo-emblema-color.png";
import emblemaHd from "../assets/img/logo-emblema-hd.png";
import emblemaHdColor from "../assets/img/logo-emblema-hd-color.png";
import completo from "../assets/img/logo-talento-caribe-claro.png";
import completoColor from "../assets/img/logo-talento-caribe.png";
import completoSm from "../assets/img/logo-talento-caribe-claro-sm.png";
import completoSmColor from "../assets/img/logo-talento-caribe-sm.png";

const LOGOS = {
  emblema: [emblema, emblemaColor],
  "emblema-hd": [emblemaHd, emblemaHdColor],
  completo: [completo, completoColor],
  "completo-sm": [completoSm, completoSmColor],
};

/* Tema actual ("oscuro" o "claro"); se actualiza al cambiarlo con el botón de Preferencias */
export function useTema() {
  const [tema, setTema] = useState(temaActual);
  useEffect(() => {
    const cambio = (e) => setTema(e.detail);
    addEventListener("tc:tema", cambio);
    return () => removeEventListener("tc:tema", cambio);
  }, []);
  return tema;
}

export default function Logo({ tipo = "emblema", fijo = false, alt = "", ...resto }) {
  const tema = useTema();
  const [oscuro, claro] = LOGOS[tipo];
  return <img src={!fijo && tema === "claro" ? claro : oscuro} alt={alt} {...resto} />;
}
