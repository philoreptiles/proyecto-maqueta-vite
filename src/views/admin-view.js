import { supabase } from '../js/supabase-config.js';
import { comprimirImagen } from '../utils/image-compressor.js';

// Nombre exacto del Bucket en Supabase Storage
const BUCKET_NAME = 'ejemplares';

let inventarioCompleto = [];
let mostrandoUltimos5 = false;

document.addEventListener('DOMContentLoaded', () => {
  initAdminView();
});

async function initAdminView() {
  setupFileInputs();
  setupEventListeners();
  await cargarInventario();
}

/* SETUP FILE INPUT LABELS */
function setupFileInputs() {
  const fileInputs = [
    { inputId: 'input-foto', labelId: 'file-name-display', defaultText: 'Seleccionar foto 1...' },
    { inputId: 'input-foto-2', labelId: 'file-name-display-2', defaultText: 'Seleccionar foto 2...' },
    { inputId: 'input-foto-3', labelId: 'file-name-display-3', defaultText: 'Seleccionar foto 3...' },
    { inputId: 'edit-foto', labelId: 'edit-file-name-display', defaultText: 'Cambiar foto 1...' },
    { inputId: 'edit-foto-2', labelId: 'edit-file-name-display-2', defaultText: 'Cambiar foto 2...' },
    { inputId: 'edit-foto-3', labelId: 'edit-file-name-display-3', defaultText: 'Cambiar foto 3...' }
  ];

  fileInputs.forEach(({ inputId, labelId, defaultText }) => {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);

    if (input && label) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        label.textContent = file ? file.name : defaultText;
      });
    }
  });
}

/* EVENT LISTENERS */
function setupEventListeners() {
  const formEjemplar = document.getElementById('form-ejemplar');
  if (formEjemplar) {
    formEjemplar.addEventListener('submit', handleGuardarEjemplar);
  }

  const formModal = document.getElementById('form-modal-edicion');
  if (formModal) {
    formModal.addEventListener('submit', handleGuardarModalEdicion);
  }

  document.getElementById('btn-close-modal')?.addEventListener('click', cerrarModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', cerrarModal);

  document.getElementById('btn-aplicar-filtros')?.addEventListener('click', aplicarFiltros);
  document.getElementById('btn-limpiar-filtros')?.addEventListener('click', limpiarFiltros);
  document.getElementById('btn-limpiar-filtros-top')?.addEventListener('click', limpiarFiltros);

  document.getElementById('btn-toggle-limit')?.addEventListener('click', toggleLimite);

  const triggerEspecie = document.getElementById('dropdown-trigger-especie');
  const containerEspecie = document.getElementById('filtro-especie-container');

  if (triggerEspecie && containerEspecie) {
    triggerEspecie.addEventListener('click', (e) => {
      e.stopPropagation();
      containerEspecie.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      containerEspecie.classList.remove('open');
    });

    containerEspecie.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/src/pages/login.html';
  });
}

/* SUBIDA DE IMÁGENES A SUPABASE STORAGE CON COMPRESIÓN WEBP */
async function procesarYSubirImagen(file) {
  if (!file) return null;

  try {
    const archivoOptimizado = await comprimirImagen(file);
    const fileExt = archivoOptimizado.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, archivoOptimizado, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.error === 'Bucket not found') {
        throw new Error(`El bucket '${BUCKET_NAME}' no existe en tu proyecto de Supabase. Créalo desde el panel con acceso público.`);
      }
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    console.error(`Error al procesar/subir imagen:`, err);
    throw err;
  }
}

/* GUARDAR NUEVO EJEMPLAR */
async function handleGuardarEjemplar(e) {
  e.preventDefault();
  const btnGuardar = document.getElementById('btn-guardar');
  const originalText = btnGuardar ? btnGuardar.innerHTML : '';

  try {
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;
    }

    const id = document.getElementById('input-id')?.value.trim();
    const especie = document.getElementById('select-especie')?.value;
    const genetica = document.getElementById('input-genetica')?.value.trim();
    const sexo = document.getElementById('select-sexo')?.value;
    const anio = parseInt(document.getElementById('input-nacimiento')?.value, 10);
    const precio = parseFloat(document.getElementById('input-precio')?.value);
    const estatus = document.getElementById('select-estatus')?.value;

    const file1 = document.getElementById('input-foto')?.files[0];
    const file2 = document.getElementById('input-foto-2')?.files[0];
    const file3 = document.getElementById('input-foto-3')?.files[0];

    const [imagen_url, imagen_url_2, imagen_url_3] = await Promise.all([
      procesarYSubirImagen(file1),
      procesarYSubirImagen(file2),
      procesarYSubirImagen(file3)
    ]);

    const nuevoEjemplar = {
      id,
      especie,
      genetica,
      sexo,
      nacimiento: anio,
      precio,
      estatus,
      imagen_url,
      imagen_url_2: imagen_url_2 || null,
      imagen_url_3: imagen_url_3 || null
    };

    const { error } = await supabase.from('ejemplares').insert([nuevoEjemplar]);
    if (error) throw error;

    document.getElementById('form-ejemplar')?.reset();
    resetFileLabels();
    await cargarInventario();
    alert('Ejemplar registrado exitosamente.');
  } catch (err) {
    alert(`Error al guardar: ${err.message || err}`);
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = originalText;
    }
  }
}

