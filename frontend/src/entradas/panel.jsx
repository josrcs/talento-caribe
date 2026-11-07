import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/panel.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Panel from "../paginas/panel/Panel.jsx";

montar(<Panel />);
