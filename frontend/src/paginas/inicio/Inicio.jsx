/* ==========================================================
   Inicio.jsx - Página de inicio (index.html) · Piloto 2027
   Hero, cifras, la ruta «Programación desde cero» (5 módulos), calendario,
   cómo se aprende, proceso, mentores (buscamos mentores), Súmate, nosotros,
   preguntas frecuentes, asistente IA y contacto.
   Piloto: presencial en Barranquilla, solo para personas en Colombia, y cada
   módulo dura 1 semana (fuera del piloto, 2). Al terminar se entrega una
   constancia de participación (no un certificado: eso exige el aval de la
   Secretaría de Educación).
   ========================================================== */
import { useEffect, useState } from "react";
import { useDatos } from "../../contexto/Datos.jsx";
import { t } from "../../i18n/idioma.js";
import EncabezadoPublico from "../../componentes/EncabezadoPublico.jsx";
import PiePublico from "../../componentes/PiePublico.jsx";
import ChatIA from "../../componentes/ChatIA.jsx";
import AsistenteFlotante from "../../componentes/AsistenteFlotante.jsx";
import FormContacto from "./FormContacto.jsx";
import Sumate from "./Sumate.jsx";
import { RutaPiloto } from "./Catalogo.jsx";
import { PILOTO, soloRuta } from "../../lib/piloto.js";

const ENLACES = [
  { href: "#ruta", texto: "La ruta" },
  { href: "#calendario", texto: "Calendario" },
  { href: "#mentores", texto: "Mentores" },
  { href: "#sumate", texto: "Súmate" },
  { href: "#preguntas", texto: "Preguntas" },
  { href: "#contacto", texto: "Contacto" },
];
const INSCRIBIRME = "cursos.html?inscribirme=1";

/* Edad mínima: sale de los módulos de la ruta (cada uno la define en el panel) */
function calcularEdades(cursos) {
  const edades = cursos.map((c) => Number(c.edadMinima ?? 14)).filter((n) => n > 0);
  if (!edades.length) return { minima: 14, habitual: 14 };
  const frecuencia = edades.reduce((m, n) => m.set(n, (m.get(n) || 0) + 1), new Map());
  const habitual = [...frecuencia].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { minima: Math.min(...edades), habitual };
}