function resetFileLabels() {
  const f1 = document.getElementById('file-name-display');
  const f2 = document.getElementById('file-name-display-2');
  const f3 = document.getElementById('file-name-display-3');
  if (f1) f1.textContent = 'Seleccionar foto 1...';
  if (f2) f2.textContent = 'Seleccionar foto 2...';
  if (f3) f3.textContent = 'Seleccionar foto 3...';
}

/* CARGAR INVENTARIO */
async function cargarInventario() {
  try {
    const { data, error } = await supabase
      .from('ejemplares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    inventarioCompleto = data || [];
    actualizarMetricas(inventarioCompleto);
    poblarFiltroEspecies(inventarioCompleto);
    renderizarCards(inventarioCompleto);
  } catch (err) {
    console.error('Error al cargar inventario:', err);
    alert(`Error al consultar inventario: ${err.message || err}`);
  }
}

/* MÉTRICAS KPIS */
function actualizarMetricas(items) {
  const total = items.length;
  const disponibles = items.filter(i => i.estatus === 'Disponible').length;
  const apartados = items.filter(i => i.estatus === 'Apartado').length;
  const valorTotal = items
    .filter(i => i.estatus === 'Disponible')
    .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);

  const elTotal = document.getElementById('metric-total');
  const elDisp = document.getElementById('metric-disponibles');
  const elApart = document.getElementById('metric-apartados');
  const elValor = document.getElementById('metric-valor');

  if (elTotal) elTotal.textContent = total;
  if (elDisp) elDisp.textContent = disponibles;
  if (elApart) elApart.textContent = apartados;
  if (elValor) elValor.textContent = `$${valorTotal.toLocaleString('es-MX')} MXN`;
}

/* DROPDOWN FILTRO DE ESPECIES */
function poblarFiltroEspecies(items) {
  const container = document.getElementById('container-filtro-especie');
  if (!container) return;

  const especies = [...new Set(items.map(i => i.especie).filter(Boolean))].sort();

  container.innerHTML = especies.map(esp => `
    <label>
      <input type="checkbox" value="${esp}" class="chk-especie">
      <span>${esp}</span>
    </label>
  `).join('');

  container.querySelectorAll('.chk-especie').forEach(chk => {
    chk.addEventListener('change', actualizarLabelTriggerEspecie);
  });
}

function actualizarLabelTriggerEspecie() {
  const seleccionados = Array.from(document.querySelectorAll('.chk-especie:checked')).map(c => c.value);
  const label = document.getElementById('trigger-label-especie');
  if (!label) return;

  if (seleccionados.length === 0) {
    label.textContent = 'Todas';
  } else if (seleccionados.length === 1) {
    label.textContent = seleccionados[0];
  } else {
    label.textContent = `${seleccionados.length} seleccionadas`;
  }
}

/* FILTRADO */
function aplicarFiltros() {
  const especiesSel = Array.from(document.querySelectorAll('.chk-especie:checked')).map(c => c.value);
  const sexo = document.getElementById('filtro-sexo')?.value || '';
  const estatus = document.getElementById('filtro-estatus')?.value || '';
  const anio = document.getElementById('filtro-anio')?.value || '';

  let resultado = inventarioCompleto.filter(item => {
    if (especiesSel.length > 0 && !especiesSel.includes(item.especie)) return false;
    if (sexo && item.sexo !== sexo) return false;
    if (estatus && item.estatus !== estatus) return false;
    if (anio && String(item.nacimiento) !== String(anio)) return false;
    return true;
  });

  renderizarCards(resultado);
}

function limpiarFiltros() {
  document.querySelectorAll('.chk-especie').forEach(c => c.checked = false);
  actualizarLabelTriggerEspecie();

  const fSexo = document.getElementById('filtro-sexo');
  const fEstatus = document.getElementById('filtro-estatus');
  const fAnio = document.getElementById('filtro-anio');

  if (fSexo) fSexo.value = '';
  if (fEstatus) fEstatus.value = '';
  if (fAnio) fAnio.value = '';

  renderizarCards(inventarioCompleto);
}

function toggleLimite() {
  mostrandoUltimos5 = !mostrandoUltimos5;
  const btn = document.getElementById('btn-toggle-limit');
  if (btn) btn.textContent = mostrandoUltimos5 ? 'Ver Todos' : 'Ver últimos 5';
  aplicarFiltros();
}

