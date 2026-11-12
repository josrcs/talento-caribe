import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/portal.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Portal from "../paginas/portal/Portal.jsx";

montar(<Portal />);
