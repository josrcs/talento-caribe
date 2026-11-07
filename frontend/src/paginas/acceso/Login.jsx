/* ==========================================================
   Login.jsx - Acceso único (admin/login.html): estudiante, docente y administrativo
   POST /api/auth/login devuelve un token JWT y el perfil; se guarda la sesión
   y se va al portal (estudiantes y docentes) o al panel (administrativos).
   Enlaces que entiende: ?rol=docente · ?curso=ID (vuelve al curso para inscribirse)
   ========================================================== */
import { useEffect, useRef, useState } from "react";
import Icono from "../../componentes/Icono.jsx";
import Logo from "../../componentes/Logo.jsx";
import Preferencias from "../../componentes/Preferencias.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import { pedir } from "../../lib/api.js";
import { PUBLICADA } from "../../lib/config.js";
import { DOCENTES } from "../../lib/modelo.js";
import { enlace, parametros } from "../../lib/rutas.js";
import { guardarSesion } from "../../lib/sesion.js";
import { EMAIL, espera, sinTildes } from "../../lib/utils.js";
import { useValidacion } from "../../lib/validacion.jsx";

/* Cuentas de prueba (las crea database/seed.sql; en la página publicada el servidor les cambia la clave) */
const CUENTAS = {
  estudiante: { correo: "estudiante@talentocaribe.co", clave: "Estudiante123", destino: "portal.html", boton: "Entrar a mi portal", texto: "Consulta tus cursos, entrega actividades y mira tu progreso." },
  docente: { correo: DOCENTES[0].correo, clave: "Docente123", destino: "portal.html", boton: "Entrar a mi espacio docente", texto: "Deja actividades a tus cursos y revisa las entregas." },
  administrativo: { correo: "admin@talentocaribe.co", clave: "Admin123", destino: "admin/panel.html", boton: "Entrar al panel", texto: "Elige tu cargo: cada uno ve las herramientas de su área." },
};
const ROLES = [["estudiante", "birrete", "Estudiante", "Aprende y entrega"], ["docente", "pizarra", "Docente", "Guía tus cursos"], ["administrativo", "maletin", "Administrativo", "Gestiona el equipo"]];

/* Historia del lado izquierdo por rol (qué podrá hacer cada persona) */
const HISTORIA = {
  estudiante: { eyebrow: "Para estudiantes", titulo: "Aprende haciendo, a tu ritmo.", lista: [["portapapeles", "Actividades de tus docentes", "Entrega tus tareas y recibe retroalimentación."], ["grafica", "Tu progreso en un vistazo", "Barras de avance, notas y logros."], ["chat", "Tutor con IA", "Te explica conceptos y arma tu plan de estudio."]] },
  docente: { eyebrow: "Para docentes", titulo: "Acompaña a tus estudiantes sin complicarte.", lista: [["lapiz", "Crea actividades en minutos", "Usa plantillas didácticas para cada curso."], ["check", "Revisa y califica", "Nota de 1.0 a 5.0 con comentario."], ["usuarios", "Alertas de apoyo", "Detecta quién necesita una mano."]] },
  administrativo: { eyebrow: "Para el equipo", titulo: "Cada cargo, su espacio de trabajo.", lista: [["grafica", "Indicadores claros", "Inscripciones, cursos y actividad académica."], ["escudo", "Permisos por cargo", "Cada área ve solo lo que necesita."], ["destello", "Asistente de gestión", "Pregúntale por cifras y pendientes."]] },
};

