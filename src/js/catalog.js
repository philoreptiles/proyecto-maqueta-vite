// ============================================
// catalog.js - Manejo del catálogo y eventos
// ============================================

import { supabase } from './supabase-config.js';
import { abrirModalEjemplar, cerrarModal, inicializarModal } from './modal.js';

const WHATSAPP_NUMERO = '525573461033';
let todosLosEjemplares = [];
let ejemplaresFiltradosActuales = [];

// Variables de estado para Carga Perezosa (Optimización 2)
let elementosVisibles = 15;
let observerCargaPerezosa = null;

window.abrirModalEjemplar = (id) => {
  const ejemplar = todosLosEjemplares.find(e => String(e.id) === String(id) || String(e.codigo) === String(id));
  if (ejemplar) abrirModalEjemplar(ejemplar, ejemplaresFiltradosActuales);
};

export async function cargarEjemplares() {
  try {
    inicializarModal();

    const { data, error } = await supabase
      .from('ejemplares')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      mostrarMensaje('No hay ejemplares disponibles.', 'vacio');
      return [];
    }

    todosLosEjemplares = data;
    ejemplaresFiltradosActuales = [...todosLosEjemplares];

    poblarOpcionesAnios(todosLosEjemplares);
    inicializarEventosFiltros();
    inicializarBotonVolverInicio();

    renderizarEjemplares(ejemplaresFiltradosActuales, true);
    verificarDeepLinking(todosLosEjemplares);

    return todosLosEjemplares;

  } catch (error) {
    console.error('💥 Error:', error);
    mostrarMensaje('No se pudieron cargar los ejemplares.', 'error');
    return [];
  }
}

function verificarDeepLinking(ejemplares) {
  const hash = window.location.hash.replace('#', '').trim();
  if (!hash) return;

  const ejemplarEncontrado = ejemplares.find(e =>
    String(e.codigo).toLowerCase() === hash.toLowerCase() ||
    String(e.id).toLowerCase() === hash.toLowerCase()
  );

  if (ejemplarEncontrado) {
    abrirModalEjemplar(ejemplarEncontrado, ejemplaresFiltradosActuales);
  }
}

/**
 * Modificada para manejar inyección gradual (Intersection Observer)
 * @param {Array} ejemplares Arreglo filtrado a mostrar
 * @param {boolean} reset Resetea la grilla e inicializa los contadores (verdadero para filtros iniciales)
 */
