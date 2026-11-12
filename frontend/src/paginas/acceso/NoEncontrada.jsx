/* NoEncontrada.jsx - Página 404 (GitHub Pages la muestra en cualquier dirección que no existe) */
import Logo from "../../componentes/Logo.jsx";
import Preferencias from "../../componentes/Preferencias.jsx";

export default function NoEncontrada() {
  return (
    <>
      <Preferencias flotante />
      <main className="login login-shell">
        <section className="login-story" aria-label="Talento Caribe">
          <a href="index.html" className="login-logo"><Logo tipo="completo-sm" alt="Talento Caribe — inicio" width="208" height="177" /></a>
          <div className="login-story-copy"><span className="eyebrow">Error 404</span><h1>Esta ruta no está en el mapa.</h1><p>Pero el talento no tiene fronteras: desde aquí puedes volver a cualquier parte de la plataforma.</p></div>
          <p className="acceso-pie">Plataforma educativa gratuita · Barranquilla, Colombia</p>
        </section>
        <section className="login-card" aria-labelledby="no-encontrada-titulo">
          <div className="login-card-heading">
            <Logo className="login-card-logo" tipo="emblema" width="64" height="48" />
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
    </>
  );
}
