// src/views/admin-view.js
import { supabase, CACHE_CONFIG } from '../js/supabase-config.js';
import { procesarImagenCompletaYThumb, obtenerUrlThumbnail } from '../utils/image-compressor.js';

let inventarioCompleto = [];
let mostrandoLimites = false;

document.addEventListener('DOMContentLoaded', () => {
  inicializarAdmin();
});

async function inicializarAdmin() {
  configurarEventosUI();
  await cargarInventario();
}

function configurarEventosUI() {
  const form = document.getElementById('form-ejemplar');
  if (form) form.addEventListener('submit', guardarEjemplar);

  const btnToggleLimit = document.getElementById('btn-toggle-limit');
  if (btnToggleLimit) {
    btnToggleLimit.addEventListener('click', () => {
      mostrandoLimites = !mostrandoLimites;
      btnToggleLimit.textContent = mostrandoLimites ? 'Ver todos' : 'Ver últimos 5';
      renderizarTarjetas();
    });
  }

  const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
  if (btnAplicarFiltros) btnAplicarFiltros.addEventListener('click', renderizarTarjetas);

  const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener('click', () => {
      document.getElementById('filtro-sexo').value = '';
      document.getElementById('filtro-estatus').value = '';
      document.getElementById('filtro-anio').value = '';
      renderizarTarjetas();
    });
  }
}

async function cargarInventario() {
  try {
    const { data, error } = await supabase
      .from('ejemplares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    inventarioCompleto = data || [];
    actualizarKPIs();
    renderizarTarjetas();
  } catch (err) {
    console.error('Error al cargar inventario:', err);
  }
}

function actualizarKPIs() {
  const total = inventarioCompleto.length;
  const disponibles = inventarioCompleto.filter(i => i.estatus === 'Disponible').length;
  const apartados = inventarioCompleto.filter(i => i.estatus === 'Apartado').length;
  const valorTotal = inventarioCompleto
    .filter(i => i.estatus === 'Disponible')
    .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);

  document.getElementById('metric-total').textContent = total;
  document.getElementById('metric-disponibles').textContent = disponibles;
  document.getElementById('metric-apartados').textContent = apartados;
  document.getElementById('metric-valor').textContent = `$${valorTotal.toLocaleString('es-MX')} MXN`;
}

function renderizarTarjetas() {
  const container = document.getElementById('cards-container');
  if (!container) return;

  let filtrados = [...inventarioCompleto];

  const filtroSexo = document.getElementById('filtro-sexo')?.value;
  const filtroEstatus = document.getElementById('filtro-estatus')?.value;
  const filtroAnio = document.getElementById('filtro-anio')?.value;

  if (filtroSexo) filtrados = filtrados.filter(i => i.sexo === filtroSexo);
  if (filtroEstatus) filtrados = filtrados.filter(i => i.estatus === filtroEstatus);
  if (filtroAnio) filtrados = filtrados.filter(i => String(i.nacimiento) === String(filtroAnio));

  if (mostrandoLimites) {
    filtrados = filtrados.slice(0, 5);
  }

  container.innerHTML = filtrados.map(item => {
    const placeholder = 'https://placehold.co/600x400/141b21/94a3b8?text=Sin+imagen';
    const urlThumb = obtenerUrlThumbnail(item.imagen_url) || placeholder;

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="card-image-wrapper">
          <img src="${urlThumb}" 
               alt="${item.genetica || 'Ejemplar'}" 
               class="card-image" 
               loading="lazy" 
               onerror="this.onerror=null; this.src='${placeholder}';" />
          <span class="card-status-badge status-${(item.estatus || 'disponible').toLowerCase()}">${item.estatus}</span>
        </div>
        <div class="card-body">
          <span class="card-id">ID: ${item.id}</span>
          <h4 class="card-genetica">${item.genetica}</h4>
          <span class="card-especie">${item.especie}</span>
          <div class="card-details">
            <span>${item.sexo}</span>
            <span>Año: ${item.nacimiento}</span>
          </div>
          <div class="card-price">$${Number(item.precio).toLocaleString('es-MX')}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function guardarEjemplar(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;

  try {
    const fileInput1 = document.getElementById('input-foto');
    const fileInput2 = document.getElementById('input-foto-2');
    const fileInput3 = document.getElementById('input-foto-3');

    const inputs = [fileInput1, fileInput2, fileInput3];
    const fotosUrls = [];
    const uploadOptions = { ...CACHE_CONFIG, contentType: 'image/webp' };

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (input && input.files && input.files[0]) {
        const archivo = input.files[0];
        
        const { fullBlob, thumbBlob, fileNameFull, fileNameThumb } = await procesarImagenCompletaYThumb(archivo, `ejemplar_${i+1}`);

        const { error: errFull } = await supabase.storage.from('ejemplares').upload(fileNameFull, fullBlob, uploadOptions);
        if (errFull) throw errFull;

        const { error: errThumb } = await supabase.storage.from('ejemplares').upload(fileNameThumb, thumbBlob, uploadOptions);
        if (errThumb) throw errThumb;

        const { data: publicData } = supabase.storage.from('ejemplares').getPublicUrl(fileNameFull);
        fotosUrls.push(publicData.publicUrl);
      } else {
        fotosUrls.push(null); 
      }
    }

    const nuevoRegistro = {
      id: document.getElementById('input-id').value,
      especie: document.getElementById('select-especie').value,
      genetica: document.getElementById('input-genetica').value,
      sexo: document.getElementById('select-sexo').value,
      nacimiento: parseInt(document.getElementById('input-nacimiento').value),
      precio: parseFloat(document.getElementById('input-precio').value),
      estatus: document.getElementById('select-estatus').value,
      imagen_url: fotosUrls[0] || null,
      imagen_url2: fotosUrls[1] || null,
      imagen_url3: fotosUrls[2] || null
    };

    const { error } = await supabase.from('ejemplares').insert([nuevoRegistro]);
    if (error) throw error;

    document.getElementById('form-ejemplar').reset();
    await cargarInventario();
    alert('Ejemplar guardado exitosamente');
  } catch (err) {
    console.error('Error al guardar:', err);
    alert('Error al guardar el ejemplar: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}