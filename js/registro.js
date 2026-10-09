(() => {
  const form = document.querySelector("#form-registro");
  if (!form) return;
  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const cursoId = Number(params.get("curso"));
  const editandoPerfil = params.get("completar") === "1" && TCUtil.sesion()?.rol === "estudiante";
  const destination = cursoId > 0 ? `cursos.html?continuar=${encodeURIComponent(cursoId)}` : "portal.html";
  const country = $("#r-pais"), otherCountry = $("#r-pais-otro"), details = $("#registro-datos"), countryStep = $("#registro-paso-pais");
  const error = $("#registro-error"), button = $("#registro-enviar");
  $("#r-nacimiento").max = new Date().toISOString().slice(0, 10);
  // Con el servidor, la cuenta se guarda en PostgreSQL con la contraseña cifrada y llega un correo de bienvenida
  if (window.TCAuth?.api) $(".demo-aviso").innerHTML = "<strong>Tus datos están protegidos</strong><p>Se guardan en el servidor de Talento Caribe con la contraseña cifrada. Te enviaremos un correo de bienvenida y los avisos de tu inscripción.</p>";
  if (cursoId > 0) $("#registro-login a").href = `admin/login.html?rol=estudiante&curso=${encodeURIComponent(cursoId)}`;
  const documentTypes = {
    Colombia: ["Cédula de ciudadanía", "Tarjeta de identidad", "Cédula de extranjería", "PEP (Permiso Especial de Permanencia)"],
    generic: ["Documento nacional de identidad", "Pasaporte", "Documento de extranjería o residencia", "Otro documento oficial"],
  };
  function updateCountryFields() {
    const colombia = country.value === "Colombia", otro = country.value === "Otro país";
    $("#r-pais-otro-campo").hidden = !otro;
    otherCountry.required = otro;
    const select = $("#r-tipo-documento"), selected = select.value;
    select.innerHTML = '<option value="">Selecciona tu documento</option>' + (colombia ? documentTypes.Colombia : documentTypes.generic).map((type) => `<option>${type}</option>`).join("");
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
    $("#r-pais-guia").textContent = colombia
      ? "Para Colombia puedes inscribirte con cédula de ciudadanía, tarjeta de identidad, cédula de extranjería o PEP. Ten a mano una constancia de estudios si el programa la solicita."
      : "Selecciona el documento oficial vigente en tu país. Si el curso necesita algún soporte académico adicional, el equipo te lo indicará durante el proceso.";
  }
  function edad(fecha) {
    if (!fecha) return -1;
    const nacimiento = new Date(`${fecha}T00:00:00`), hoy = new Date();
    let valor = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) valor--;
    return valor;
  }
  function updateGuardian() {
    const visible = edad($("#r-nacimiento").value) < 18;
    const block = $("#r-acudiente"); block.hidden = !visible;
    block.querySelectorAll("input").forEach((field) => { field.required = visible; field.disabled = !visible; });
  }
  function showDetails() {
    if (!country.reportValidity()) return;
    updateCountryFields(); countryStep.hidden = true; details.hidden = false; details.disabled = false;
    $("#r-nombre").focus();
  }
  country.addEventListener("change", updateCountryFields);
  $("#r-continuar").addEventListener("click", showDetails);
  $("#r-cambiar-pais").addEventListener("click", () => { details.hidden = true; details.disabled = true; countryStep.hidden = false; country.focus(); });
  $("#r-nacimiento").addEventListener("change", updateGuardian);

  if (editandoPerfil) {
    const session = TCUtil.sesion();
    const options = [...country.options].map((option) => option.value);
    const selectedCountry = options.includes(session.pais) ? session.pais : "Otro país";
    country.value = selectedCountry;
    if (selectedCountry === "Otro país") otherCountry.value = session.pais === "Otro" ? "" : session.pais;
    updateCountryFields(); showDetails();
    Object.entries({ nombre: "nombre", correo: "correo", confirmar_correo: "correo", tipo_documento: "tipo_documento", numero_documento: "numero_documento", fecha_nacimiento: "fecha_nacimiento", telefono: "telefono", direccion: "direccion", ciudad: "ciudad", region: "region", codigo_postal: "codigo_postal", ultimo_estudio: "ultimo_estudio", acudiente_nombre: "acudiente_nombre", acudiente_telefono: "acudiente_telefono", acudiente_correo: "acudiente_correo" }).forEach(([field, key]) => { if (form.elements[field]) form.elements[field].value = session[key] || ""; });
    new Set(session.documentos_disponibles || []).forEach((value) => { const checkbox = [...form.querySelectorAll('[name="documentos_disponibles"]')].find((field) => field.value === value); if (checkbox) checkbox.checked = true; });
    updateGuardian();
    $("#registro-titulo").textContent = "Completa tu perfil";
    $("#registro-intro").textContent = "Antes de enviar tu solicitud de curso, completa los datos que faltan en tu perfil.";
    $("#registro-login").hidden = true;
    $(".registro-credenciales").hidden = true;
    [form.elements.clave, form.elements.confirmar].forEach((field) => { field.required = false; field.disabled = true; });
    button.querySelector(".btn-texto").textContent = "Guardar perfil y continuar";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); error.hidden = true;
    if (country.value === "") { countryStep.hidden = false; details.hidden = true; details.disabled = true; country.reportValidity(); return; }
    if (!form.reportValidity()) return;
    if (form.elements.correo.value.trim().toLowerCase() !== form.elements.confirmar_correo.value.trim().toLowerCase()) {
      form.elements.confirmar_correo.setCustomValidity("Los correos no coinciden."); form.elements.confirmar_correo.reportValidity();
      form.elements.confirmar_correo.addEventListener("input", () => form.elements.confirmar_correo.setCustomValidity(""), { once: true }); return;
    }
    const curso = CURSOS.find((item) => Number(item.id) === cursoId);
    const edadMinima = curso ? Number(curso.edadMinima ?? curso.edad_minima ?? 14) : 0;
    const years = edad(form.elements.fecha_nacimiento.value);
    if (curso && years < edadMinima) { error.textContent = `Este curso está dirigido a personas desde los ${edadMinima} años. Puedes explorar otros programas.`; error.hidden = false; return; }
    if (!editandoPerfil && form.elements.clave.value !== form.elements.confirmar.value) {
      form.elements.confirmar.setCustomValidity("Las contraseñas no coinciden."); form.elements.confirmar.reportValidity();
      form.elements.confirmar.addEventListener("input", () => form.elements.confirmar.setCustomValidity(""), { once: true }); return;
    }
    button.disabled = true; button.querySelector(".btn-texto").hidden = true; button.querySelector(".spinner").hidden = false;
    const pais = country.value === "Otro país" ? otherCountry.value.trim() : country.value;
    const profile = { nombre: form.elements.nombre.value.trim(), pais, correo: form.elements.correo.value.trim().toLowerCase(), tipo_documento: form.elements.tipo_documento.value, numero_documento: form.elements.numero_documento.value.trim(), fecha_nacimiento: form.elements.fecha_nacimiento.value, telefono: form.elements.telefono.value.trim(), direccion: form.elements.direccion.value.trim(), ciudad: form.elements.ciudad.value.trim(), region: form.elements.region.value.trim(), codigo_postal: form.elements.codigo_postal.value.trim(), ultimo_estudio: form.elements.ultimo_estudio.value, documentos_disponibles: new FormData(form).getAll("documentos_disponibles"), acudiente_nombre: form.elements.acudiente_nombre.value.trim(), acudiente_telefono: form.elements.acudiente_telefono.value.trim(), acudiente_correo: form.elements.acudiente_correo.value.trim() };
    try {
      let session;
      if (editandoPerfil) session = await TCAuth.actualizarPerfil(profile);
      else session = await TCAuth.registrar({ ...profile, clave: form.elements.clave.value, perfil: profile });
      localStorage.setItem("tc_sesion_demo", JSON.stringify(session));
      location.replace(destination);
    } catch (problem) {
      error.textContent = problem.message || "No pudimos guardar el perfil. Inténtalo de nuevo."; error.hidden = false;
      button.disabled = false; button.querySelector(".btn-texto").hidden = false; button.querySelector(".spinner").hidden = true;
    }
  });
})();
