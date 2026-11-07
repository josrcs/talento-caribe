/* rutas.js - Enlaces entre páginas. Las páginas de admin/ están un nivel más abajo,
   así que sus enlaces a cursos.html, portal.html... necesitan "../" delante. */
const enAdmin = location.pathname.includes("/admin/");
const PREFIJO = enAdmin ? "../" : "";

/* enlace("cursos.html") -> "cursos.html" o "../cursos.html";  enlace("admin/login.html") -> "admin/login.html" o "login.html" */
export function enlace(pagina) {
  if (enAdmin && pagina.startsWith("admin/")) return pagina.slice(6);
  return PREFIJO + pagina;
}
export const ir = (pagina) => { location.href = enlace(pagina); };
export const parametros = () => new URLSearchParams(location.search);
