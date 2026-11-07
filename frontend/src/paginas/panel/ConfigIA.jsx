/* ConfigIA.jsx - Tono y contexto del asistente (PUT /api/config-ia; POST /api/chat los usa en cada respuesta) */
import { useState } from "react";
import BotonCarga from "../../componentes/BotonCarga.jsx";
import { useDatos } from "../../contexto/Datos.jsx";
import { toast } from "../../lib/utils.js";
import { intentar } from "./comunes.jsx";

export default function ConfigIA() {
  const { modelo: D, acciones } = useDatos();
  const ia = D.ia() || { tono: "Cercano, motivador y en español sencillo, con orgullo caribeño.", contexto: "" };
  const [ocupado, setOcupado] = useState(false);
  async function guardar(e) {
    e.preventDefault(); const f = e.currentTarget.elements;
    if (await intentar(() => acciones.guardarIA({ tono: f.tono.value, contexto: f.contexto.value }), setOcupado)) toast("Configuración del asistente guardada");
  }
  return (
    <>
      <h1 id="t-ia">Asistente IA</h1>
      <p>Define cómo habla el asistente y qué debe saber de Talento Caribe. Los cursos del catálogo se envían automáticamente.</p>
      <form id="form-ia" className="form" noValidate onSubmit={guardar}>
        <div className="campo"><label htmlFor="ia-tono">Tono de marca</label><textarea id="ia-tono" name="tono" rows="3" maxLength="500" placeholder="Cercano, motivador, en español sencillo y con orgullo caribeño." defaultValue={ia.tono}></textarea></div>
        <div className="campo"><label htmlFor="ia-contexto">Información adicional</label><textarea id="ia-contexto" name="contexto" rows="6" maxLength="2000" placeholder="Horarios, sede, proceso de inscripción, preguntas frecuentes..." defaultValue={ia.contexto}></textarea></div>
        <BotonCarga cargando={ocupado} id="ia-guardar">Guardar cambios</BotonCarga>
      </form>
      <p className="nota-requisitos">Para probar cómo responde, abre la sección «Asistente IA».</p>
    </>
  );
}