/* RENDER CARDS CON LAZY LOADING */
function renderizarCards(items) {
  const container = document.getElementById('cards-container');
  if (!container) return;

  let lista = mostrandoUltimos5 ? items.slice(0, 5) : items;

  if (lista.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: var(--color-text-muted); text-align: center; padding: 20px;">No se encontraron ejemplares.</p>`;
    return;
  }

  container.innerHTML = lista.map(item => `
    <div class="item-card">
      <div class="card-image-wrapper">
        <img 
          src="${item.imagen_url || '/placeholder.jpg'}" 
          alt="${item.genetica || ''}" 
          class="card-image"
          loading="lazy"
          decoding="async"
        >
        <span class="card-status-badge status-${(item.estatus || '').toLowerCase()}">${item.estatus || ''}</span>
      </div>
      <div class="card-body">
        <span class="card-id">#${item.id}</span>
        <h3 class="card-genetica">${item.genetica}</h3>
        <span class="card-especie">${item.especie}</span>
        <div class="card-details">
          <span><i class="fa-solid fa-venus-mars"></i> ${item.sexo}</span>
          <span><i class="fa-solid fa-calendar"></i> ${item.nacimiento}</span>
        </div>
        <div class="card-price">$${Number(item.precio || 0).toLocaleString('es-MX')} MXN</div>
        <div class="card-actions">
          <button class="btn-card-action" onclick="window.abrirEdicionModal('${item.id}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-card-action danger" onclick="window.eliminarEjemplar('${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* MODAL DE EDICIÓN */
window.abrirEdicionModal = function(id) {
  const item = inventarioCompleto.find(i => i.id === id);
  if (!item) return;

  document.getElementById('edit-id-original').value = item.id;
  document.getElementById('edit-especie').value = item.especie;
  document.getElementById('edit-genetica').value = item.genetica;
  document.getElementById('edit-sexo').value = item.sexo;
  document.getElementById('edit-nacimiento').value = item.nacimiento;
  document.getElementById('edit-precio').value = item.precio;
  document.getElementById('edit-estatus').value = item.estatus;

  const f1 = document.getElementById('edit-file-name-display');
  const f2 = document.getElementById('edit-file-name-display-2');
  const f3 = document.getElementById('edit-file-name-display-3');

  if (f1) f1.textContent = 'Cambiar foto 1...';
  if (f2) f2.textContent = 'Cambiar foto 2...';
  if (f3) f3.textContent = 'Cambiar foto 3...';

  document.getElementById('modal-edicion')?.classList.remove('hidden');
};

function cerrarModal() {
  document.getElementById('modal-edicion')?.classList.add('hidden');
  document.getElementById('form-modal-edicion')?.reset();
}

async function handleGuardarModalEdicion(e) {
  e.preventDefault();
  const btnSave = document.getElementById('btn-save-modal');
  const originalText = btnSave ? btnSave.innerHTML : '';

  try {
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...`;
    }

    const id = document.getElementById('edit-id-original').value;
    const especie = document.getElementById('edit-especie').value;
    const genetica = document.getElementById('edit-genetica').value.trim();
    const sexo = document.getElementById('edit-sexo').value;
    const anio = parseInt(document.getElementById('edit-nacimiento').value, 10);
    const precio = parseFloat(document.getElementById('edit-precio').value);
    const estatus = document.getElementById('edit-estatus').value;

    const file1 = document.getElementById('edit-foto')?.files[0];
    const file2 = document.getElementById('edit-foto-2')?.files[0];
    const file3 = document.getElementById('edit-foto-3')?.files[0];

    const updates = {
      especie,
      genetica,
      sexo,
      nacimiento: anio,
      precio,
      estatus
    };

    if (file1) updates.imagen_url = await procesarYSubirImagen(file1);
    if (file2) updates.imagen_url_2 = await procesarYSubirImagen(file2);
    if (file3) updates.imagen_url_3 = await procesarYSubirImagen(file3);

    const { error } = await supabase
      .from('ejemplares')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    cerrarModal();
    await cargarInventario();
    alert('Ejemplar actualizado con éxito.');
  } catch (err) {
    alert(`Error al actualizar: ${err.message || err}`);
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = originalText;
    }
  }
}

/* ELIMINAR EJEMPLAR */
window.eliminarEjemplar = async function(id) {
  if (!confirm(`¿Estás seguro de eliminar el ejemplar con ID ${id}?`)) return;

  try {
    const { error } = await supabase.from('ejemplares').delete().eq('id', id);
    if (error) throw error;
    await cargarInventario();
  } catch (err) {
    alert(`Error al eliminar: ${err.message || err}`);
  }
};