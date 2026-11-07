/* validacion.jsx - Validación de formularios (no controlados: los valores se leen de form.elements)
   const { validar, error, invalido, limpiar } = useValidacion();
   if (!validar(e.currentTarget, { correo: (v) => (EMAIL.test(v) ? "" : "Escribe un correo válido.") })) return;
   <input name="correo" aria-invalid={invalido("correo")} />  {error("correo")}
   La regla recibe el valor (o true/false en una casilla) y el formulario, y devuelve el mensaje de error o "". */
import { useCallback, useState } from "react";

export function useValidacion() {
  const [errores, setErrores] = useState({});
  const validar = useCallback((form, reglas) => {
    const nuevos = {};
    let primero = null;
    for (const [campo, regla] of Object.entries(reglas)) {
      const el = form.elements[campo];
      const valor = el?.type === "checkbox" ? el.checked : String(el?.value ?? "").trim();
      const msg = regla(valor, form);
      if (msg) { nuevos[campo] = msg; primero ??= el; }
    }
    setErrores(nuevos);
    primero?.focus?.();
    return !primero;
  }, []);
  const limpiar = useCallback(() => setErrores({}), []);
  const invalido = (campo) => (errores[campo] ? "true" : undefined);
  const error = (campo) => <small className="error" hidden={!errores[campo]}>{errores[campo]}</small>;
  return { errores, validar, limpiar, invalido, error, setErrores };
}
