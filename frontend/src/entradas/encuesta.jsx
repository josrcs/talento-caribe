import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/legal.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Encuesta from "../paginas/legal/Encuesta.jsx";

montar(<Encuesta />, { cargarDatos: false });