/* Cargos agrupados para el selector visual (los mismos que valida el servidor) */
export const CARGOS = [
  { grupo: "Directivos", items: [
    ["Gerente", "estrella", "Visión global y decisiones"],
    ["Director(a) general", "brujula", "Seguimiento institucional"],
    ["Director(a) académico(a)", "birrete", "Programas de software"],
    ["Director(a) de tecnología", "chip", "Programas de hardware"],
    ["Director(a) de admisiones", "portapapeles", "Ingreso de estudiantes"],
    ["Director(a) de comunicaciones", "megafono", "Información y aliados"],
    ["Director(a) administrativo(a)", "billetera", "Operación y finanzas"],
  ] },
  { grupo: "Coordinación", items: [
    ["Coordinador(a) académico(a)", "libro", "Catálogo de software"],
    ["Coordinador(a) de tecnología", "engranaje", "Laboratorios y prácticas"],
    ["Coordinador(a) de admisiones", "check", "Solicitudes de inscripción"],
    ["Coordinador(a) de comunicaciones", "sobre", "Bandeja de contacto"],
  ] },
  { grupo: "Áreas de apoyo", items: [
    ["Admisiones y registro", "usuarios", "Datos de aspirantes"],
    ["Administración y finanzas", "grafica", "Control de gastos"],
    ["Comunicaciones y alianzas", "chat", "Difusión y vínculos"],
    ["Otro cargo administrativo", "maletin", "Encuestas y funciones"],
  ] },
];
const iconoDe = (cargo) => CARGOS.flatMap((g) => g.items).find((i) => i[0] === cargo)?.[1] || "maletin";

function SelectorCargo({ puesto, alElegir }) {
  const [filtro, setFiltro] = useState("");
  const f = sinTildes(filtro.trim());
  const grupos = CARGOS.map((g) => ({ ...g, items: g.items.filter((i) => !f || sinTildes(i[0]).includes(f) || sinTildes(i[2]).includes(f)) })).filter((g) => g.items.length);
  return (
    <div className="cargo-selector" id="cargo-selector">
      <label className="cargo-buscar"><span><Icono nombre="buscar" tam={18} /></span><span className="sr-only">Buscar cargo</span>
        <input type="search" id="cargo-buscar" placeholder="Busca tu cargo: director, admisiones, finanzas…" value={filtro} onChange={(e) => setFiltro(e.target.value)} autoFocus />
      </label>
      <div className="cargo-grupos" id="cargo-grupos" role="radiogroup" aria-label="Cargo administrativo">
        {grupos.length ? grupos.map((g) => (
          <div className="cargo-grupo" key={g.grupo}>
            <span className="cargo-grupo-titulo">{g.grupo}</span>
            <div className="cargo-grid">
              {g.items.map(([nombre, icono, desc]) => (
                <button type="button" key={nombre} className={`cargo-opcion ${puesto === nombre ? "is-selected" : ""}`} role="radio" aria-checked={puesto === nombre} onClick={() => alElegir(nombre)}>
                  <span className="cargo-icono"><Icono nombre={icono} tam={18} /></span>
                  <span className="cargo-texto"><strong>{nombre}</strong><small>{desc}</small></span>
                  <span className="cargo-check"><Icono nombre="check" tam={14} /></span>
                </button>
              ))}
            </div>
          </div>
        )) : <p className="cargo-vacio">No encontramos ese cargo. Prueba con “Otro cargo administrativo”.</p>}
      </div>
    </div>
  );
}

