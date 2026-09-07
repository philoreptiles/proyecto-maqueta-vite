// ============================================
// modal.js - Lógica de Ficha Ampliada, Zoom y Navegación
// ============================================
import { obtenerUrlThumbnail } from '../utils/image-compressor.js';

const WHATSAPP_NUMERO = '525573461033';

let listaEjemplaresActuales = [];
let indiceEjemplarActual = -1;

export function inicializarModal() {
  const vista = document.getElementById('vista-destacada');
  const btnCerrar = document.getElementById('modal-cerrar');
  const btnPrev = document.getElementById('modal-prev');
  const btnNext = document.getElementById('modal-next');

  if (vista) {
    if (btnCerrar) {
      btnCerrar.addEventListener('click', cerrarModal);
    }

    vista.addEventListener('click', (e) => {
      if (e.target === vista) cerrarModal();
    });

    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navegarEjemplar(-1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navegarEjemplar(1);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!vista.classList.contains('activo')) return;

      if (e.key === 'Escape') {
        cerrarModal();
      } else if (e.key === 'ArrowLeft') {
        navegarEjemplar(-1);
      } else if (e.key === 'ArrowRight') {
        navegarEjemplar(1);
      }
    });

    inicializarZoomGaleria();
  }
}

function inicializarZoomGaleria() {
  const galeriaMain = document.querySelector('.galeria-main');
  const mainImg = document.getElementById('modal-img');

  if (!galeriaMain || !mainImg) return;

  galeriaMain.addEventListener('mouseenter', () => {
    galeriaMain.classList.add('zoomed');
  });

  galeriaMain.addEventListener('mousemove', (e) => {
    const rect = galeriaMain.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mainImg.style.transformOrigin = `${x}% ${y}%`;
  });

  galeriaMain.addEventListener('mouseleave', () => {
    galeriaMain.classList.remove('zoomed');
    mainImg.style.transformOrigin = 'center center';
  });
}

function actualizarEstadoNavegacion() {
  const btnPrev = document.getElementById('modal-prev');
  const btnNext = document.getElementById('modal-next');

  if (btnPrev) {
    btnPrev.disabled = indiceEjemplarActual <= 0;
  }
  if (btnNext) {
    btnNext.disabled = indiceEjemplarActual >= listaEjemplaresActuales.length - 1;
  }
}

function navegarEjemplar(direccion) {
  if (!listaEjemplaresActuales.length || indiceEjemplarActual === -1) return;

  const nuevoIndice = indiceEjemplarActual + direccion;

  if (nuevoIndice < 0 || nuevoIndice >= listaEjemplaresActuales.length) return;

  const siguienteEjemplar = listaEjemplaresActuales[nuevoIndice];
  abrirModalEjemplar(siguienteEjemplar, listaEjemplaresActuales, nuevoIndice);
}

