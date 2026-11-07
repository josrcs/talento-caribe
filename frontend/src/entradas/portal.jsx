import "../i18n/idioma.js"; // primero: idioma y tema antes de pintar
import "../estilos/tema.css";
import "../estilos/style.css";
import "../estilos/admin.css";
import "../estilos/efectos.css";
import "../estilos/plataforma.css";
import "../estilos/modulos.css";
import { montar } from "../lib/montar.jsx";
import Portal from "../paginas/portal/Portal.jsx";

montar(<Portal />);
