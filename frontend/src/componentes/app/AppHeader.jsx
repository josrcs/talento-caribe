/* AppHeader.jsx - Barra superior del portal y del panel:
   menú (celular), logo, guía, usuario, "Mi cuenta", salir y preferencias de tema e idioma. */
import { useState } from "react";
import Icono from "../Icono.jsx";
import Logo from "../Logo.jsx";
import Preferencias from "../Preferencias.jsx";
import ModalCuenta from "./ModalCuenta.jsx";
import { iniciales } from "./ui.jsx";
import { borrarSesion } from "../../lib/sesion.js";
import { enlace, ir } from "../../lib/rutas.js";

export default function AppHeader({ nombre, subtitulo, menuAbierto, alMenu, idNav, etiquetaMenu = "Abrir menú", tituloGuia, alGuia }) {
  const [cuenta, setCuenta] = useState(false);
  const salir = () => { borrarSesion(); ir("admin/login.html"); };
  return (
    <>
    <header className="panel-header app-header">
      <button type="button" className="nav-toggle app-menu-btn" aria-expanded={menuAbierto} aria-controls={idNav} aria-label={etiquetaMenu} onClick={alMenu}><span className="nav-toggle-bar"></span></button>
      <a href={enlace("index.html")} className="brand"><Logo tipo="emblema" width="48" height="36" /><span>Talento Caribe</span></a>
      <div className="app-header-acciones">
        <Preferencias />
        <button type="button" className="btn btn-outline btn-sm" title={tituloGuia} onClick={alGuia}><span data-icono><Icono nombre="brujula" tam={16} /></span><span className="ocultar-movil">Guía</span></button>
        <div className="usuario-chip"><span className="avatar avatar-sm" aria-hidden="true">{iniciales(nombre)}</span><span className="ocultar-movil"><strong>{nombre}</strong><small>{subtitulo}</small></span></div>
        <button type="button" className="btn btn-outline btn-sm" title="Cambiar tu contraseña o cerrar sesión en todos los equipos" onClick={() => setCuenta(true)}><span data-icono><Icono nombre="escudo" tam={16} /></span><span className="ocultar-movil">Mi cuenta</span></button>
        <button type="button" className="btn btn-outline btn-sm" onClick={salir}><span data-icono><Icono nombre="salir" tam={16} /></span><span className="ocultar-movil">Salir</span></button>
      </div>
    </header>
    <ModalCuenta abierto={cuenta} alCerrar={() => setCuenta(false)} />
    </>
  );
}