export function abrirModalEjemplar(ejemplar, listaContexto = [], indiceForzado = -1) {
  const vista = document.getElementById('vista-destacada');
  if (!vista || !ejemplar) return;

  if (Array.isArray(listaContexto) && listaContexto.length > 0) {
    listaEjemplaresActuales = listaContexto;
  }

  if (indiceForzado >= 0 && indiceForzado < listaEjemplaresActuales.length) {
    indiceEjemplarActual = indiceForzado;
  } else if (listaEjemplaresActuales.length > 0) {
    const indexEncontrado = listaEjemplaresActuales.findIndex(e => {
      if (e === ejemplar) return true;
      const matchId = e.id != null && ejemplar.id != null && String(e.id) === String(ejemplar.id);
      const matchCodigo = e.codigo != null && ejemplar.codigo != null && String(e.codigo) === String(ejemplar.codigo);
      return matchId || matchCodigo;
    });

    indiceEjemplarActual = indexEncontrado !== -1 ? indexEncontrado : 0;
  }

  actualizarEstadoNavegacion();

  const codigo = ejemplar.codigo || ejemplar.id;
  if (codigo) {
    history.replaceState(null, null, `#${codigo}`);
  }

  const precioNum = typeof ejemplar.precio === 'string'
    ? parseFloat(ejemplar.precio.replace(/[^0-9.]/g, ''))
    : ejemplar.precio;
  const precioFormatted = (precioNum || 0).toLocaleString('en-US');

  // Lectura tolerante de columnas antiguas
  const img1 = ejemplar.imagen_url || ejemplar.imagen_url_1 || ejemplar.imagen_1 || ejemplar.imagen;
  const img2 = ejemplar.imagen_url2 || ejemplar.imagen_url_2 || ejemplar.imagen_2;
  const img3 = ejemplar.imagen_url3 || ejemplar.imagen_url_3 || ejemplar.imagen_3;

  const imagenes = [img1, img2, img3].filter(url => url && typeof url === 'string' && url.trim() !== '');

  const mainImg = document.getElementById('modal-img');
  const thumbsContainer = document.getElementById('modal-galeria-thumbs');

  if (mainImg) {
    mainImg.src = imagenes.length > 0 ? imagenes[0] : 'https://placehold.co/600x400/141b21/94a3b8?text=Sin+imagen';
    mainImg.alt = ejemplar.genetica || 'Ejemplar';
    mainImg.style.transformOrigin = 'center center';
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    if (imagenes.length > 1) {
      imagenes.forEach((url, index) => {
        const thumb = document.createElement('img');
        
        // Uso de función centralizada
        thumb.src = obtenerUrlThumbnail(url) || url;
        thumb.alt = `Vista ${index + 1}`;
        thumb.className = `thumb-img ${index === 0 ? 'activo' : ''}`;
        
        thumb.addEventListener('click', () => {
          mainImg.src = url; 
          thumbsContainer.querySelectorAll('.thumb-img').forEach((t, i) => {
            t.classList.toggle('activo', i === index);
          });
        });

        thumbsContainer.appendChild(thumb);
      });
      thumbsContainer.style.display = 'flex';
    } else {
      thumbsContainer.style.display = 'none';
    }
  }

  const estatusEl = document.getElementById('modal-estatus');
  const estatusTexto = ejemplar.estatus || 'Disponible';
  const estatusLower = estatusTexto.toLowerCase();

  if (estatusEl) {
    estatusEl.textContent = estatusTexto;
    estatusEl.className = `estado ${estatusLower}`;
  }

  document.getElementById('modal-especie').textContent = ejemplar.especie || 'Especie no especificada';
  document.getElementById('modal-genetica').textContent = ejemplar.genetica || 'Sin información genética';
  document.getElementById('modal-precio').textContent = `$${precioFormatted} MXN`;
  document.getElementById('modal-id').textContent = codigo || 'N/A';
  document.getElementById('modal-sexo').textContent = ejemplar.sexo || 'No sexado';
  document.getElementById('modal-nacimiento').textContent = ejemplar.nacimiento || 'N/A';

  const btnWa = document.getElementById('modal-btn-whatsapp');
  let textoBtnWa = 'Consultar disponibilidad por WhatsApp';
  let mensajeWa = `Hola Escama y Colmillo, me interesa consultar disponibilidad del ejemplar ID: ${codigo} (${ejemplar.genetica || 'Sin información'})`;

  if (estatusLower === 'vendido' || estatusLower === 'apartado') {
    textoBtnWa = 'Consultar similares por WhatsApp';
    mensajeWa = `Hola Escama y Colmillo, vi que el ejemplar ID: ${codigo} (${ejemplar.genetica || 'Sin información'}) está ${estatusLower}. ¿Tienen ejemplares similares disponibles?`;
  }

  if (btnWa) {
    btnWa.textContent = textoBtnWa;
    btnWa.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeWa)}`;
  }

  vista.classList.remove('oculto');
  vista.classList.add('activo');
  vista.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

export function cerrarModal() {
  const vista = document.getElementById('vista-destacada');
  if (vista) {
    vista.classList.remove('activo');
    vista.classList.add('oculto');
    vista.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
  }
}