export default function Inicio() {
  const { modelo } = useDatos();
  const ruta = soloRuta(modelo.cursos());
  const edades = calcularEdades(ruta);
  const [pedidoContacto, setPedidoContacto] = useState(null); // lo que eligió la persona en "Súmate" o "Mentores"
  const pedir = (interes, asunto) => setPedidoContacto({ interes, asunto, n: Date.now() });
  // El hero detiene sus animaciones cuando sale de la pantalla (ahorra batería)
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero || !("IntersectionObserver" in window)) return;
    const vigia = new IntersectionObserver(([e]) => hero.classList.toggle("hero-fuera", !e.isIntersecting));
    vigia.observe(hero);
    return () => vigia.disconnect();
  }, []);
  const modulos = PILOTO.ruta.length;
  const clases = ruta.length ? ruta.reduce((total, c) => total + (c.modulos || []).length, 0) : modulos * 2;

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <EncabezadoPublico enlaces={ENLACES} ultimo={<li className="nav-acciones"><a href="admin/login.html" className="btn btn-outline">Ingresar</a><a href={INSCRIBIRME} className="btn btn-primary">Inscríbete</a></li>} />
      <main id="contenido">
      {/* Hero: qué es el piloto y qué ves por dentro (una clase real del primer módulo) */}
      <section className="hero" aria-labelledby="hero-titulo">
        <div className="container hero-grid">
          <div className="hero-texto">
            <p className="eyebrow">Piloto 2027 · Barranquilla · Gratis</p>
            <h1 id="hero-titulo">Aprende a programar desde cero, gratis y en Barranquilla.</h1>
            <p className="hero-lead">Talento Caribe abre su primer piloto: la ruta «Programación desde cero», con 5 módulos presenciales. Empiezas con lógica de programación y terminas creando tu página web y tu primera base de datos.</p>
            <div className="hero-acciones">
              <a href={INSCRIBIRME} className="btn btn-primary btn-flecha">Inscríbete a la ruta</a>
              <a href="#ruta" className="btn btn-outline">Ver la ruta</a>
            </div>
            <ul className="hero-garantias">
              <li>No necesitas experiencia previa</li>
              <li>{t("Desde los {n} años", { n: edades.minima })}</li>
              <li>Clases presenciales en Barranquilla</li>
            </ul>
          </div>

          <figure className="modulo-muestra" aria-labelledby="muestra-titulo">
            <div className="muestra-cabecera">
              <span className="muestra-curso">Lógica de programación</span>
              <span className="muestra-modulo">Módulo 1 de 5</span>
            </div>
            <div className="muestra-cuerpo">
              <h2 id="muestra-titulo" className="muestra-titulo">Pensar en pasos</h2>
              <div className="muestra-avance">
                <span>Clase 1 de 2</span>
                <span className="muestra-barra" aria-hidden="true"><span></span></span>
              </div>
              <ul className="muestra-temas" aria-label="Temas de la clase">
                <li className="hecho">Problema, entradas y salidas</li>
                <li className="actual">Algoritmos y pseudocódigo</li>
                <li>Diagramas de flujo</li>
              </ul>
              <div className="muestra-ejercicio">
                <p className="muestra-etiqueta">Ejercicio de la clase · PSeInt</p>
                <pre data-no-traducir><code><b>Algoritmo</b> Saludo{"\n    "}<b>Escribir</b> <i>"¿Cómo te llamas?"</i>{"\n    "}<b>Leer</b> nombre{"\n    "}<b>Escribir</b> <i>"Hola, "</i>, nombre{"\n"}<b>FinAlgoritmo</b></code></pre>
              </div>
              <p className="muestra-entrega"><strong>Entregable:</strong> tu primer algoritmo, escrito paso a paso.</p>
            </div>
            <figcaption>Así se ve una clase por dentro.</figcaption>
          </figure>
        </div>
      </section>

      {/* Cifras del piloto */}
      <section className="cifras" aria-label="El piloto en cifras">
        <div className="container cifras-grid">
          <div className="cifra"><strong data-contar>{modulos}</strong><span>módulos en la ruta</span></div>
          <div className="cifra"><strong data-contar>{PILOTO.semanasPorModulo}</strong><span>semana por módulo en el piloto</span></div>
          <div className="cifra"><strong data-contar>{clases}</strong><span>clases prácticas</span></div>
          <div className="cifra"><strong>0</strong><span>pesos de matrícula</span></div>
        </div>
      </section>

      {/* La ruta: 5 módulos en orden (componente RutaPiloto) */}
      <section id="ruta" className="section" aria-labelledby="ruta-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">La ruta del piloto</span>
            <h2 id="ruta-titulo">Programación desde cero, en 5 módulos</h2>
            <p className="section-intro">Una sola ruta, pensada para que un joven aprenda a programar sin saber nada. Cada módulo usa lo que aprendiste en el anterior: de pensar en pasos a crear tu página web con su base de datos.</p>
          </div>
          <RutaPiloto />
          <p className="aviso-piloto aviso-piloto-grande" role="note" data-revelar><strong>En la fase piloto cada módulo dura 1 semana.</strong> Normalmente cada módulo dura 2 semanas; en el piloto lo hacemos en 1 para probar la ruta completa. La ruta del piloto dura en total 5 semanas.</p>
          <div className="ruta-acciones" data-revelar>
            <a href={INSCRIBIRME} className="btn btn-primary btn-flecha">Inscríbete a la ruta</a>
            <a href="cursos.html" className="btn btn-outline">Ver el detalle de cada módulo</a>
          </div>
        </div>
      </section>

      {/* Calendario: cuándo se hace el piloto y qué viene después */}
      <section id="calendario" className="section section-alt" aria-labelledby="calendario-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Calendario</span>
            <h2 id="calendario-titulo">¿Cuándo empiezan las clases?</h2>
            <p className="section-intro">Los grupos del piloto se harán durante el primer y el segundo trimestre de 2027. Te avisaremos por correo la fecha y el horario de tu grupo.</p>
          </div>
          <ol className="calendario" data-escalonar>
            <li className="calendario-paso is-ahora">
              <span className="calendario-cuando">Hoy</span>
              <h3>Inscripciones abiertas</h3>
              <p>Crea tu cuenta e inscríbete a la ruta.</p>
            </li>
            <li className="calendario-paso">
              <span className="calendario-cuando">Enero a marzo de 2027</span>
              <h3>Primer trimestre</h3>
              <p>Empiezan los primeros grupos en Barranquilla.</p>
            </li>
            <li className="calendario-paso">
              <span className="calendario-cuando">Abril a junio de 2027</span>
              <h3>Segundo trimestre</h3>
              <p>Abrimos más grupos de la ruta.</p>
            </li>
            <li className="calendario-paso is-futuro">
              <span className="calendario-cuando">Después del piloto</span>
              <h3>Llegamos a Latinoamérica</h3>
              <p>Con lo que aprendamos en Barranquilla, nos extenderemos por Latinoamérica.</p>
            </li>
          </ol>
          <div className="aviso-piloto aviso-piloto-grande" role="note" data-revelar>
            <strong>Por ahora, solo Colombia.</strong> Las clases del piloto son presenciales en Barranquilla, así que solo pueden inscribirse personas en Colombia. Si estás en otro país, súmate a la comunidad y te avisaremos cuando lleguemos.
          </div>
        </div>
      </section>

      {/* Método: cómo es cada módulo en el piloto (1 semana, 2 clases) */}
      <section id="metodo" className="section" aria-labelledby="metodo-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">Cómo se aprende</span>
            <h2 id="metodo-titulo">En el piloto, cada módulo dura una semana</h2>
            <p className="section-intro">Cada módulo tiene dos clases presenciales en la semana. En la primera aprendes y practicas; en la segunda construyes y muestras lo que hiciste.</p>
          </div>
          <div className="semanas">
            <article className="semana" data-revelar>
              <h3><span>Clase 1</span> Entender y practicar</h3>
              <ol className="semana-pasos">
                <li><strong>Aprender</strong><p>El tema nuevo en palabras sencillas y con un ejemplo en pantalla.</p></li>
                <li className="practica"><strong>Practicar</strong><p>Lo haces tú, con ayuda, y resuelves tus dudas.</p></li>
              </ol>
            </article>
            <article className="semana" data-revelar>
              <h3><span>Clase 2</span> Construir y mostrar</h3>
              <ol className="semana-pasos">
                <li className="practica"><strong>Construir</strong><p>Un reto más grande que resuelves por tu cuenta.</p></li>
                <li><strong>Mostrar</strong><p>Presentas tu avance, recibes sugerencias y entregas lo del módulo.</p></li>
              </ol>
            </article>
          </div>
          <p className="semanas-nota" data-revelar><span className="semana-leyenda" aria-hidden="true"></span> Más de la mitad del tiempo de clase es práctica: tú con las manos en el código.</p>
        </div>
      </section>

      {/* Cómo funciona: de la inscripción a la constancia de participación */}
      <section id="como-funciona" className="section section-alt" aria-labelledby="pasos-titulo">
        <div className="container">
          <div className="section-cabecera" data-revelar>
            <span className="eyebrow">El proceso</span>
            <h2 id="pasos-titulo">De la inscripción a tu constancia de participación</h2>
          </div>
          <ol className="pasos" data-escalonar>
            <li><h3>Crea tu cuenta</h3><p>Regístrate gratis. Si eres menor de edad, te pedimos los datos de un acudiente.</p><span className="paso-tiempo">10 minutos</span></li>
            <li><h3>Inscríbete a la ruta</h3><p>Envía tu solicitud. El equipo revisa tu cupo.</p><span className="paso-tiempo">5 minutos</span></li>
            <li><h3>Te avisamos</h3><p>Te escribimos al correo con la fecha, el horario y el lugar de tu grupo en Barranquilla.</p><span className="paso-tiempo">Antes de empezar</span></li>
            <li><h3>Aprende y construye</h3><p>Cinco módulos de una semana. Al terminar recibes tu constancia de participación.</p><span className="paso-tiempo">5 semanas</span></li>
          </ol>
        </div>
      </section>

      {/* Mentores: todavía no tenemos; invitamos a sumarse */}
      <section id="mentores" className="section" aria-labelledby="mentores-titulo">
        <div className="container">
          <div className="mentores-convocatoria" data-revelar>
            <div>
              <span className="eyebrow">Mentores</span>
              <h2 id="mentores-titulo">Buscamos mentores para el piloto</h2>
              <p className="section-intro">Todavía no contamos con mentores. Si sabes de programación y quieres acompañar a jóvenes de Barranquilla mientras aprenden desde cero, súmate al piloto 2027.</p>
            </div>
            <a href="#contacto" className="btn btn-primary btn-flecha" onClick={() => pedir("mentor", "Quiero sumarme como mentor")}>Quiero sumarme como mentor</a>
          </div>
        </div>
      </section>

      {/* Súmate a la comunidad: cada opción deja listo el formulario de contacto */}
      <Sumate alElegir={(f) => pedir(f.interes, f.titulo)} />

      {/* Nosotros */}
      <section id="nosotros" className="section" aria-labelledby="nosotros-titulo">
        <div className="container nosotros-grid">
          <div className="nosotros-texto" data-revelar>
            <span className="eyebrow">Nosotros</span>
            <h2 id="nosotros-titulo">Una plataforma joven con una idea clara</h2>
            <p>Talento Caribe nació en 2026 en Barranquilla, de la mano de José Rodríguez, estudiante de Análisis y Desarrollo de Software. Mientras avanzaba en su formación, José notó algo que se repetía a su alrededor: en la región sobran talento y curiosidad por la tecnología, pero muchos jóvenes no encuentran un lugar donde aprender gratis, en español y con ejemplos cercanos a su realidad. Los cursos suelen costar dinero, estar en otro idioma o quedar lejos de casa.</p>
            <p>Con esa observación como punto de partida, José se propuso crear ese lugar. Diseñó una ruta para aprender a programar desde cero y construyó la plataforma web que la sostiene.</p>
            <p>Hoy Talento Caribe empieza con su piloto 2027: grupos pequeños y presenciales en Barranquilla, durante el primer y el segundo trimestre del año. Con lo que enseñe esa primera experiencia, ajustaremos la ruta y nos extenderemos por Latinoamérica. De ahí el lema: porque el talento no tiene fronteras, la oportunidad de desarrollarlo tampoco debería tenerlas.</p>
          </div>
          <div className="pilares" data-escalonar>
            <article className="pilar">
              <h3>Misión</h3>
              <p>Formar a jóvenes del Caribe y de Latinoamérica en tecnología mediante una formación gratuita, práctica y cercana, para que puedan estudiar, emprender o conseguir empleo.</p>
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
              <p>Sí. La ruta no tiene costo: no cobramos matrícula ni mensualidades.</p>
            </details>
            <details>
              <summary>¿Recibo un certificado?</summary>
              <p>Recibes una constancia de participación. No es un certificado oficial: para certificar un curso en Colombia se necesita el aval de la Secretaría de Educación, y en el piloto todavía no lo tenemos. Te lo decimos desde ahora para que sepas exactamente qué recibes.</p>
            </details>
            <details>
              <summary>¿Cuándo empiezan las clases?</summary>
              <p>Durante el primer y el segundo trimestre de 2027. Cuando te inscribas, te avisaremos por correo la fecha y el horario de tu grupo.</p>
            </details>
            <details>
              <summary>¿Dónde son las clases?</summary>
              <p>En Barranquilla, de forma presencial. El lugar exacto te lo enviamos por correo junto con la fecha de tu grupo.</p>
            </details>
            <details>
              <summary>¿Me puedo inscribir desde otro país?</summary>
              <p>Por ahora no: el piloto es solo para personas en Colombia. Después del piloto nos extenderemos por Latinoamérica. Mientras tanto, puedes sumarte a la comunidad y te avisaremos.</p>
            </details>
            <details>
              <summary>¿Necesito saber programar?</summary>
              <p>No. La ruta empieza desde cero con lógica de programación. Solo necesitas ganas de aprender.</p>
            </details>
            <details>
              <summary>¿Qué edad debo tener?</summary>
              <p>{t("La ruta recibe estudiantes desde los {n} años. Si eres menor de edad, en la inscripción te pedimos los datos de tu acudiente.", { n: edades.habitual })}</p>
            </details>
            <details>
              <summary>¿Cuánto tiempo le tengo que dedicar?</summary>
              <p>En el piloto cada módulo dura 1 semana, con 2 clases. La ruta completa son 5 módulos: unas 5 semanas. Después del piloto, cada módulo durará 2 semanas.</p>
            </details>
            <details>
              <summary>¿Qué recibo al terminar?</summary>
              <p>Tu página web con su base de datos, que puedes mostrar, y tu constancia de participación.</p>
            </details>
          </div>
        </div>
      </section>

      <section id="asistente" className="section" aria-labelledby="asistente-titulo">
        <div className="container asistente-grid">
          <div data-revelar="izquierda">
            <span className="eyebrow">Asistente IA</span>
            <h2 id="asistente-titulo">Pregúntale al asistente de Talento Caribe</h2>
            <p>Conoce la ruta del piloto y te ayuda a resolver tus dudas antes de inscribirte.</p>
            <ul className="lista-check"><li>Te explica cada módulo de la ruta.</li><li>Te explica conceptos con ejemplos del Caribe.</li><li>Te pone retos rápidos para practicar.</li></ul>
          </div>
          <ChatIA modo="inicio" className="chat-completo chat-inicio" id="chat-inicio" data-revelar="derecha" />
        </div>
      </section>

      <section id="contacto" className="section section-alt" aria-labelledby="contacto-titulo">
        <div className="container contacto-grid">
          <div className="contacto-info" data-revelar="izquierda">
            <span className="eyebrow">Contacto</span>
            <h2 id="contacto-titulo">Escríbenos</h2>
            <p>¿Dudas sobre el piloto, quieres sumarte o tienes una alianza en mente? Respondemos en un máximo de 3 días hábiles.</p>
            <address>
              Barranquilla, Colombia<br />
              <a href="mailto:contacto@talentocaribe.co">contacto@talentocaribe.co</a>
            </address>
          </div>
          <FormContacto pedido={pedidoContacto} />
        </div>
      </section>

      {/* Cierre: un último empujón */}
      <section className="cta-final" aria-labelledby="cta-titulo">
        <div className="container cta-final-caja" data-revelar>
          <div>
            <h2 id="cta-titulo">Tu primer programa empieza aquí.</h2>
            <p>Las inscripciones del piloto 2027 en Barranquilla ya están abiertas. Te avisaremos la fecha de tu grupo.</p>
          </div>
          <div className="cta-final-acciones">
            <a href={INSCRIBIRME} className="btn btn-primary">Inscríbete a la ruta</a>
            <a href="#sumate" className="btn btn-outline">Súmate a la comunidad</a>
          </div>
        </div>
      </section>

      </main>
      <PiePublico completo />
      <AsistenteFlotante />
    </>
  );
}
