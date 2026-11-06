/* NoEncontrada - Página 404 con la marca (404.html).
   GitHub Pages la muestra para cualquier dirección que no exista; el servidor de Node también. */
import PanelMarca from "../../componentes/PanelMarca.jsx";
import { useRevelar } from "../../lib/ganchos.js";

export default function NoEncontrada() {
  const revelar = useRevelar([]);
  return (
    <main className="login login-shell" id="contenido" ref={revelar}>
      <PanelMarca eyebrow="Error 404" titulo="Esta ruta no está en el mapa." texto="Pero el talento no tiene fronteras: desde aquí puedes volver a cualquier parte de la plataforma." />
      <section className="login-card" aria-labelledby="no-encontrada-titulo">
        <div className="login-card-heading">
          <img className="login-card-logo" src="assets/img/logo-emblema.png" alt="" width="64" height="48" />
          <span className="eyebrow">Página no encontrada</span>
          <h2 id="no-encontrada-titulo">No encontramos esta página</h2>
          <p>Puede que el enlace esté incompleto o que la página haya cambiado de dirección.</p>
        </div>
        <div className="no-encontrada-acciones">
          <a className="btn btn-primary" href="index.html">Ir al inicio</a>
          <a className="btn btn-outline" href="cursos.html">Ver los cursos</a>
          <a className="btn btn-outline" href="admin/login.html">Ingresar a mi cuenta</a>
        </div>
        <p className="login-volver"><a href="index.html#contacto">¿Llegaste aquí desde un enlace nuestro? Avísanos</a></p>
      </section>
    </main>
  );
}
