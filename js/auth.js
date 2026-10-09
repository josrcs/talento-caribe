/* Auth local de demostración. En producción debe reemplazarse por autenticación del servidor. */
(() => {
  const KEY = "tc_cuentas_demo";
  const ITERATIONS = 120000;
  const cuentas = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  };
  const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  const perfilPublico = (cuenta) => ({ nombre: cuenta.nombre, pais: cuenta.pais, correo: cuenta.correo, rol: "estudiante", tipo_documento: cuenta.tipo_documento || "", numero_documento: cuenta.numero_documento || "", fecha_nacimiento: cuenta.fecha_nacimiento || "", telefono: cuenta.telefono || "", direccion: cuenta.direccion || "", ciudad: cuenta.ciudad || "", region: cuenta.region || "", codigo_postal: cuenta.codigo_postal || "", ultimo_estudio: cuenta.ultimo_estudio || "", documentos_disponibles: cuenta.documentos_disponibles || [], acudiente_nombre: cuenta.acudiente_nombre || "", acudiente_documento: cuenta.acudiente_documento || "", acudiente_telefono: cuenta.acudiente_telefono || "", acudiente_correo: cuenta.acudiente_correo || "" });
  async function derive(password, salt) {
    if (!crypto?.subtle) throw new Error("Abre el sitio con Live Server o HTTPS para crear una cuenta.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
  }
  async function registrar({ nombre, pais, correo, clave, perfil = {} }) {
    const lista = cuentas(), normalizado = correo.trim().toLowerCase();
    if (lista.some((c) => c.correo.toLowerCase() === normalizado)) throw new Error("Ya existe una cuenta con ese correo. Inicia sesión.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await derive(clave, salt);
    const cuenta = { ...perfil, nombre: nombre.trim(), pais, correo: normalizado, salt: toBase64(salt), passwordHash: toBase64(passwordHash), creado: new Date().toISOString() };
    lista.push(cuenta);
    localStorage.setItem(KEY, JSON.stringify(lista));
    return perfilPublico(cuenta);
  }
  async function autenticar(correo, clave) {
    const cuenta = cuentas().find((c) => c.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!cuenta) return null;
    const candidate = await derive(clave, fromBase64(cuenta.salt));
    if (toBase64(candidate) !== cuenta.passwordHash) return null;
    return perfilPublico(cuenta);
  }
  function actualizarPerfil(perfil) {
    const actual = JSON.parse(localStorage.getItem("tc_sesion_demo") || "null");
    if (!actual || actual.rol !== "estudiante") throw new Error("Inicia sesión como estudiante para completar tu perfil.");
    const lista = cuentas(), index = lista.findIndex((cuenta) => cuenta.correo.toLowerCase() === actual.correo.toLowerCase());
    if (index >= 0) { lista[index] = { ...lista[index], ...perfil }; localStorage.setItem(KEY, JSON.stringify(lista)); }
    const actualizado = { ...actual, ...perfil, rol: "estudiante" };
    if (index < 0) {
      let perfiles = []; try { perfiles = JSON.parse(localStorage.getItem("tc_perfiles_demo") || "[]"); } catch { perfiles = []; }
      const profileIndex = perfiles.findIndex((item) => item.correo.toLowerCase() === actualizado.correo.toLowerCase());
      if (profileIndex >= 0) perfiles[profileIndex] = actualizado; else perfiles.push(actualizado);
      localStorage.setItem("tc_perfiles_demo", JSON.stringify(perfiles));
    }
    localStorage.setItem("tc_sesion_demo", JSON.stringify(actualizado));
    return actualizado;
  }
  /* ---------- Con servidor (PostgreSQL): la API cifra y valida todo ---------- */
  const API = window.TC?.MODO_DEMO === false;
  async function api(metodo, ruta, cuerpo, token) {
    let r;
    try {
      r = await fetch(TC.API_URL + ruta, { method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    } catch { throw new Error("No hay conexión con el servidor. ¿Está encendido (npm start)?"); }
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(datos.error || "No pudimos completar la operación."); e.status = r.status; e.campos = datos.campos; throw e; }
    return datos;
  }
  const conToken = ({ token, usuario }) => ({ ...usuario, token });
  const sesionActual = () => { try { return JSON.parse(localStorage.getItem("tc_sesion_demo") || "null"); } catch { return null; } };
  const apiAuth = {
    registrar: async ({ clave, perfil = {}, ...resto }) => conToken(await api("POST", "/auth/registro", { ...perfil, ...resto, clave })),
    autenticar: async (correo, clave, rol = "estudiante", puesto) => {
      try { return conToken(await api("POST", "/auth/login", { correo, clave, rol, puesto })); }
      catch (e) { if (e.status === 401) return null; throw e; }
    },
    actualizarPerfil: async (perfil) => {
      const actual = sesionActual();
      if (!actual?.token || actual.rol !== "estudiante") throw new Error("Inicia sesión como estudiante para completar tu perfil.");
      const usuario = await api("PUT", "/auth/perfil", perfil, actual.token);
      const actualizado = { ...actual, ...usuario, token: actual.token };
      localStorage.setItem("tc_sesion_demo", JSON.stringify(actualizado));
      return actualizado;
    }
  };
  window.TCAuth = API ? { ...apiAuth, api: true } : { registrar, autenticar, actualizarPerfil: async (p) => actualizarPerfil(p), api: false };
})();