export default function Login() {
  const p = parametros();
  const cursoPendiente = Number(p.get("curso"));
  const [rol, setRol] = useState(["estudiante", "docente", "administrativo"].includes(p.get("rol")) ? p.get("rol") : "estudiante");
  const [puesto, setPuesto] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [sacude, setSacude] = useState(0);
  const [cambios, setCambios] = useState(0); // vuelve a lanzar la animación al cambiar de rol o de cargo
  const { validar, error: errorCampo, invalido, limpiar } = useValidacion();
  const campoCorreo = useRef(null), campoClave = useRef(null);

  const admin = rol === "administrativo";
  const cuenta = CUENTAS[rol], historia = HISTORIA[rol];
  const elegirRol = (r) => { setRol(r); setError(""); limpiar(); setCambios((n) => n + 1); };
  const elegirCargo = (nombre) => { setPuesto(nombre); setCambios((n) => n + 1); };
  useEffect(() => { if (admin && puesto) campoCorreo.current?.focus(); }, [admin, puesto]);

  function usarPrueba() {
    if (admin && !puesto) setPuesto("Gerente");
    setCorreo(cuenta.correo); setClave(cuenta.clave);
  }

  async function entrar(e) {
    e.preventDefault();
    const reglas = {};
    if (admin) reglas.puesto = () => (puesto ? "" : "Elige el cargo con el que ingresarás.");
    reglas.correo = (v) => (EMAIL.test(v) ? "" : "Escribe tu correo, por ejemplo nombre@correo.com.");
    reglas.clave = (v) => (v.length < 8 ? "La contraseña tiene mínimo 8 caracteres." : "");
    if (!validar(e.currentTarget, reglas)) return;
    setEnviando(true); setError("");
    const datos = { correo: correo.trim().toLowerCase(), clave, rol, puesto: admin ? puesto : undefined };
    let respuesta = null;
    try {
      await espera(400);
      respuesta = await pedir("POST", "/auth/login", datos, { sinRedirigir: true });
    } catch (problema) {
      // Cuenta con cargo fijo y se eligió otro: se selecciona el suyo y se entra con ese
      if (admin && problema.puesto && problema.puesto !== puesto) {
        setPuesto(problema.puesto);
        try { respuesta = await pedir("POST", "/auth/login", { ...datos, puesto: problema.puesto }, { sinRedirigir: true }); } catch (otro) { problema = otro; }
      }
      if (!respuesta) {
        setError(problema.status === 401 ? "Correo o contraseña incorrectos para este tipo de cuenta." : problema.message);
        setSacude((n) => n + 1); setEnviando(false); return;
      }
    }
    const sesion = { ...respuesta.usuario, token: respuesta.token };
    if (admin && !sesion.puesto) sesion.puesto = puesto;
    guardarSesion(sesion);
    location.href = rol === "estudiante" && cursoPendiente > 0 ? enlace("cursos.html") + "?continuar=" + cursoPendiente : enlace(cuenta.destino);
  }

  return (
    <>
      <Preferencias flotante />
      <main className="login login-shell acceso">
        {/* Lado izquierdo: cambia según el tipo de cuenta para explicar qué encontrará cada persona */}
        <section className="login-story" aria-label="Qué encontrarás">
          <a href={enlace("index.html")} className="login-logo"><Logo tipo="completo-sm" alt="Talento Caribe — inicio" width="208" height="177" /></a>
          <div className={"login-story-copy" + (cambios ? " cambia" : "")} id="acceso-historia" key={"h" + rol}>
            <span className="eyebrow">{historia.eyebrow}</span>
            <h1>{historia.titulo}</h1>
            <ul className="acceso-beneficios">
              {historia.lista.map(([icono, t, d]) => <li key={t}><span className="beneficio-icono"><Icono nombre={icono} tam={20} /></span><span><strong>{t}</strong><small>{d}</small></span></li>)}
            </ul>
          </div>
          <p className="acceso-pie">Plataforma educativa gratuita · Barranquilla, Colombia</p>
        </section>

        <section className="login-card acceso-card" aria-labelledby="login-titulo">
          <div className="login-card-heading">
            <Logo className="login-card-logo" tipo="emblema" width="64" height="48" />
            <span className="eyebrow">Portal de la comunidad</span>
            <h2 id="login-titulo">¡Qué bueno verte!</h2>
            <p id="login-subtitulo">{cuenta.texto}</p>
          </div>

          {/* Paso 1: tipo de cuenta */}
          <div className="rol-tabs" role="radiogroup" aria-label="Tipo de cuenta" style={{ "--i": ROLES.findIndex((r) => r[0] === rol) }}>
            {ROLES.map(([valor, icono, titulo, sub]) => (
              <button type="button" key={valor} className={"rol-tab" + (rol === valor ? " is-selected" : "")} role="radio" aria-checked={rol === valor} onClick={() => elegirRol(valor)}>
                <span className="rol-tab-icono"><Icono nombre={icono} tam={24} /></span><strong>{titulo}</strong><small>{sub}</small>
              </button>
            ))}
            <span className="rol-tabs-indicador" aria-hidden="true"></span>
          </div>

          <form id="form-login" className={"form login-form" + (sacude ? " sacude" : "")} key={"f" + sacude} noValidate onSubmit={entrar}>
            <input type="hidden" name="puesto" value={puesto} />
            <div className={"acceso-dinamico" + (cambios ? " cambia" : "")} key={"d" + rol}>
              {rol === "estudiante" && (
                <p className="acceso-aviso"><span><Icono nombre="destello" tam={18} /></span><span>¿Eres nuevo? <a href={enlace("registro.html") + (cursoPendiente > 0 ? "?curso=" + cursoPendiente : "")}>Crea tu cuenta gratis</a> en menos de 3 minutos.</span></p>
              )}

              {/* Docentes: elegir su nombre llena el correo */}
              {rol === "docente" && (
                <div className="campo">
                  <span className="campo-titulo">¿Quién eres? <small>Toca tu nombre para llenar tu correo</small></span>
                  <div className="docente-chips">
                    {DOCENTES.map((d) => (
                      <button type="button" key={d.correo} className={"docente-chip" + (correo === d.correo ? " is-selected" : "")} onClick={() => { setCorreo(d.correo); campoClave.current?.focus(); }}>
                        <span className="avatar avatar-sm" aria-hidden="true">{d.iniciales}</span><span><strong>{d.nombre}</strong><small>{d.especialidad}</small></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrativos: selector visual de cargo */}
              {admin && (
                <div className="campo cargo-campo">
                  <div className="pasos-acceso" aria-hidden="true"><span className={"paso-acceso " + (puesto ? "is-hecho" : "is-activo")}>1 · Elige tu cargo</span><span className={"paso-acceso" + (puesto ? " is-activo" : "")}>2 · Ingresa</span></div>
                  {puesto ? (
                    <div className={"cargo-elegido" + (cambios ? " cambia" : "")} key={puesto}>
                      <span className="cargo-icono"><Icono nombre={iconoDe(puesto)} tam={20} /></span>
                      <span><small>Ingresarás como</small><strong>{puesto}</strong></span>
                      <button type="button" className="btn-texto-plano" onClick={() => setPuesto("")}>Cambiar</button>
                    </div>
                  ) : <SelectorCargo puesto={puesto} alElegir={elegirCargo} />}
                  {errorCampo("puesto")}
                </div>
              )}

              {(!admin || puesto) && (
                <div className="acceso-credenciales">
                  <div className="campo">
                    <label htmlFor="l-correo">Correo electrónico</label>
                    <input ref={campoCorreo} id="l-correo" name="correo" type="email" autoComplete="username" placeholder="nombre@correo.com" required value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={invalido("correo")} />
                    {errorCampo("correo")}
                  </div>
                  <div className="campo">
                    <label htmlFor="l-clave">Contraseña</label>
                    <div className="campo-clave">
                      <input ref={campoClave} id="l-clave" name="clave" type={verClave ? "text" : "password"} autoComplete="current-password" placeholder="Ingresa tu contraseña" required minLength="4" value={clave} onChange={(e) => setClave(e.target.value)} aria-invalid={invalido("clave")} />
                      <button type="button" className="btn-texto-plano" aria-pressed={verClave} aria-controls="l-clave" onClick={() => setVerClave(!verClave)}>{verClave ? "Ocultar" : "Mostrar"}</button>
                    </div>
                    {errorCampo("clave")}
                  </div>
                  <p className="olvide-clave"><a href={enlace("recuperar.html")}>¿Olvidaste tu contraseña?</a></p>
                </div>
              )}
            </div>
            {error && <p id="login-error" className="form-estado estado-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" id="login-enviar" disabled={enviando}>
              <span className="btn-texto" hidden={enviando}>{cuenta.boton}</span><span className="spinner" aria-hidden="true" hidden={!enviando}></span><span aria-hidden="true">→</span>
            </button>
          </form>
          {/* En la página publicada las cuentas de prueba no funcionan (el servidor les cambió la clave): se ocultan */}
          {!PUBLICADA && (
            <div className="login-demo">
              <p><span aria-hidden="true">ⓘ</span> <strong>Cuenta de prueba:</strong> <span>{`${cuenta.correo} / ${cuenta.clave}${admin ? " (con cualquier cargo)" : rol === "docente" ? " (todos los docentes usan esta clave)" : ""}`}</span></p>
              <button type="button" className="btn btn-outline btn-sm" onClick={usarPrueba}>Usar cuenta de prueba</button>
              <p className="nota-requisitos">Cuentas creadas por database/seed.sql en tu base de datos local. El servidor valida la contraseña, el rol y el cargo.</p>
            </div>
          )}
          <p className="login-volver"><a href={enlace("index.html")}>← Volver al sitio</a></p>
        </section>
      </main>
      <AsistenteFlotante />
    </>
  );
}
