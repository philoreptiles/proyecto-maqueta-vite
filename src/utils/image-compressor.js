// src/utils/image-compressor.js

/**
 * Comprime una imagen a formato WebP ajustando sus dimensiones y calidad.
 * @param {File} archivo - Archivo de imagen original.
 * @param {Object} opciones - Configuración de compresión.
 * @returns {Promise<Blob>} Imagen comprimida en Blob.
 */
export function comprimirImagen(archivo, opciones = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    calidad = 0.8,
    formato = 'image/webp'
  } = opciones;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir la imagen.'));
            }
          },
          formato,
          calidad
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Procesa una imagen generando ambas versiones (Full y Thumb) compartiendo la misma marca de tiempo.
 * @param {File} archivo 
 * @param {string} prefix 
 */
export async function procesarImagenCompletaYThumb(archivo, prefix = 'img') {
  const timeStamp = Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const cleanName = archivo.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  const fileNameFull = `${prefix}_${timeStamp}_${cleanName}_full.webp`;
  const fileNameThumb = `${prefix}_${timeStamp}_${cleanName}_thumb.webp`;

  const fullBlob = await comprimirImagen(archivo, { maxWidth: 1200, maxHeight: 1200, calidad: 0.8 });
  const thumbBlob = await comprimirImagen(archivo, { maxWidth: 400, maxHeight: 400, calidad: 0.7 });

  return {
    fullBlob,
    thumbBlob,
    fileNameFull,
    fileNameThumb
  };
}

/**
 * Obtiene la URL del thumbnail a partir de la URL de la imagen completa.
 * Garantiza retrocompatibilidad con imágenes antiguas.
 * @param {string} urlFull 
 * @returns {string|null}
 */
export function obtenerUrlThumbnail(urlFull) {
  if (!urlFull || typeof urlFull !== 'string') return null;
  if (urlFull.includes('_full.webp')) {
    return urlFull.replace('_full.webp', '_thumb.webp');
  }
  // Fallback para registros antiguos
  return urlFull;
}