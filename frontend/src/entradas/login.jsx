import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/paginas/login.css"; // tema, base y estilos de esta página
import { montar } from "../lib/montar.jsx";
import Login from "../paginas/acceso/Login.jsx";

montar(<Login />);
