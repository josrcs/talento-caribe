import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/cursos.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Cursos from "../paginas/cursos/Cursos.jsx";

montar(<Cursos />);
