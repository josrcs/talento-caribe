/* ui.jsx - Piezas pequeñas que comparten el portal y el panel */
import { useEffect, useState } from "react";
import Icono from "../Icono.jsx";
import { TIPOS } from "../../lib/modelo.js";
import { locale } from "../../i18n/idioma.js";

export const iniciales = (n) => String(n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
export const fecha = (iso) => (iso ? new Date(String(iso).length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—");
export const nota = (n) => (n !== null && n !== undefined && n !== "" ? Number(n).toFixed(1) : "—");
export const colorNota = (n) => (n == null ? "" : n >= 4 ? "nota-alta" : n >= 3 ? "nota-media" : "nota-baja");

const ESTADOS = { pendiente: ["Pendiente", "pill-pendiente"], vencida: ["Vencida", "pill-no"], entregada: ["Entregada", ""], revisada: ["Calificada", "pill-ok"] };
export const Pill = ({ estado, texto }) => <span className={`pill ${ESTADOS[estado]?.[1] || ""}`}>{texto || ESTADOS[estado]?.[0] || estado}</span>;

const ESTADO_MODULO = { completo: ["Completo", "pill-ok"], "en-curso": ["En curso", ""], "sin-iniciar": ["Sin iniciar", "pill-pendiente"], "sin-actividades": ["Sin actividades", "pill-gris"] };
export const PillModulo = ({ estado }) => <span className={`pill ${ESTADO_MODULO[estado][1]}`}>{ESTADO_MODULO[estado][0]}</span>;

export const TipoIcono = ({ tipo }) => (
  <span className="tipo-icono" style={{ "--tipo": TIPOS[tipo]?.color || "#1ab0d6" }} title={tipo}><Icono nombre={TIPOS[tipo]?.icono || "lapiz"} tam={18} /></span>
);
export const Barra = ({ pct, etiqueta = "Progreso" }) => (
  <div className="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label={etiqueta}><span style={{ width: `${pct}%` }}></span></div>
);
export const Vacio = ({ icono, titulo, texto, children }) => (
  <div className="vacio"><Icono nombre={icono} tam={30} /><h3>{titulo}</h3><p>{texto}</p>{children}</div>
);
export const EncabezadoSeccion = ({ eyebrow, titulo, texto, children }) => (
  <div className="seccion-cabecera">
    <div><span className="eyebrow">{eyebrow}</span><h1>{titulo}</h1>{texto && <p className="seccion-texto">{texto}</p>}</div>
    {children}
  </div>
);
export const textoFicha = (n) => (n ? `Ficha ${n}` : "Todas las fichas");
export const etiquetaModulo = (a) => (a.modulo ? ` · Módulo ${Number(a.modulo)}` : "");

/* Botón que pide confirmación tocándolo dos veces (por ejemplo, eliminar) */
export function BotonDosToques({ className, alConfirmar, children, textoConfirmar = "¿Eliminar? Toca de nuevo", ...resto }) {
  const [armado, setArmado] = useState(false);
  useEffect(() => { if (!armado) return; const t = setTimeout(() => setArmado(false), 3000); return () => clearTimeout(t); }, [armado]);
  return <button type="button" className={className} onClick={() => (armado ? (setArmado(false), alConfirmar()) : setArmado(true))} {...resto}>{armado ? textoConfirmar : children}</button>;
}

/* Confeti suave al entregar o publicar (respeta movimiento reducido): celebrar() */
export const celebrar = () => dispatchEvent(new Event("tc:celebrar"));
export function Confeti() {
  const [piezas, setPiezas] = useState(null);
  useEffect(() => {
    const lanzar = () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const colores = ["#1ab0d6", "#f8ac24", "#0f9a80", "#7dd3fc", "#ffffff"];
      setPiezas(Array.from({ length: 40 }, (_, i) => ({ "--x": `${Math.random() * 100}vw`, "--d": `${0.9 + Math.random() * 1.2}s`, "--r": `${Math.random() * 720}deg`, "--c": colores[i % 5], "--w": `${6 + Math.random() * 6}px` })));
      setTimeout(() => setPiezas(null), 2500);
    };
    addEventListener("tc:celebrar", lanzar);
    return () => removeEventListener("tc:celebrar", lanzar);
  }, []);
  return piezas && <div className="confeti" aria-hidden="true">{piezas.map((estilo, i) => <i key={i} style={estilo}></i>)}</div>;
}
