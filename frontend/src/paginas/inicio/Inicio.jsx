/* ==========================================================
   Inicio.jsx - Página de inicio (index.html)
   Hero, cifras, orientador, rutas, método, proceso, cursos destacados,
   mentores, nosotros, preguntas frecuentes, asistente IA y contacto.
   Las cifras, las rutas y los cursos salen del catálogo de la API.
   ========================================================== */
import { useEffect } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { t } from "../../i18n/idioma.js";
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import ChatIA from "../../componentes/ChatIA.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import Orientador from "./Orientador.jsx";
import FormContacto from "./FormContacto.jsx";
import { Destacados, RutaLista } from "./Catalogo.jsx";

/* Mentores (perfiles ficticios del proyecto académico) */
const MENTORES = [
  { iniciales: "CO", nombre: "Camila Ospino", perfil: "Ingeniera de software. Desarrollo web." },
  { iniciales: "DB", nombre: "Daniel Barrios", perfil: "Ingeniero de sistemas. Programación y datos." },
  { iniciales: "VH", nombre: "Valeria De la Hoz", perfil: "Especialista en IA aplicada a negocios." },
  { iniciales: "AP", nombre: "Andrés Pacheco", perfil: "Ingeniero electrónico. Electrónica y robótica." },
  { iniciales: "LM", nombre: "Laura Mendoza", perfil: "Tecnóloga en sistemas y redes. Hardware e IoT." },
];

const ENLACES = [
  { href: "cursos.html", texto: "Cursos" },
  { href: "#metodo", texto: "Cómo se aprende" },
  { href: "#nosotros", texto: "Nosotros" },
  { href: "#preguntas", texto: "Preguntas" },
  { href: "#contacto", texto: "Contacto" },
];

/* Edad mínima: sale del catálogo (cada curso la define en el panel) */
function calcularEdades(cursos) {
  const edades = cursos.map((c) => Number(c.edadMinima ?? 14)).filter((n) => n > 0);
  if (!edades.length) return { minima: 14, habitual: 14 };
  const frecuencia = edades.reduce((m, n) => m.set(n, (m.get(n) || 0) + 1), new Map());
  const habitual = [...frecuencia].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { minima: Math.min(...edades), habitual };
}

