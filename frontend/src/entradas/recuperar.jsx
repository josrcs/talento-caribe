import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/recuperar.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Recuperar from "../paginas/acceso/Recuperar.jsx";

montar(<Recuperar />, { cargarDatos: false });
