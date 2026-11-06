/* Portada - Lo primero que se ve: qué es Talento Caribe, para quién y cómo es un módulo por dentro */

export default function Portada({ edadMinima }) {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="container hero-grid">
        <div className="hero-texto">
          <p className="eyebrow">Cursos gratuitos · Barranquilla y en línea</p>
          <h1 id="hero-titulo">Aprende tecnología desde cero, con mentores y sin pagar un peso.</h1>
          <p className="hero-lead">
            Talento Caribe es una escuela de software y hardware para jóvenes del Caribe y Latinoamérica. Clases en español,
            presenciales o virtuales, y un proyecto propio al terminar cada curso.
          </p>
          <div className="hero-acciones">
            <a href="#empieza" className="btn btn-primary btn-flecha">Encuentra tu curso</a>
            <a href="cursos.html" className="btn btn-outline">Ver los 12 cursos</a>
          </div>
          <ul className="hero-garantias">
            <li>No necesitas experiencia previa</li>
            <li>{`Desde los ${edadMinima} años`}</li>
            <li>Certificado al terminar</li>
          </ul>
        </div>
        <ModuloMuestra />
      </div>
    </section>
  );
}

/* Vista real del primer módulo de Lógica de programación (ver js/cursos-data.js) */
const TEMAS = [
  { texto: "Problema y entradas", estado: "hecho" },
  { texto: "Proceso", estado: "hecho" },
  { texto: "Resultados", estado: "actual" },
  { texto: "Secuencias" },
];

function ModuloMuestra() {
  return (
    <figure className="modulo-muestra" aria-labelledby="muestra-titulo">
      <div className="muestra-cabecera">
        <span className="muestra-curso">Lógica de programación</span>
        <span className="muestra-modulo">Módulo 1 de 8</span>
      </div>
      <div className="muestra-cuerpo">
        <h2 id="muestra-titulo" className="muestra-titulo">Pensar en pasos</h2>
        <div className="muestra-avance">
          <span>Semana 1 de 2</span>
          <span className="muestra-barra" aria-hidden="true"><span /></span>
        </div>
        <ul className="muestra-temas" aria-label="Temas del módulo">
          {TEMAS.map(({ texto, estado }) => <li key={texto} className={estado}>{texto}</li>)}
        </ul>
        <div className="muestra-ejercicio">
          <p className="muestra-etiqueta">Ejercicio de la clase · PSeInt</p>
          {/* Pseudocódigo: no se traduce */}
          <pre data-no-traducir><code>
            <b>Algoritmo</b> Saludo{"\n"}
            {"    "}<b>Escribir</b> <i>"¿Cómo te llamas?"</i>{"\n"}
            {"    "}<b>Leer</b> nombre{"\n"}
            {"    "}<b>Escribir</b> <i>"Hola, "</i>, nombre{"\n"}
            <b>FinAlgoritmo</b>
          </code></pre>
        </div>
        <p className="muestra-entrega"><strong>Entregable:</strong> tu primer algoritmo y una ficha de entradas, proceso y salidas.</p>
      </div>
      <figcaption>Así se ve un módulo por dentro.</figcaption>
    </figure>
  );
}
