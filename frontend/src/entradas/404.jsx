import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/404.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import NoEncontrada from "../paginas/acceso/NoEncontrada.jsx";

montar(<NoEncontrada />, { cargarDatos: false });
