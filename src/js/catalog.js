// src/js/catalog.js
import { supabase } from './supabase-config.js';
import { abrirModalEjemplar } from './modal.js';
import { obtenerUrlThumbnail } from '../utils/image-compressor.js';

let listaCatalogGlobal = [];
let listaFiltradaGlobal = [];
let paginaActual = 0;
const TAMANO_PAGINA = 10;
let observadorScroll = null;

export async function inicializarCatalogo() {
  await cargarEjemplares();
  configurarEventosFiltros();
  configurarIntersectionObserver();
}

async function cargarEjemplares() {
  try {
    const { data, error } = await supabase
      .from('ejemplares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    listaCatalogGlobal = data || [];
    listaFiltradaGlobal = [...listaCatalogGlobal];
    renderizarPaginaInicial();
  } catch (err) {
    console.error('Error al obtener datos:', err);
  }
}

function renderizarPaginaInicial() {
  const container = document.querySelector('.grid-ejemplares');
  if (!container) return;

  container.innerHTML = '';
  paginaActual = 0;
  cargarMasTarjetas();
}

function cargarMasTarjetas() {
  const container = document.querySelector('.grid-ejemplares');
  if (!container) return;

  const inicio = paginaActual * TAMANO_PAGINA;
  const fin = inicio + TAMANO_PAGINA;
  const lote = listaFiltradaGlobal.slice(inicio, fin);

  if (lote.length === 0) return;

  const fragmento = document.createDocumentFragment();

  lote.forEach(item => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';

    const placeholder = 'https://placehold.co/600x400/141b21/94a3b8?text=Sin+imagen';
    const urlThumb = obtenerUrlThumbnail(item.imagen_url) || placeholder;

    tarjeta.innerHTML = `
      <div class="tarjeta-imagen">
        <img src="${urlThumb}" 
             alt="${item.genetica || 'Ejemplar'}" 
             loading="lazy" 
             onerror="this.onerror=null; this.src='${placeholder}';" />
        <span class="estado ${(item.estatus || '').toLowerCase()}">${item.estatus}</span>
      </div>
      <div class="tarjeta-contenido">
        <h3>${item.especie}</h3>
        <span class="genetica">${item.genetica}</span>
        <div class="detalles">
          <span>Sexo: <strong>${item.sexo}</strong></span>
          <span>Año: <strong>${item.nacimiento}</strong></span>
        </div>
        <div class="tarjeta-footer">
          <span class="precio">$${Number(item.precio).toLocaleString('es-MX')} MXN</span>
          <div class="acciones">
            <button type="button" class="btn-ver-ficha">Ver ficha</button>
          </div>
        </div>
      </div>
    `;

    tarjeta.addEventListener('click', () => abrirModalEjemplar(item, listaFiltradaGlobal));
    fragmento.appendChild(tarjeta);
  });

  container.appendChild(fragmento);
  paginaActual++;
}

function configurarIntersectionObserver() {
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  document.querySelector('.catalogo').appendChild(sentinel);

  observadorScroll = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      cargarMasTarjetas();
    }
  }, { rootMargin: '300px' });

  observadorScroll.observe(sentinel);
}

function configurarEventosFiltros() {
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');

  if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      document.getElementById('form-filtros').reset();
      listaFiltradaGlobal = [...listaCatalogGlobal];
      renderizarPaginaInicial();
    });
  }
}

function aplicarFiltros() {
  const genetica = document.getElementById('filtro-genetica')?.value.toLowerCase();
  const estatus = document.getElementById('filtro-estatus')?.value;
  const sexo = document.getElementById('filtro-sexo')?.value;
  const anio = document.getElementById('filtro-anio')?.value;

  listaFiltradaGlobal = listaCatalogGlobal.filter(item => {
    if (genetica && !item.genetica.toLowerCase().includes(genetica)) return false;
    if (estatus && item.estatus !== estatus) return false;
    if (sexo && item.sexo !== sexo) return false;
    if (anio && String(item.nacimiento) !== String(anio)) return false;
    return true;
  });

  renderizarPaginaInicial();
}