/* requisitos.js - Documentos habituales por país para la preinscripción.
   Es una guía orientativa: la institución confirma los requisitos al abrir la matrícula. */

export const PAISES = ["Colombia", "Venezuela", "Ecuador", "Perú", "México", "Argentina", "Chile"];

export const GUIAS = {
  Colombia: {
    docs: ["Cédula de ciudadanía", "Tarjeta de identidad", "Cédula de extranjería", "PEP (Permiso Especial de Permanencia)"],
    texto: "Ten a mano tu documento de identidad, un certificado o boletín de estudios y, si lo tienes, un comprobante de afiliación a salud. Para menores de edad, prepara también los datos de madre, padre o acudiente. La institución confirmará lo que necesita para el curso.",
    fuente: "https://www.mineducacion.gov.co/1759/articles-407325_recurso_1.pdf",
    fuenteTexto: "orientación de matrícula del Ministerio de Educación de Colombia",
    fuenteCorta: "Ministerio de Educación de Colombia",
  },
  Venezuela: { docs: ["Cédula de identidad", "Pasaporte", "Documento de identidad de otro país"], texto: "Ten a mano tu cédula o pasaporte y, si ya estudiaste, una constancia, certificado o notas del último nivel aprobado. Si resides fuera de Venezuela, usa el documento válido en tu país de residencia. La institución confirmará si requiere equivalencias." },
  Ecuador: {
    docs: ["Cédula de identidad", "Pasaporte", "Documento de identidad de otro país"],
    texto: "Ten a mano tu documento de identidad y los certificados de promoción o constancias de los cursos aprobados, si los tienes. Si estudiaste en otro país, pregunta al equipo si hace falta un trámite de reconocimiento.",
    fuente: "https://adistancia.educacion.gob.ec/sistema-de-matricula-a-distancia-virtual/",
    fuenteTexto: "sistema de matrícula del Ministerio de Educación de Ecuador",
    fuenteCorta: "Ministerio de Educación de Ecuador",
  },
  "Perú": { docs: ["DNI", "Carné de extranjería", "Pasaporte", "Documento de identidad de otro país"], texto: "Ten a mano tu DNI u otro documento de identidad y una constancia o certificado de tus estudios previos, si corresponde. La institución confirmará si necesita documentos adicionales o reconocimiento de estudios extranjeros." },
  "México": {
    docs: ["CURP", "Acta de nacimiento", "Pasaporte", "Documento de identidad de otro país"],
    texto: "Para estudios escolares formales en México suelen solicitar CURP y acta de nacimiento o documento equivalente; también puede pedirse el certificado del nivel previo. Para estos cursos, prepara el documento de identidad y tu última constancia de estudios; confirma requisitos con el equipo.",
    fuente: "https://prepaabierta.sep.gob.mx/inscribete",
    fuenteTexto: "requisitos de Preparatoria Abierta de la SEP de México",
    fuenteCorta: "Preparatoria Abierta de la SEP, México",
  },
  Argentina: { docs: ["DNI", "Pasaporte", "Documento de identidad de otro país"], texto: "Ten a mano tu DNI o pasaporte y una constancia o certificado del último nivel cursado, si lo tienes. Los requisitos de equivalencia dependen del tipo de curso y de la institución." },
  Chile: { docs: ["Cédula de identidad (RUN/RUT)", "Pasaporte", "Documento de identidad de otro país"], texto: "Ten a mano tu cédula de identidad o pasaporte y, si corresponde, una constancia o certificado de estudios previos. La institución confirmará si requiere reconocimiento de estudios." },
  Otro: { docs: ["Documento nacional de identidad", "Cédula o tarjeta de identidad", "Pasaporte"], texto: "Ten a mano un documento oficial de identidad y, si ya has estudiado, una constancia, certificado o calificaciones del último nivel aprobado. Si eres menor de edad, prepara los datos de tu madre, padre o acudiente. Los requisitos cambian según el país y el curso." },
};

export const ESTUDIOS = ["Primaria", "Secundaria o bachillerato", "Técnico o tecnológico", "Universitario", "Otro o en curso", "Prefiero no indicarlo"];

export const DOCUMENTOS_ACADEMICOS = [
  ["acta_nacimiento", "Registro civil / acta de nacimiento (si aplica)"],
  ["domicilio", "Comprobante de domicilio (si aplica)"],
  ["certificado", "Certificado o constancia de estudios"],
  ["calificaciones", "Boletín o certificado de calificaciones"],
  ["acudiente", "Documento de madre, padre o acudiente (si eres menor)"],
  ["ninguno", "Aún no tengo esos documentos"],
];
