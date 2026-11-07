/* ==========================================================
   Datos.jsx - Contexto de React con los datos de la plataforma
   <DatosProvider> pide GET /api/datos al montar la página y comparte, con
   useDatos(), tres cosas:
   - estado:   { cargando, error }
   - modelo:   consultas sobre los datos (src/lib/modelo.js)
   - acciones: escrituras en la API (crear actividad, entregar, inscribirse...).
               Cada una espera la respuesta del servidor y vuelve a cargar los
               datos, así toda la página se actualiza con lo que quedó en PostgreSQL.
   ========================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { pedir } from "../lib/api.js";
import { VACIO, crearModelo, prepararDatos } from "../lib/modelo.js";

const DatosContext = createContext(null);

export function DatosProvider({ children, cargar = true }) {
  const [estado, setEstado] = useState({ cargando: cargar, error: null, datos: VACIO });
  const datosRef = useRef(VACIO);

  const recargar = useCallback(async () => {
    try {
      const datos = prepararDatos(await pedir("GET", "/datos"));
      datosRef.current = datos;
      setEstado({ cargando: false, error: null, datos });
      return datos;
    } catch (error) {
      setEstado((s) => ({ ...s, cargando: false, error }));
      throw error;
    }
  }, []);
  useEffect(() => { if (cargar) recargar().catch(() => {}); }, [cargar, recargar]);

  const modelo = useMemo(() => crearModelo(estado.datos), [estado.datos]);

  const acciones = useMemo(() => {
    // Envía al servidor y luego recarga los datos
    const y = async (promesa) => { const r = await promesa; await recargar(); return r; };
    const existeCurso = (id) => datosRef.current.cursos.some((x) => Number(x.id) === Number(id));
    return {
      recargar,
      crearActividad: (datos) => y(pedir("POST", "/actividades", datos)),
      actualizarActividad: (id, cambios) => y(pedir("PUT", "/actividades/" + id, cambios)),
      eliminarActividad: (id) => y(pedir("DELETE", "/actividades/" + id)),
      entregar: ({ actividad_id, respuesta, enlace }) => y(pedir("PUT", `/actividades/${actividad_id}/entrega`, { respuesta, enlace })),
      calificar: (id, nota, comentario) => y(pedir("PATCH", "/entregas/" + id, { nota, comentario })),
      inscribir: (curso_id, ficha) => y(pedir("POST", "/inscripciones", { curso_id, ficha })),
      cambiarEstadoInscripcion: (id, estadoNuevo) => y(pedir("PATCH", "/inscripciones/" + id, { estado: estadoNuevo })),
      marcarLeido: (id) => y(pedir("PATCH", `/mensajes/${id}/leido`)),
      registrarGasto: (gasto) => y(pedir("POST", "/gastos", gasto)),
      actualizarGasto: (id, gasto) => y(pedir("PUT", "/gastos/" + id, gasto)),
      eliminarGasto: (id) => y(pedir("DELETE", "/gastos/" + id)),
      responderEncuesta: (id, respuestas) => y(pedir("POST", `/encuestas/${encodeURIComponent(id)}/respuestas`, { respuestas })),
      guardarIA: (config) => y(pedir("PUT", "/config-ia", config)),
      guardarCurso: (c) => y(c.id && existeCurso(c.id) ? pedir("PUT", "/cursos/" + c.id, c) : pedir("POST", "/cursos", c)),
      guardarFicha: ({ existente, ...f }) => y(existente ? pedir("PUT", "/fichas/" + f.numero, f) : pedir("POST", "/fichas", f)),
      fichaEstudiante: (correo) => pedir("GET", "/estudiantes/" + encodeURIComponent(correo)),
    };
  }, [recargar]);

  const valor = useMemo(() => ({ cargando: estado.cargando, error: estado.error, modelo, acciones }), [estado.cargando, estado.error, modelo, acciones]);
  return <DatosContext.Provider value={valor}>{children}</DatosContext.Provider>;
}

export function useDatos() {
  const valor = useContext(DatosContext);
  if (!valor) throw new Error("useDatos() necesita estar dentro de <DatosProvider>.");
  return valor;
}