export default function Inicio() {
  const { modelo } = useDatos();
  const cursos = modelo.cursos();
  const edades = calcularEdades(cursos);
  // Mientras llega el catálogo se muestran las cifras del plan de cursos
  // El hero detiene sus animaciones cuando sale de la pantalla (ahorra batería)
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero || !("IntersectionObserver" in window)) return;
    const vigia = new IntersectionObserver(([e]) => hero.classList.toggle("hero-fuera", !e.isIntersecting));
    vigia.observe(hero);
    return () => vigia.disconnect();
  }, []);
  const cifras = cursos.length ? { cursos: cursos.length, modulos: cursos.reduce((total, c) => total + (c.modulos || []).length, 0) } : { cursos: 12, modulos: 96 };

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li className="nav-acciones"><a href="admin/login.html" className="btn btn-outline">Ingresar</a><a href="#empieza" className="btn btn-primary">Inscríbete</a></li>} />
      <main id="contenido">
      {/* Hero: qué es, para quién y qué ves por dentro (un módulo real del primer curso) */}
      <section className="hero" aria-labelledby="hero-titulo">
        <div className="container hero-grid">
          <div className="hero-texto">
            <p className="eyebrow">Cursos gratuitos · Barranquilla y en línea</p>
            <h1 id="hero-titulo">Aprende tecnología desde cero, con mentores y sin pagar un peso.</h1>
            <p className="hero-lead">Talento Caribe es una escuela de software y hardware para jóvenes del Caribe y Latinoamérica. Clases en español, presenciales o virtuales, y un proyecto propio al terminar cada curso.</p>
            <div className="hero-acciones">
              <a href="#empieza" className="btn btn-primary btn-flecha">Encuentra tu curso</a>
              <a href="cursos.html" className="btn btn-outline">Ver los 12 cursos</a>
            </div>
            <ul className="hero-garantias">
              <li>No necesitas experiencia previa</li>
              <li>{t("Desde los {n} años", { n: edades.minima })}</li>
              <li>Certificado al terminar</li>
            </ul>
          </div>

          <figure className="modulo-muestra" aria-labelledby="muestra-titulo">
            <div className="muestra-cabecera">
              <span className="muestra-curso">Lógica de programación</span>
              <span className="muestra-modulo">Módulo 1 de 8</span>
            </div>
            <div className="muestra-cuerpo">
              <h2 id="muestra-titulo" className="muestra-titulo">Pensar en pasos</h2>
              <div className="muestra-avance">
                <span>Semana 1 de 2</span>
                <span className="muestra-barra" aria-hidden="true"><span></span></span>
              </div>
              <ul className="muestra-temas" aria-label="Temas del módulo">
                <li className="hecho">Problema y entradas</li>
                <li className="hecho">Proceso</li>
                <li className="actual">Resultados</li>
                <li>Secuencias</li>
              </ul>
              <div className="muestra-ejercicio">
                <p className="muestra-etiqueta">Ejercicio de la clase · PSeInt</p>
                <pre data-no-traducir><code><b>Algoritmo</b> Saludo{"\n    "}<b>Escribir</b> <i>"¿Cómo te llamas?"</i>{"\n    "}<b>Leer</b> nombre{"\n    "}<b>Escribir</b> <i>"Hola, "</i>, nombre{"\n"}<b>FinAlgoritmo</b></code></pre>
              </div>
              <p className="muestra-entrega"><strong>Entregable:</strong> tu primer algoritmo y una ficha de entradas, proceso y salidas.</p>
            </div>
            <figcaption>Así se ve un módulo por dentro.</figcaption>
          </figure>
        </div>
      </section>

      {/* Cifras: los números salen del catálogo y cuentan al aparecer (data-contar) */}
      <section className="cifras" aria-label="Talento Caribe en cifras">
        <div className="container cifras-grid">
          <div className="cifra"><strong data-contar>{cifras.cursos}</strong><span>cursos gratuitos</span></div>
          <div className="cifra"><strong data-contar>{cifras.modulos}</strong><span>módulos prácticos</span></div>
          <div className="cifra"><strong data-contar>{MENTORES.length}</strong><span>mentores que te acompañan</span></div>
          <div className="cifra"><strong>0</strong><span>pesos de matrícula</span></div>
        </div>
      </section>

      {/* Orientador: dos preguntas y una recomendación (componente Orientador) */}
      <section id="empieza" className="section" aria-labelledby="empieza-titulo">
        <div className="container orientador">
          <div className="orientador-texto" data-revelar>
            <span className="eyebrow">Orientación</span>
            <h2 id="empieza-titulo">¿No sabes por dónde empezar? Responde dos preguntas.</h2>
            <p>Te mostramos el curso que mejor encaja contigo, con su fecha de inicio. No necesitas registrarte para verlo.</p>
          </div>
          <Orientador />
        </div>
      </section>

      {/* Rutas: los cursos de cada área en orden sugerido (componente RutaLista, desde el catálogo) */}
      <section id="rutas" className="section section-alt" aria-labelledby="rutas-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Rutas de aprendizaje</span>
            <h2 id="rutas-titulo">Dos rutas, doce cursos</h2>
            <p className="section-intro">Cada curso tiene 8 módulos de dos semanas. Puedes tomar uno solo o seguir la ruta completa, en el orden que te sugerimos.</p>
          </div>
          <div className="rutas">
            <article className="ruta-area" data-revelar>
              <header className="ruta-cabecera">
                <h3>Software</h3>
                <p>Programación, web, datos e inteligencia artificial.</p>
              </header>
              <RutaLista area="Software" />
            </article>
            <article className="ruta-area ruta-hardware" data-revelar>
              <header className="ruta-cabecera">
                <h3>Hardware</h3>
                <p>Electrónica, computadores, robótica e internet de las cosas.</p>
              </header>
              <RutaLista area="Hardware" />
            </article>
          </div>
        </div>
      </section>

      {/* Método: el ritmo de cada módulo (mismo guion de clase que usan los docentes, sesionesDe en src/lib/cursos.js) */}
      <section id="metodo" className="section" aria-labelledby="metodo-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Cómo se aprende</span>
            <h2 id="metodo-titulo">Cada módulo dura dos semanas y siempre sigue el mismo ritmo</h2>
            <p className="section-intro">Una clase de 90 minutos por semana. La primera es para entender y practicar con ayuda; la segunda, para resolver un reto por tu cuenta y mostrarlo.</p>
          </div>
          <div className="semanas">
            <article className="semana" data-revelar>
              <h3><span>Semana 1</span> Entender y practicar</h3>
              <div className="semana-barra" aria-hidden="true">
                <span style={{"--min": "10"}}></span><span style={{"--min": "25"}}></span><span style={{"--min": "20"}}></span><span className="practica" style={{"--min": "25"}}></span><span style={{"--min": "10"}}></span>
              </div>
              <ol className="semana-pasos">
                <li><strong>Apertura</strong><span>10 min</span><p>Una pregunta sobre algo cotidiano para entrar en el tema.</p></li>
                <li><strong>Explicación</strong><span>25 min</span><p>El concepto en palabras sencillas y con un caso concreto.</p></li>
                <li><strong>Demostración</strong><span>20 min</span><p>El mentor resuelve el ejercicio paso a paso, en voz alta.</p></li>
                <li className="practica"><strong>Práctica guiada</strong><span>25 min</span><p>Haces el mismo ejercicio con apoyo y pausas para revisar.</p></li>
                <li><strong>Cierre</strong><span>10 min</span><p>Cuentas qué entendiste y qué error lograste corregir.</p></li>
              </ol>
            </article>
            <article className="semana" data-revelar>
              <h3><span>Semana 2</span> Aplicar y mostrar</h3>
              <div className="semana-barra" aria-hidden="true">
                <span style={{"--min": "10"}}></span><span style={{"--min": "10"}}></span><span className="practica" style={{"--min": "40"}}></span><span className="practica" style={{"--min": "20"}}></span><span style={{"--min": "10"}}></span>
              </div>
              <ol className="semana-pasos">
                <li><strong>Repaso</strong><span>10 min</span><p>Tres ideas clave con preguntas rápidas.</p></li>
                <li><strong>Revisión guiada</strong><span>10 min</span><p>Reconstruyen juntos los pasos y aclaran dudas.</p></li>
                <li className="practica"><strong>Reto aplicado</strong><span>40 min</span><p>Una variación del ejercicio que resuelves tú.</p></li>
                <li className="practica"><strong>Revisión entre pares</strong><span>20 min</span><p>Intercambias tu trabajo con un compañero y se dan sugerencias.</p></li>
                <li><strong>Entrega</strong><span>10 min</span><p>Aplicas una mejora y entregas la evidencia del módulo.</p></li>
              </ol>
            </article>
          </div>
          <p className="semanas-nota" data-revelar><span className="semana-leyenda" aria-hidden="true"></span> Más de la mitad del tiempo de clase es práctica: tú con las manos en el código o en el circuito.</p>
        </div>
      </section>

      {/* Cómo funciona: de la inscripción al certificado (es una secuencia, por eso es una lista ordenada) */}
      <section id="como-funciona" className="section section-alt" aria-labelledby="pasos-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">El proceso</span>
            <h2 id="pasos-titulo">De la inscripción al certificado</h2>
          </div>
          <ol className="pasos" data-escalonar>
            <li><h3>Elige tu curso</h3><p>Usa el orientador o revisa el catálogo: modalidad, horario y fecha de inicio de cada grupo.</p><span className="paso-tiempo">5 minutos</span></li>
            <li><h3>Inscríbete</h3><p>Crea tu cuenta y envía la solicitud. Si eres menor de edad, te pedimos los datos de un acudiente.</p><span className="paso-tiempo">10 minutos</span></li>
            <li><h3>Aprende y construye</h3><p>Ocho módulos con clases guiadas y una entrega en cada uno. Tu mentor revisa tu avance.</p><span className="paso-tiempo">16 semanas</span></li>
            <li><h3>Presenta tu proyecto</h3><p>Terminas con un proyecto propio, tu certificado y la recomendación del siguiente curso.</p><span className="paso-tiempo">Al terminar</span></li>
          </ol>
        </div>
      </section>

      {/* Cursos con inscripciones abiertas: el componente Destacados los toma del catálogo; mientras tanto se ven tarjetas esqueleto. */}
      <section id="cursos" className="section" aria-labelledby="cursos-titulo">
        <div className="container">
          <div className="section-cabecera section-cabecera-fila" data-revelar>
            <div>
              <span className="eyebrow">Inscripciones abiertas</span>
              <h2 id="cursos-titulo">Empieza por uno de estos cursos</h2>
              <p className="section-intro">Cada curso termina con un proyecto que tú construyes.</p>
            </div>
            <a href="cursos.html" className="btn btn-outline btn-flecha">Ver todo el catálogo</a>
          </div>
          <Destacados />
        </div>
      </section>

      {/* Mentores (perfiles ficticios del proyecto académico) */}
      <section id="mentores" className="section section-alt" aria-labelledby="mentores-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Mentores</span>
            <h2 id="mentores-titulo">Quiénes te acompañan</h2>
            <p className="section-intro">Profesionales de la región que enseñan lo que hacen en su trabajo y revisan tus entregas.</p>
          </div>
          <ul className="mentores" data-escalonar>
            {MENTORES.map((m) => <li className="mentor" key={m.iniciales}><span className="avatar" aria-hidden="true">{m.iniciales}</span><h3>{m.nombre}</h3><p>{m.perfil}</p></li>)}
          </ul>
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="section" aria-labelledby="nosotros-titulo">
        <div className="container nosotros-grid">
          <div className="nosotros-texto" data-revelar>
            <span className="eyebrow">Nosotros</span>
            <h2 id="nosotros-titulo">Una plataforma joven con una idea clara</h2>
            <p>Talento Caribe nació en 2026 en Barranquilla, de la mano de José Rodríguez, estudiante de Análisis y Desarrollo de Software. Mientras avanzaba en su formación, José notó algo que se repetía a su alrededor: en la región sobran talento y curiosidad por la tecnología, pero muchos jóvenes no encuentran un lugar donde aprender gratis, en español y con ejemplos cercanos a su realidad. Los cursos suelen costar dinero, estar en otro idioma o quedar lejos de casa.</p>
            <p>Con esa observación como punto de partida, José se propuso crear ese lugar. Diseñó desde cero una ruta de cursos de software y hardware pensada para principiantes, construyó la plataforma web que la sostiene y conformó un pequeño equipo de mentores dispuestos a acompañar a los estudiantes.</p>
            <p>Hoy Talento Caribe es una iniciativa joven, en etapa de lanzamiento, y no pretende ser grande de entrada. Su plan es empezar con grupos reducidos en Barranquilla, aprender de la primera cohorte piloto, ajustar los cursos con lo que esa experiencia enseñe y crecer paso a paso hacia otras ciudades del Caribe y de Latinoamérica gracias al formato virtual. De ahí su lema: porque el talento no tiene fronteras, la oportunidad de desarrollarlo tampoco debería tenerlas.</p>
          </div>
          <div className="pilares" data-escalonar>
            <article className="pilar">
              <h3>Misión</h3>
              <p>Formar a jóvenes del Caribe y de Latinoamérica en habilidades de software y hardware mediante cursos gratuitos, prácticos y acompañados por mentores, para que puedan estudiar, emprender o conseguir empleo en tecnología.</p>
            </article>
            <article className="pilar">
              <h3>Visión</h3>
              <p>Ser, en 2030, la comunidad de referencia en formación tecnológica juvenil del Caribe y de Latinoamérica: un lugar donde los jóvenes descubran su vocación, desarrollen sus habilidades y encuentren oportunidades reales sin tener que irse de su tierra ni pagar por aprender.</p>
            </article>
            <article className="pilar">
              <h3>Valores</h3>
              <p>Acceso para todos, aprender haciendo, comunidad e identidad caribeña.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes: <details> funciona sin JavaScript y con teclado */}
      <section id="preguntas" className="section section-alt" aria-labelledby="preguntas-titulo">
        <div className="container preguntas-grid">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 id="preguntas-titulo">Lo que casi todos preguntan antes de inscribirse</h2>
            <p className="section-intro">¿Tu duda no está aquí? Pregúntale al asistente o escríbenos.</p>
          </div>
          <div className="preguntas" data-revelar>
            <details open>
              <summary>¿De verdad es gratis?</summary>
              <p>Sí. Los cursos y el certificado no tienen costo: no cobramos matrícula ni mensualidades.</p>
            </details>
            <details>
              <summary>¿Necesito saber programar?</summary>
              <p>No. Los cursos de nivel básico empiezan desde cero. Si nunca has programado, te sugerimos Lógica de programación o HTML y CSS.</p>
            </details>
            <details>
              <summary>¿Qué edad debo tener?</summary>
              <p>{t("La mayoría de cursos reciben estudiantes desde los {n} años; la edad exacta aparece en la ficha de cada curso. Si eres menor de edad, en la inscripción te pedimos los datos de tu acudiente.", { n: edades.habitual })}</p>
            </details>
            <details>
              <summary>¿Las clases son presenciales o virtuales?</summary>
              <p>Depende del curso. Cada uno indica su modalidad (presencial, virtual o híbrida) y su jornada: mañana, tarde, noche o sábados.</p>
            </details>
            <details>
              <summary>¿Cuánto tiempo le tengo que dedicar?</summary>
              <p>Un curso dura 16 semanas, con una clase de 90 minutos por semana. Además, conviene reservar un rato para terminar las entregas de cada módulo.</p>
            </details>
            <details>
              <summary>¿Qué recibo al terminar?</summary>
              <p>Un proyecto propio que puedes mostrar, tu certificado y la recomendación del siguiente curso de la ruta.</p>
            </details>
          </div>
        </div>
      </section>

      <section id="asistente" className="section" aria-labelledby="asistente-titulo">
        <div className="container asistente-grid">
          <div data-revelar="izquierda">
            <span className="eyebrow">Asistente IA</span>
            <h2 id="asistente-titulo">Pregúntale al asistente de Talento Caribe</h2>
            <p>Conoce todos los cursos y te ayuda a elegir por dónde empezar. Cuéntale qué te gusta y qué sabes hacer.</p>
            <ul className="lista-check"><li>Te recomienda una ruta según tus intereses.</li><li>Te explica conceptos con ejemplos del Caribe.</li><li>Te pone retos rápidos para practicar.</li></ul>
          </div>
          <ChatIA modo="inicio" className="chat-completo chat-inicio" id="chat-inicio" data-revelar="derecha" />
        </div>
      </section>

      <section id="contacto" className="section section-alt" aria-labelledby="contacto-titulo">
        <div className="container contacto-grid">
          <div className="contacto-info" data-revelar="izquierda">
            <span className="eyebrow">Contacto</span>
            <h2 id="contacto-titulo">Escríbenos</h2>
            <p>¿Dudas sobre un curso, quieres ser mentor o tienes una alianza en mente? Respondemos en un máximo de 3 días hábiles.</p>
            <address>
              Barranquilla, Colombia<br />
              <a href="mailto:contacto@talentocaribe.co">contacto@talentocaribe.co</a>
            </address>
          </div>
          <FormContacto />
        </div>
      </section>

      {/* Cierre: un último empujón antes del contacto */}
      <section className="cta-final" aria-labelledby="cta-titulo">
        <div className="container cta-final-caja" data-revelar>
          <div>
            <h2 id="cta-titulo">Tu primer paso toma cinco minutos.</h2>
            <p>Responde el orientador o explora el catálogo. Las inscripciones de los próximos grupos ya están abiertas.</p>
          </div>
          <div className="cta-final-acciones">
            <a href="#empieza" className="btn btn-primary">Encuentra tu curso</a>
            <a href="cursos.html" className="btn btn-outline">Ver el catálogo</a>
          </div>
        </div>
      </section>

      </main>
      <PiePublico completo />
      <AsistenteFlotante />
    </>
  );
}
