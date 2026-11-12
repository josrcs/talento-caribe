/* ==========================================================
   Intro.jsx - Animación de entrada: amanecer en el Caribe (portal y panel)
   Se muestra la primera vez de cada sesión del navegador; para verla otra
   vez (por ejemplo al presentar el proyecto): portal.html?intro
     1. El cielo aclara y el horizonte se dibuja desde el centro (0 – 1 s)
     2. El sol sale del mar y su luz se refleja en el agua      (0.3 – 1.8 s)
     3. El emblema aparece desde su propio sol y lo cruza un brillo (0.75 – 2.4 s)
     4. "TALENTO" sube letra por letra y "CARIBE" se cierra     (1.2 – 2.5 s)
     5. Lema y barra de carga, que espera a que la página cargue
     6. Salida: el telón sube como una ola y el emblema vuela hasta el
        logo de la barra superior
   Se salta con clic, rueda del mouse, Enter, Espacio o Esc.
   Respeta "reducir movimiento" (no se muestra).
   ========================================================== */
import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n/idioma.js";
import emblemaClaro from "../../assets/img/logo-emblema-hd.png";
import emblemaColor from "../../assets/img/logo-emblema-hd-color.png";

const raiz = document.documentElement;
let mostrarIntro = false;
try {
  const pedida = new URLSearchParams(location.search).has("intro");
  mostrarIntro = !matchMedia("(prefers-reduced-motion: reduce)").matches && (pedida || !sessionStorage.getItem("tc-intro"));
  if (mostrarIntro) sessionStorage.setItem("tc-intro", "1");
} catch { mostrarIntro = false; }
// Cubre la página desde el primer cuadro (ver html.intro-cubre en efectos.css); efectos.js espera a que suba el telón
if (mostrarIntro) raiz.classList.add("con-intro", "intro-cubre");

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const DURACION_MINIMA = 2600;
// Posiciones "aleatorias" pero fijas: la animación se ve igual en cada visita
const ESTRELLAS = Array.from({ length: 34 }, (_, i) => ({ "--x": `${(i * 37) % 100}%`, "--y": `${(i * 53) % 78}%`, "--d": `${((i * 7) % 10) / 4}s`, "--t": `${1 + (i % 3) * 0.5}px` }));
// Destellos del sol en el agua: angostos junto al horizonte y más anchos hacia quien mira
const REFLEJOS = Array.from({ length: 10 }, (_, i) => ({ "--i": i, "--w": `${8 + i * 4.5 + ((i * 29) % 7)}%`, "--x": `${((i * 17) % 9) - 4}%` }));
// Ola: una curva que se repite dos veces para poder moverla en bucle sin cortes
const Ola = ({ alto }) => (
  <svg viewBox={`0 0 2880 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
    <path d={`M0 ${alto * 0.45} C 360 ${alto * 0.05}, 720 ${alto * 0.85}, 1440 ${alto * 0.45} S 2520 ${alto * 0.05}, 2880 ${alto * 0.45} V ${alto} H 0 Z`} />
  </svg>
);

/* El emblema vuela hasta el logo de destino (técnica FLIP: se mide dónde está y dónde debe
   quedar, y se anima solo con transform). Si el destino no se ve, se desvanece hacia arriba. */
function volar(caja) {
  const destino = [document.querySelector("[data-intro-destino]"), document.querySelector(".brand img")]
    .find((el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight - 30 && r.bottom > 30; });
  const curva = "cubic-bezier(.7, 0, .2, 1)";
  if (!destino) return caja.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-6vh) scale(.85)" }], { duration: 700, easing: curva, fill: "forwards" }).finished;
  const [rx, ry, rw] = (destino.dataset.introRegion || "0 0 1 1").split(" ").map(Number);
  const desde = caja.getBoundingClientRect(), hasta = destino.getBoundingClientRect();
  const x = hasta.left + hasta.width * rx - desde.left, y = hasta.top + hasta.height * ry - desde.top, escala = (hasta.width * rw) / desde.width;
  destino.classList.add("intro-espera");
  return caja.animate([{ transform: "none" }, { transform: `translate(${x}px, ${y}px) scale(${escala})` }], { duration: 1050, delay: 120, easing: curva, fill: "forwards" }).finished.then(() => {
    destino.classList.remove("intro-espera");
    destino.classList.add("intro-llega");
    caja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-out", fill: "forwards" });
    setTimeout(() => destino.classList.remove("intro-llega"), 700);
  });
}

export default function Intro() {
  const [visible, setVisible] = useState(mostrarIntro);
  const [fase, setFase] = useState(""); // "" → "intro-activa" → "intro-lista" → "intro-sale"
  const img = useRef(null), emblema = useRef(null), terminado = useRef(false);
  const salirRef = useRef(() => {});

  useEffect(() => {
    if (!visible) return;
    raiz.classList.remove("intro-cubre");
    let activo = true;
    function salir() {
      if (terminado.current) return; terminado.current = true;
      setFase((f) => f + " intro-sale");
      raiz.classList.add("intro-hecha"); // el contenido empieza a animarse mientras sube el telón
      dispatchEvent(new Event("tc:intro-sale")); // efectos.js revela lo que queda a la vista
      volar(emblema.current).then(() => {
        raiz.classList.add("intro-aterrizo");
        setTimeout(() => activo && setVisible(false), 450);
      });
    }
    // Arranca cuando el emblema está listo para pintarse (máximo 0.9 s de espera)
    const activa = Promise.race([img.current.decode().catch(() => {}), espera(900)]).then(() => setFase("intro-activa"));
    // La barra se completa cuando la página terminó de cargar y la escena alcanzó a verse completa
    const cargada = document.readyState === "complete" ? Promise.resolve() : new Promise((ok) => addEventListener("load", ok, { once: true }));
    Promise.race([Promise.all([cargada, activa.then(() => espera(DURACION_MINIMA))]), espera(5600)]).then(async () => {
      if (terminado.current) return;
      setFase("intro-activa intro-lista");
      await espera(320);
      salir();
    });
    const tecla = (e) => { if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); salir(); } };
    const rueda = (e) => { e.preventDefault(); salir(); };
    document.addEventListener("keydown", tecla);
    addEventListener("wheel", rueda, { passive: false });
    salirRef.current = salir;
    return () => { activo = false; document.removeEventListener("keydown", tecla); removeEventListener("wheel", rueda); };
  }, [visible]);

  if (!visible) return null;
  const tema = raiz.dataset.tema;
  return (
    <div className={"intro " + fase} aria-hidden="true" onClick={() => salirRef.current()} onTouchMove={() => salirRef.current()}>
      <div className="intro-telon">
        <div className="intro-cielo"><div className="intro-estrellas">{ESTRELLAS.map((e, i) => <i key={i} style={e}></i>)}</div><div className="intro-sol"></div></div>
        <div className="intro-mar"><div className="intro-reflejo">{REFLEJOS.map((e, i) => <i key={i} style={e}></i>)}</div></div>
        <div className="intro-horizonte"></div>
        <div className="intro-textos">
          <div className="intro-marca" data-no-traducir>
            <span className="intro-talento">{[..."TALENTO"].map((l, i) => <span className="intro-letra" key={i}><span style={{ "--i": i }}>{l}</span></span>)}</span>
            <span className="intro-caribe">CARIBE</span>
          </div>
          <p className="intro-lema">{t("Tu talento no tiene fronteras")}</p>
          <div className="intro-progreso"><span></span></div>
        </div>
        <div className="intro-grano"></div>
        <div className="intro-borde"><Ola alto={120} /></div>
      </div>
      <div className="intro-emblema" ref={emblema}><img ref={img} src={tema === "claro" ? emblemaColor : emblemaClaro} alt="" width="672" height="504" /><span className="intro-brillo"></span></div>
      <button type="button" className="intro-saltar">{t("Saltar animación")} <kbd>Esc</kbd></button>
    </div>
  );
}
