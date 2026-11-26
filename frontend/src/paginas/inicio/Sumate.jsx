/* Sumate.jsx - "Súmate a la comunidad de Talento Caribe"
   Cada tarjeta es una forma de ayudar. Al elegir una, el formulario de contacto
   queda listo con esa opción y el asunto, y la página baja hasta él.
   El mensaje se guarda con POST /api/contacto (interés: patrocinar, donar, espacio, mentor, estudiar o difundir). */
export const FORMAS_DE_SUMARSE = [
  { interes: "patrocinar", titulo: "Quiero patrocinar", texto: "Tu empresa o tu marca ayuda a que los cursos sigan siendo gratis.", icono: "🤝" },
  { interes: "donar", titulo: "Quiero donar", texto: "Computadores, materiales o recursos para las clases del piloto.", icono: "💻" },
  { interes: "espacio", titulo: "Quiero prestar un espacio", texto: "Un salón o una sala con internet en Barranquilla para las clases.", icono: "🏫" },
  { interes: "mentor", titulo: "Quiero ser mentor", texto: "Si sabes de programación, acompaña a los estudiantes del piloto.", icono: "🧭" },
  { interes: "estudiar", titulo: "Quiero estudiar", texto: "Aprende a crear tu página web desde cero, gratis, en Barranquilla.", icono: "🎓" },
  { interes: "difundir", titulo: "Quiero apoyar y difundir", texto: "Comparte Talento Caribe con jóvenes, colegios y tu comunidad.", icono: "📣" },
];

export default function Sumate({ alElegir }) {
  return (
    <section id="sumate" className="section sumate" aria-labelledby="sumate-titulo">
      <div className="container">
        <div className="section-cabecera" data-revelar>
          <span className="eyebrow">Comunidad</span>
          <h2 id="sumate-titulo">Súmate a la comunidad de Talento Caribe</h2>
          <p className="section-intro">El piloto 2027 se hace con la ayuda de muchas personas. Elige cómo quieres sumarte y te escribimos.</p>
        </div>
        <ul className="sumate-grid" data-escalonar>
          {FORMAS_DE_SUMARSE.map((f) => (
            <li key={f.interes}>
              <a className="sumate-opcion" href="#contacto" onClick={() => alElegir(f)}>
                <span className="sumate-icono" aria-hidden="true">{f.icono}</span>
                <strong>{f.titulo}</strong>
                <span>{f.texto}</span>
                <span className="sumate-accion" aria-hidden="true">Escribirnos →</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
