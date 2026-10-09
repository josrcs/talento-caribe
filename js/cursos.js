(() => {
  const cursos = window.TALENTO_CARIBE_CURSOS || [];
  const grid = document.querySelector('#lista-cursos');
  if (!grid) return;
  const form = document.querySelector('#filtros');
  const modal = document.querySelector('#modal-curso');
  const inscripcion = document.querySelector('#modal-inscripcion');
  const formInscripcion = document.querySelector('#form-inscripcion');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let cursoActual = null, fichaElegida = '';
  const FICHAS = () => window.TALENTO_CARIBE_FICHAS || [];
  const fichasDe = id => FICHAS().filter(f => Number(f.curso_id) === Number(id));
  const fechaCorta = iso => iso ? new Date(iso + 'T00:00:00').toLocaleDateString(window.TCIdioma?.locale || 'es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Por definir';
  const claseFicha = estado => ({ 'Inscripciones abiertas': 'tag-lanzamiento', 'En formación': 'tag-formacion', 'Finalizada': 'tag-finalizada' }[estado] || '');

  const guiasPais = {
    Colombia: {
      docs: ['Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula de extranjería', 'PEP (Permiso Especial de Permanencia)'],
      texto: 'Ten a mano tu documento de identidad, un certificado o boletín de estudios y, si lo tienes, un comprobante de afiliación a salud. Para menores de edad, prepara también los datos de madre, padre o acudiente. La institución confirmará lo que necesita para el curso.',
      fuente: 'https://www.mineducacion.gov.co/1759/articles-407325_recurso_1.pdf'
    },
    Venezuela: { docs: ['Cédula de identidad', 'Pasaporte', 'Documento de identidad de otro país'], texto: 'Ten a mano tu cédula o pasaporte y, si ya estudiaste, una constancia, certificado o notas del último nivel aprobado. Si resides fuera de Venezuela, usa el documento válido en tu país de residencia. La institución confirmará si requiere equivalencias.' },
    Ecuador: {
      docs: ['Cédula de identidad', 'Pasaporte', 'Documento de identidad de otro país'],
      texto: 'Ten a mano tu documento de identidad y los certificados de promoción o constancias de los cursos aprobados, si los tienes. Si estudiaste en otro país, pregunta al equipo si hace falta un trámite de reconocimiento.',
      fuente: 'https://adistancia.educacion.gob.ec/sistema-de-matricula-a-distancia-virtual/'
    },
    'Perú': { docs: ['DNI', 'Carné de extranjería', 'Pasaporte', 'Documento de identidad de otro país'], texto: 'Ten a mano tu DNI u otro documento de identidad y una constancia o certificado de tus estudios previos, si corresponde. La institución confirmará si necesita documentos adicionales o reconocimiento de estudios extranjeros.' },
    'México': {
      docs: ['CURP', 'Acta de nacimiento', 'Pasaporte', 'Documento de identidad de otro país'],
      texto: 'Para estudios escolares formales en México suelen solicitar CURP y acta de nacimiento o documento equivalente; también puede pedirse el certificado del nivel previo. Para estos cursos, prepara el documento de identidad y tu última constancia de estudios; confirma requisitos con el equipo.',
      fuente: 'https://prepaabierta.sep.gob.mx/inscribete'
    },
    Argentina: { docs: ['DNI', 'Pasaporte', 'Documento de identidad de otro país'], texto: 'Ten a mano tu DNI o pasaporte y una constancia o certificado del último nivel cursado, si lo tienes. Los requisitos de equivalencia dependen del tipo de curso y de la institución.' },
    Chile: { docs: ['Cédula de identidad (RUN/RUT)', 'Pasaporte', 'Documento de identidad de otro país'], texto: 'Ten a mano tu cédula de identidad o pasaporte y, si corresponde, una constancia o certificado de estudios previos. La institución confirmará si requiere reconocimiento de estudios.' },
    Otro: { docs: ['Documento nacional de identidad', 'Cédula o tarjeta de identidad', 'Pasaporte'], texto: 'Ten a mano un documento oficial de identidad y, si ya has estudiado, una constancia, certificado o calificaciones del último nivel aprobado. Si eres menor de edad, prepara los datos de tu madre, padre o acudiente. Los requisitos cambian según el país y el curso.' }
  };
  const guiaDefault = guiasPais.Otro;

  function actualizarPais() {
    const pais = document.querySelector('#i-pais').value;
    const tienePais = Boolean(pais);
    const otro = pais === 'Otro';
    const guia = guiasPais[pais] || guiaDefault;
    const requisitos = document.querySelector('#i-requisitos');
    const detalle = document.querySelector('#i-datos-persona');
    const opciones = document.querySelector('#i-tipo-documento');
    document.querySelector('#i-pais-otro-campo').hidden = !otro;
    document.querySelector('#i-pais-otro').required = otro;
    document.querySelector('#i-pais-otro').disabled = !otro;
    requisitos.hidden = !tienePais;
    detalle.hidden = !tienePais;
    document.querySelector('#i-acciones').hidden = !tienePais;
    document.querySelector('#i-requisitos-texto').textContent = guia.texto;
    const fuenteWrap = document.querySelector('#i-requisitos-fuente-wrap');
    const fuenteLink = document.querySelector('#i-requisitos-fuente');
    fuenteWrap.hidden = !guia.fuente;
    if (guia.fuente) {
      fuenteLink.href = guia.fuente;
      fuenteLink.textContent = pais === 'Colombia' ? 'orientación de matrícula del Ministerio de Educación de Colombia' : pais === 'Ecuador' ? 'sistema de matrícula del Ministerio de Educación de Ecuador' : 'requisitos de Preparatoria Abierta de la SEP de México';
    }
    document.querySelector('#i-requisitos-titulo').textContent = `Antes de continuar: documentos habituales en ${otro ? 'tu país' : pais}`;
    opciones.innerHTML = '<option value="">Selecciona tu documento</option>' + guia.docs.map(doc => `<option>${esc(doc)}</option>`).join('');
    opciones.disabled = !tienePais;
    detalle.querySelectorAll('input, select').forEach(el => { el.disabled = !tienePais; });
    const fuente = guia.fuente ? ` Fuente orientativa: ${pais === 'Colombia' ? 'Ministerio de Educación de Colombia' : pais === 'Ecuador' ? 'Ministerio de Educación de Ecuador' : 'Preparatoria Abierta de la SEP, México'}.` : '';
    const p = document.querySelector('#i-requisitos-texto');
    p.textContent = `${guia.texto}${fuente}`;
    document.querySelector('#i-nacimiento').max = new Date().toISOString().slice(0, 10);
    actualizarTutor();
  }

  function actualizarTutor() {
    const fecha = document.querySelector('#i-nacimiento').value;
    const camposTutor = document.querySelector('#i-tutor-campos');
    let menor = false;
    if (fecha) {
      const hoy = new Date(), nacimiento = new Date(`${fecha}T00:00:00`);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const antesDelCumple = hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
      if (antesDelCumple) edad--;
      menor = edad < 18;
    }
    camposTutor.hidden = !menor;
    camposTutor.querySelectorAll('input').forEach(el => { el.disabled = !menor; el.required = menor && el.id !== 'i-tutor-documento'; });
  }

  function render() {
    const data = new FormData(form);
    const q = String(data.get('q') || '').trim().toLocaleLowerCase('es');
    const fichaBuscada = String(data.get('ficha') || '').replace(/\D/g, '');
    const result = cursos.filter(c => (!q || `${c.titulo} ${c.descripcion} ${c.area} ${fichasDe(c.id).map(f => f.numero).join(' ')}`.toLocaleLowerCase('es').includes(q)) &&
      (!fichaBuscada || fichasDe(c.id).some(f => f.numero.startsWith(fichaBuscada))) &&
      (!data.get('area') || c.area === data.get('area')) && (!data.get('nivel') || c.nivel === data.get('nivel')) &&
      (!data.get('modalidad') || c.modalidad === data.get('modalidad')));
    grid.innerHTML = result.map(c => `<article class="curso-card" data-revelar="rapido">
      <div class="curso-etiquetas"><span class="tag">${esc(c.area)}</span><span class="tag">${esc(c.nivel)}</span><span class="tag ${c.fase === 'Lanzamiento' ? 'tag-lanzamiento' : ''}">${c.fase === 'Lanzamiento' ? 'Inscripciones abiertas' : 'Próximamente'}</span></div>
      <h2>${esc(c.titulo)}</h2><p>${esc(c.descripcion)}</p>
      <p class="curso-duracion">${c.duracion} semanas · ${(c.modulos || []).length} módulos · ${esc(c.modalidad)} · ${esc(c.instructor)}</p>
      ${fichasDe(c.id).length ? `<p class="curso-fichas"><span>Fichas</span>${fichasDe(c.id).map(f => `<span class="ficha-chip ${fichaBuscada && f.numero.startsWith(fichaBuscada) ? 'is-encontrada' : ''}" title="${esc(f.jornada)} · ${esc(f.estado)}">${esc(f.numero)}</span>`).join('')}</p>` : ''}
      <div class="curso-card-pie"><button type="button" class="btn btn-outline" data-detalle="${c.id}">Conocer el curso</button></div>
    </article>`).join('');
    grid.removeAttribute('aria-busy');
    window.TCRevelar?.(grid); // las tarjetas entran escalonadas cada vez que cambian los filtros
    document.querySelector('#resumen-resultados').textContent = `${result.length} ${result.length === 1 ? 'curso encontrado' : 'cursos encontrados'}`;
    document.querySelector('#cursos-vacio').hidden = result.length > 0;
  }
  function setText(id, value) { document.getElementById(id).textContent = value || 'Por definir'; }
  function openCourse(id) {
    cursoActual = cursos.find(c => c.id === Number(id));
    if (!cursoActual) return;
    setText('mc-titulo', cursoActual.titulo); setText('mc-area', cursoActual.area); setText('mc-nivel', cursoActual.nivel);
    setText('mc-duracion', `${cursoActual.duracion} semanas`); setText('mc-modalidad', cursoActual.modalidad); setText('mc-instructor', cursoActual.instructor);
    setText('mc-descripcion', cursoActual.descripcion); setText('mc-objetivo', cursoActual.objetivo); setText('mc-proyecto', cursoActual.proyecto);
    setText('mc-edad-minima', Number(cursoActual.edadMinima ?? 14) > 0 ? `${Number(cursoActual.edadMinima ?? 14)} años` : 'Sin mínimo específico');
    const modulos = cursoActual.modulos || [];
    document.querySelector('#mc-modulos').innerHTML = modulos.map((m, i) => `<details class="modulo" ${i === 0 ? 'open' : ''}>
      <summary><span class="modulo-num">${m.numero}</span><span class="modulo-titulo"><small>Módulo ${m.numero}${modulos.length * 2 === Number(cursoActual.duracion) ? ` · Semanas ${m.numero * 2 - 1} y ${m.numero * 2}` : ''}</small>${esc(m.titulo)}</span><span class="modulo-cuenta">${m.temas.length} ${m.temas.length === 1 ? 'tema' : 'temas'}</span></summary>
      <div class="modulo-cuerpo">
        <ul class="modulo-temas">${m.temas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        ${m.actividades.length ? `<p class="modulo-sub">Lo que harás</p><ul class="modulo-acts">${m.actividades.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
        ${m.evidencia ? `<p class="modulo-evidencia"><strong>Entregas:</strong> ${esc(m.evidencia)}</p>` : ''}
      </div>
    </details>`).join('') || '<p>El contenido de este curso se publicará pronto.</p>';
    // Fichas: solo se puede elegir una con inscripciones abiertas
    const fichas = fichasDe(cursoActual.id);
    const buscada = String(new FormData(form).get('ficha') || '').replace(/\D/g, '');
    const abiertas = fichas.filter(f => f.estado === 'Inscripciones abiertas');
    fichaElegida = (abiertas.find(f => buscada && f.numero.startsWith(buscada)) || abiertas[0])?.numero || '';
    document.querySelector('#mc-fichas').innerHTML = fichas.map(f => {
      const abierta = f.estado === 'Inscripciones abiertas';
      return `<label class="ficha-opcion ${abierta ? '' : 'is-cerrada'}">
        <input type="radio" name="mc-ficha" value="${esc(f.numero)}" ${f.numero === fichaElegida ? 'checked' : ''} ${abierta ? '' : 'disabled'}>
        <span class="ficha-numero"><small>Ficha</small>${esc(f.numero)}</span>
        <span class="ficha-datos"><strong>${esc(f.jornada)}</strong><small>Inicia ${fechaCorta(f.inicio)} · ${Number(f.cupos) || '—'} cupos</small></span>
        <span class="tag ${claseFicha(f.estado)}">${esc(f.estado)}</span>
      </label>`;
    }).join('') || '<p class="modal-sub">Pronto abriremos la primera ficha de este curso.</p>';
    const puede = cursoActual.fase === 'Lanzamiento' && Boolean(fichaElegida);
    document.querySelector('#mc-inscribirme').disabled = !puede;
    document.querySelector('#mc-inscribirme').textContent = puede ? `Inscribirme en la ficha ${fichaElegida}` : cursoActual.fase === 'Lanzamiento' ? 'Sin fichas abiertas' : 'Próximamente';
    modal.showModal();
  }
  document.querySelector('#mc-fichas')?.addEventListener('change', e => {
    if (e.target.name !== 'mc-ficha') return;
    fichaElegida = e.target.value;
    document.querySelector('#mc-inscribirme').textContent = `Inscribirme en la ficha ${fichaElegida}`;
  });
  form.addEventListener('input', render); form.addEventListener('change', render); form.addEventListener('reset', () => setTimeout(render));
  grid.addEventListener('click', e => { const button = e.target.closest('[data-detalle]'); if (button) openCourse(button.dataset.detalle); });
  document.querySelectorAll('[data-cerrar]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  inscripcion?.addEventListener('click', e => { if (e.target === inscripcion) inscripcion.close(); });
  document.querySelector('#mc-inscribirme')?.addEventListener('click', () => {
    if (!cursoActual || cursoActual.fase !== 'Lanzamiento' || !fichaElegida) return;
    const session = JSON.parse(localStorage.getItem('tc_sesion_demo') || 'null');
    if (!session || session.rol !== 'estudiante') {
      location.href = `registro.html?curso=${encodeURIComponent(cursoActual.id)}`;
      return;
    }
    if (!session.numero_documento || !session.fecha_nacimiento || !session.pais || !session.telefono) {
      location.href = `registro.html?completar=1&curso=${encodeURIComponent(cursoActual.id)}`;
      return;
    }
    formInscripcion.reset();
    document.querySelector('#mi-curso').textContent = `Curso: ${cursoActual.titulo} · Ficha ${fichaElegida}`;
    document.querySelector('#mi-curso-id').value = cursoActual.id;
    document.querySelector('#i-nombre').value = session.nombre || '';
    document.querySelector('#i-nombre').readOnly = Boolean(session.nombre);
    document.querySelector('#i-correo').value = session.correo || '';
    document.querySelector('#i-correo').readOnly = Boolean(session.correo);
    document.querySelector('#i-pais').value = '';
    const countrySelect = document.querySelector('#i-pais');
    const countryOptions = [...countrySelect.options].map((option) => option.value);
    if (session.pais && countryOptions.includes(session.pais)) countrySelect.value = session.pais;
    else if (session.pais) {
      countrySelect.value = 'Otro';
      document.querySelector('#i-pais-otro').value = session.pais;
    }
    document.querySelector('#i-requisitos').hidden = true;
    document.querySelector('#i-datos-persona').hidden = true;
    document.querySelector('#i-acciones').hidden = true;
    document.querySelector('#i-pais-otro-campo').hidden = true;
    document.querySelector('#inscripcion-estado').hidden = true;
    actualizarPais();
    const profileFields = { 'i-tipo-documento': 'tipo_documento', 'i-numero-documento': 'numero_documento', 'i-nacimiento': 'fecha_nacimiento', 'i-telefono': 'telefono', 'i-direccion': 'direccion', 'i-ciudad': 'ciudad', 'i-region': 'region', 'i-codigo-postal': 'codigo_postal', 'i-ultimo-estudio': 'ultimo_estudio', 'i-tutor-nombre': 'acudiente_nombre', 'i-tutor-telefono': 'acudiente_telefono' };
    Object.entries(profileFields).forEach(([id, key]) => { const field = document.querySelector('#' + id); if (field) field.value = session[key] || ''; });
    new Set(session.documentos_disponibles || []).forEach(value => { const checkbox = [...formInscripcion.querySelectorAll('[name="documentos_disponibles"]')].find(field => field.value === value); if (checkbox) checkbox.checked = true; });
    document.querySelector('#i-pais-otro').value = countrySelect.value === 'Otro' ? (session.pais || '') : '';
    actualizarTutor();
    modal.close(); inscripcion.showModal();
  });
  document.querySelector('#i-pais')?.addEventListener('change', actualizarPais);
  document.querySelector('#i-nacimiento')?.addEventListener('change', actualizarTutor);
  formInscripcion?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!formInscripcion.reportValidity()) return;
    const session = JSON.parse(localStorage.getItem('tc_sesion_demo') || 'null');
    if (!session || session.rol !== 'estudiante') {
      document.querySelector('#modal-inscripcion').close();
      location.href = `registro.html?curso=${encodeURIComponent(document.querySelector('#mi-curso-id').value)}`;
      return;
    }
    const state = document.querySelector('#inscripcion-estado');
    const mostrar = (texto) => { state.textContent = texto; state.hidden = false; };
    const courseId = Number(document.querySelector('#mi-curso-id').value);
    const enrollments = TCDatos.inscripciones();
    if (enrollments.some((item) => Number(item.curso_id) === courseId && item.correo?.toLowerCase() === session.correo?.toLowerCase())) {
      mostrar('Tu cuenta ya tiene una solicitud para este curso.'); return;
    }
    const birthDate = new Date(document.querySelector('#i-nacimiento').value + 'T00:00:00');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    const currentCourse = CURSOS.find((course) => Number(course.id) === courseId);
    const minimumAge = Number(currentCourse?.edadMinima ?? currentCourse?.edad_minima ?? 14);
    if (age < minimumAge) { mostrar(`Este curso está dirigido a personas desde los ${minimumAge} años. Puedes explorar otros programas.`); return; }
    const profile = { nombre: session.nombre, pais: formInscripcion.elements.pais_otro.value.trim() || formInscripcion.elements.pais.value, correo: session.correo, tipo_documento: formInscripcion.elements.tipo_documento.value, numero_documento: formInscripcion.elements.numero_documento.value.trim(), fecha_nacimiento: formInscripcion.elements.fecha_nacimiento.value, telefono: formInscripcion.elements.telefono.value.trim(), direccion: formInscripcion.elements.direccion.value.trim(), ciudad: formInscripcion.elements.ciudad.value.trim(), region: formInscripcion.elements.region.value.trim(), codigo_postal: formInscripcion.elements.codigo_postal.value.trim(), ultimo_estudio: formInscripcion.elements.ultimo_estudio.value, documentos_disponibles: new FormData(formInscripcion).getAll('documentos_disponibles'), acudiente_nombre: formInscripcion.elements.tutor_nombre.value.trim(), acudiente_documento: formInscripcion.elements.tutor_documento.value.trim(), acudiente_telefono: formInscripcion.elements.tutor_telefono.value.trim() };
    const boton = formInscripcion.querySelector('[type="submit"]');
    if (boton) boton.disabled = true;
    try {
      const updatedSession = await TCAuth.actualizarPerfil(profile);
      localStorage.setItem('tc_sesion_demo', JSON.stringify(updatedSession));
      await TCDatos.inscribir(courseId, age, updatedSession, fichaElegida);
      mostrar(TCAuth.api
        ? 'Tu solicitud quedó guardada. Te avisaremos cuando el equipo de admisiones confirme tu cupo.'
        : 'Tu solicitud y perfil quedaron guardados en este navegador. Te avisaremos cuando el equipo confirme tu cupo.');
    } catch (problema) {
      mostrar(problema.message || 'No pudimos enviar la solicitud. Inténtalo de nuevo.');
    } finally { if (boton) boton.disabled = false; }
  });
  const notaModo = document.querySelector('#i-nota-modo');
  if (notaModo && window.TCAuth?.api) notaModo.textContent = 'Tu perfil y tu solicitud se guardan de forma segura en la base de datos de Talento Caribe. Solo el equipo de admisiones puede verlos.';
  (window.TCListo || Promise.resolve()).then(() => {
    const fichaUrl = new URLSearchParams(location.search).get('ficha');
    if (fichaUrl) form.elements.ficha.value = fichaUrl;
    render();
    const cursoContinuacion = Number(new URLSearchParams(location.search).get('continuar'));
    if (cursoContinuacion > 0) { openCourse(cursoContinuacion); if (localStorage.getItem('tc_sesion_demo')) document.querySelector('#mc-inscribirme')?.click(); }
  });
})();
