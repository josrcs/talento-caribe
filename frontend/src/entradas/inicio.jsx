import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/inicio.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Inicio from "../paginas/inicio/Inicio.jsx";

montar(<Inicio />);
