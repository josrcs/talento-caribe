import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/tema.css";
import "../estilos/style.css";
import "../estilos/admin.css";
import "../estilos/efectos.css";
import "../estilos/plataforma.css";
import { montar } from "../lib/montar.jsx";
import NoEncontrada from "../paginas/acceso/NoEncontrada.jsx";

montar(<NoEncontrada />, { cargarDatos: false });
