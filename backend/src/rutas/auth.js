/* Rutas de cuenta: registro de estudiantes, inicio de sesión y perfil */
const router = require("express").Router();
const pool = require("../db");
const { cifrar, comparar, firmar, CARGOS, requiereSesion, requiereRol } = require("../seguridad");
const { perfilPublico } = require("../consultas");
const { EMAIL, texto, opcional, limpio, fecha, rechazar } = require("../validar");

const CAMPOS_EDITABLES = ["nombre", "pais", "tipo_documento", "numero_documento", "fecha_nacimiento", "telefono", "direccion", "ciudad", "region",
  "codigo_postal", "ultimo_estudio", "acudiente_nombre", "acudiente_documento", "acudiente_telefono", "acudiente_correo"];

function validarPerfil(b) {
  return {
    nombre: texto(b.nombre, 3, 100), pais: opcional(b.pais, 60), tipo_documento: opcional(b.tipo_documento, 60),
    numero_documento: opcional(b.numero_documento, 30), fecha_nacimiento: !b.fecha_nacimiento || fecha(b.fecha_nacimiento),
    telefono: opcional(b.telefono, 30), direccion: opcional(b.direccion, 150), ciudad: opcional(b.ciudad, 80), region: opcional(b.region, 80),
    codigo_postal: opcional(b.codigo_postal, 15), ultimo_estudio: opcional(b.ultimo_estudio, 60),
    acudiente_nombre: opcional(b.acudiente_nombre, 100), acudiente_documento: opcional(b.acudiente_documento, 30),
    acudiente_telefono: opcional(b.acudiente_telefono, 30), acudiente_correo: !b.acudiente_correo || EMAIL.test(b.acudiente_correo),
    documentos_disponibles: b.documentos_disponibles === undefined || (Array.isArray(b.documentos_disponibles) && b.documentos_disponibles.every((d) => texto(d, 1, 80))),
  };
}
const sesion = (u, puesto) => {
  const usuario = { ...perfilPublico(u), puesto: puesto ?? u.puesto ?? "" };
  return { token: firmar({ id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, puesto: usuario.puesto || null }), usuario };
};

// Registro (solo estudiantes: docentes y administrativos los crea la institución)
router.post("/registro", async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, { ...validarPerfil(b), correo: typeof b.correo === "string" && EMAIL.test(b.correo), clave: texto(b.clave, 8, 72) })) return;
  try {
    const valores = CAMPOS_EDITABLES.map((c) => limpio(b[c]));
    const { rows } = await pool.query(
      `INSERT INTO usuarios (correo, clave_hash, rol, documentos_disponibles, ${CAMPOS_EDITABLES.join(", ")})
       VALUES ($1, $2, 'estudiante', $3, ${CAMPOS_EDITABLES.map((_, i) => "$" + (i + 4)).join(", ")}) RETURNING *`,
      [b.correo.trim().toLowerCase(), await cifrar(b.clave), b.documentos_disponibles || [], ...valores]);
    res.status(201).json(sesion(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo. Inicia sesión." });
    next(e);
  }
});

// Inicio de sesión para los tres roles
router.post("/login", async (req, res, next) => {
  const { correo, clave, rol, puesto } = req.body || {};
  if (rechazar(res, { correo: typeof correo === "string" && EMAIL.test(correo), clave: texto(clave, 1, 72), rol: ["estudiante", "docente", "administrativo"].includes(rol) })) return;
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE correo = $1 AND activo", [correo.trim().toLowerCase()]);
    const u = rows[0];
    // Mismo mensaje si el correo no existe o la clave es incorrecta: no revelamos qué cuentas existen
    if (!u || u.rol !== rol || !(await comparar(clave, u.clave_hash))) return res.status(401).json({ error: "Correo o contraseña incorrectos para este tipo de cuenta." });
    let cargo = null;
    if (rol === "administrativo") {
      if (u.puesto) cargo = u.puesto;                      // cuenta con cargo fijo
      else if (CARGOS.includes(puesto)) cargo = puesto;    // cuenta de demostración: elige el cargo
      else return res.status(400).json({ error: "Elige el cargo con el que ingresarás." });
      if (puesto && u.puesto && puesto !== u.puesto) return res.status(403).json({ error: `Tu cuenta está registrada con el cargo «${u.puesto}».` });
    }
    res.json(sesion(u, cargo));
  } catch (e) { next(e); }
});

router.get("/yo", requiereSesion, async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.usuario.id]);
    if (!rows.length) return res.status(401).json({ error: "La cuenta ya no existe." });
    res.json({ ...perfilPublico(rows[0]), puesto: req.usuario.puesto || "" });
  } catch (e) { next(e); }
});

// Completar o editar el perfil de inscripción (estudiantes)
router.put("/perfil", requiereSesion, requiereRol("estudiante"), async (req, res, next) => {
  const b = req.body || {};
  if (rechazar(res, validarPerfil(b))) return;
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${CAMPOS_EDITABLES.map((c, i) => `${c} = $${i + 1}`).join(", ")}, documentos_disponibles = $${CAMPOS_EDITABLES.length + 1}
       WHERE id = $${CAMPOS_EDITABLES.length + 2} RETURNING *`,
      [...CAMPOS_EDITABLES.map((c) => limpio(b[c])), b.documentos_disponibles || [], req.usuario.id]);
    res.json(perfilPublico(rows[0]));
  } catch (e) { next(e); }
});

module.exports = router;
