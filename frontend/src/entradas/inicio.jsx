import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/tema.css";
import "../estilos/style.css";
import "../estilos/efectos.css";
import "../estilos/plataforma.css";
import "../estilos/modulos.css";
import "../estilos/inicio.css";
import { montar } from "../lib/montar.jsx";
import Inicio from "../paginas/inicio/Inicio.jsx";

montar(<Inicio />);