function renderizarEjemplares(ejemplares, reset = true) {
  const grid = document.querySelector('.grid-ejemplares');
  if (!grid) return;

  if (reset) {
    elementosVisibles = 15;
    grid.innerHTML = '';
  }

  if (ejemplares.length === 0) {
    grid.innerHTML = `<div class="mensaje-vacio"><p>No hay ejemplares que coincidan con los filtros seleccionados.</p></div>`;
    return;
  }

  const inicio = reset ? 0 : elementosVisibles - 10;
  const lote = ejemplares.slice(inicio, Math.min(elementosVisibles, ejemplares.length));
  
  let html = '';
  lote.forEach((ejemplar) => {
    const precioFormateado = formatearPrecio(ejemplar.precio);
    const estadoClase = ejemplar.estatus ? ejemplar.estatus.toLowerCase() : 'disponible';
    let imagenUrl = ejemplar.imagen_url || (Array.isArray(ejemplar.imagenes) && ejemplar.imagenes[0]) || 'https://placehold.co/600x400/141b21/94a3b8?text=Sin+imagen';
    
    // OPTIMIZACIÓN 1: Uso dinámico de Thumbnail sustituyendo el subfijo original
    const thumbUrl = imagenUrl.includes('_full.webp') ? imagenUrl.replace('_full.webp', '_thumb.webp') : imagenUrl;

    const codigo = ejemplar.codigo || ejemplar.id;
    const idSeguro = String(ejemplar.id).replace(/'/g, "\\'");

    html += `
      <div class="tarjeta" data-id="${ejemplar.id}" onclick="window.abrirModalEjemplar('${idSeguro}')">
        <div class="tarjeta-imagen">
          <img src="${thumbUrl}" alt="${ejemplar.genetica || 'Ejemplar'}" loading="lazy">
          <span class="estado ${estadoClase}">${ejemplar.estatus || 'Disponible'}</span>
        </div>
        <div class="tarjeta-contenido">
          <h3>${ejemplar.especie || 'Especie no especificada'}</h3>
          <p class="genetica">${ejemplar.genetica || 'Genética no especificada'}</p>
          <div class="detalles">
            <span><strong>ID:</strong> ${codigo}</span>
            <span><strong>Sexo:</strong> ${ejemplar.sexo || 'No sexado'}</span>
            <span><strong>Año:</strong> ${ejemplar.nacimiento || 'N/A'}</span>
          </div>
          <div class="tarjeta-footer">
            <span class="precio">$${precioFormateado}</span>
            <div class="acciones">
              <button type="button" class="btn-ver-ficha" onclick="event.stopPropagation(); window.abrirModalEjemplar('${idSeguro}')">Ver ficha</button>
              <a href="https://wa.me/${WHATSAPP_NUMERO}?text=Hola%20Escama%20y%20Colmillo%2C%20me%20interesa%20consultar%20disponibilidad%20del%20ejemplar%20ID%3A%20${codigo}%20(${encodeURIComponent(ejemplar.genetica || '')})" 
                 target="_blank" 
                 rel="noopener" 
                 class="btn-whatsapp"
                 onclick="event.stopPropagation();">
                Consultar
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  if (reset) {
    grid.innerHTML = html;
  } else {
    grid.insertAdjacentHTML('beforeend', html);
  }

  // OPTIMIZACIÓN 2: Lógica de Intersection Observer
  if (observerCargaPerezosa) observerCargaPerezosa.disconnect();

  if (elementosVisibles < ejemplares.length) {
    const items = grid.querySelectorAll('.tarjeta');
    const ultimoItem = items[items.length - 1];

    observerCargaPerezosa = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        elementosVisibles += 10;
        renderizarEjemplares(ejemplares, false);
      }
    }, { rootMargin: "300px" }); // Se dispara 300px antes de llegar al final

    if (ultimoItem) observerCargaPerezosa.observe(ultimoItem);
  }

  // OPTIMIZACIÓN 4: Precarga de siguientes imágenes
  precargarSiguientes(elementosVisibles, ejemplares);
}

/**
 * OPTIMIZACIÓN 4: PRECARGA INTELIGENTE
 * Precarga de forma fantasma en memoria las siguientes 5 miniaturas para que fluyan al scrollear
 */
function precargarSiguientes(indexActual, totalEjemplares) {
  const siguientes = totalEjemplares.slice(indexActual, indexActual + 5);
  siguientes.forEach(ejemplar => {
    let imagenUrl = ejemplar.imagen_url || (Array.isArray(ejemplar.imagenes) && ejemplar.imagenes[0]);
    if (imagenUrl && imagenUrl.includes('_full.webp')) {
      const imgFantasma = new Image();
      imgFantasma.src = imagenUrl.replace('_full.webp', '_thumb.webp');
    }
  });
}

function poblarOpcionesAnios(ejemplares) {
  const selectAnio = document.getElementById('filtro-anio');
  if (!selectAnio) return;

  const anios = [...new Set(ejemplares.map(e => e.nacimiento).filter(Boolean))].sort((a, b) => b - a);
  selectAnio.innerHTML = '<option value="">Todos</option>';
  anios.forEach(anio => {
    selectAnio.innerHTML += `<option value="${anio}">${anio}</option>`;
  });
}

function inicializarEventosFiltros() {
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');

  if (btnAplicar) btnAplicar.onclick = aplicarFiltros;
  if (btnLimpiar) btnLimpiar.onclick = limpiarFiltros;
}

function aplicarFiltros() {
  cerrarModal();

  const geneticaVal = document.getElementById('filtro-genetica')?.value.toLowerCase().trim() || '';
  const estatusVal = document.getElementById('filtro-estatus')?.value.toLowerCase() || '';
  const sexoVal = document.getElementById('filtro-sexo')?.value.toLowerCase() || '';
  const anioVal = document.getElementById('filtro-anio')?.value || '';
  const precioVal = document.getElementById('filtro-precio')?.value || '';
  const ordenVal = document.getElementById('filtro-orden')?.value || '';

  ejemplaresFiltradosActuales = todosLosEjemplares.filter(item => {
    const matchGenetica = !geneticaVal || (item.genetica && item.genetica.toLowerCase().includes(geneticaVal));
    const matchEstatus = !estatusVal || (item.estatus && item.estatus.toLowerCase() === estatusVal);
    const matchSexo = !sexoVal || (item.sexo && item.sexo.toLowerCase() === sexoVal);
    const matchAnio = !anioVal || String(item.nacimiento) === String(anioVal);

    let matchPrecio = true;
    const precioNum = Number(item.precio) || 0;
    if (precioVal === '2000-3999') matchPrecio = precioNum >= 2000 && precioNum <= 3999;
    else if (precioVal === '4000-9999') matchPrecio = precioNum >= 4000 && precioNum <= 9999;
    else if (precioVal === '10000+') matchPrecio = precioNum >= 10000;

    return matchGenetica && matchEstatus && matchSexo && matchAnio && matchPrecio;
  });

  if (ordenVal === 'precio-asc') {
    ejemplaresFiltradosActuales.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
  } else if (ordenVal === 'precio-desc') {
    ejemplaresFiltradosActuales.sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0));
  }

  // Se vuelve a iniciar renderizado desde 0 tras el filtro
  renderizarEjemplares(ejemplaresFiltradosActuales, true);
}

function limpiarFiltros() {
  cerrarModal();
  const form = document.getElementById('form-filtros');
  if (form) form.reset();
  ejemplaresFiltradosActuales = [...todosLosEjemplares];
  // Se vuelve a iniciar renderizado desde 0
  renderizarEjemplares(ejemplaresFiltradosActuales, true);
}

function inicializarBotonVolverInicio() {
  const btn = document.getElementById('btn-volver-inicio');
  if (!btn) return;

  window.onscroll = () => {
    if (window.scrollY > 300) {
      btn.style.display = 'inline-flex';
    } else {
      btn.style.display = 'none';
    }
  };

  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatearPrecio(precio) {
  if (!precio) return '0';
  const numero = typeof precio === 'string' ? parseFloat(precio.replace(/[^0-9.]/g, '')) : precio;
  return numero.toLocaleString('en-US');
}

function mostrarMensaje(mensaje, tipo) {
  const grid = document.querySelector('.grid-ejemplares');
  if (!grid) return;
  grid.innerHTML = `<div class="mensaje-${tipo}"><p>${mensaje}</p></div>`;
}