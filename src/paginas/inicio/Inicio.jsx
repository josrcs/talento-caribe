/* Inicio - Página principal de Talento Caribe (index.html) */
import Encabezado from "../../componentes/Encabezado.jsx";
import Pie from "../../componentes/Pie.jsx";
import Portada from "./Portada.jsx";
import Orientador from "./Orientador.jsx";
import Asistente from "./Asistente.jsx";
import Contacto from "./Contacto.jsx";
import { Cifras, Rutas, Metodo, Proceso, CursosAbiertos, Mentores, Nosotros, Preguntas, Cierre } from "./Secciones.jsx";
import { ENLACES_MENU, ACCIONES_MENU } from "./contenido.js";
import { cursos } from "../../lib/plataforma.js";
import { useDatosListos, useRevelar } from "../../lib/ganchos.js";

/* Edad mínima (la menor del catálogo) y la más común, para los textos del inicio */
function edades() {
  const lista = cursos().map((c) => Number(c.edadMinima ?? 14)).filter((n) => n > 0);
  if (!lista.length) return { minima: 14, habitual: 14 };
  const veces = lista.reduce((m, n) => m.set(n, (m.get(n) || 0) + 1), new Map());
  const habitual = [...veces].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { minima: Math.min(...lista), habitual };
}

export default function Inicio() {
  const listos = useDatosListos();
  const contenido = useRevelar([listos]);
  const { minima, habitual } = edades();
  const totalModulos = cursos().reduce((total, c) => total + (c.modulos || []).length, 0);

  return (
    <>
      <Encabezado enlaces={ENLACES_MENU} acciones={ACCIONES_MENU} espiarSecciones />
      <main id="contenido" ref={contenido}>
        <Portada edadMinima={minima} />
        <Cifras totalCursos={cursos().length} totalModulos={totalModulos} />
        <Orientador />
        <Rutas />
        <Metodo />
        <Proceso />
        <CursosAbiertos listos={listos} />
        <Mentores />
        <Nosotros />
        <Preguntas edadHabitual={habitual} />
        <Asistente />
        <Contacto />
        <Cierre />
      </main>
      <Pie inicio="" />
    </>
  );
}
