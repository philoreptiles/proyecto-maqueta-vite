/**
 * Comprime y redimensiona una imagen utilizando Canvas API en formato WebP.
 * @param {File} file - Archivo de imagen original.
 * @param {number} calidad - Calidad de compresión (0.1 a 1.0).
 * @param {number} maxAncho - Ancho máximo permitido.
 * @param {number} maxAlto - Alto máximo permitido.
 * @param {string} sufijo - Sufijo para el nombre de archivo (ej. '_thumb').
 * @returns {Promise<File>} Archivo optimizado.
 */
export async function comprimirImagen(file, calidad = 0.8, maxAncho = 1200, maxAlto = 1200, sufijo = '') {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        if (ancho > maxAncho || alto > maxAlto) {
          if (ancho / alto > maxAncho / maxAlto) {
            alto = Math.round((alto * maxAncho) / ancho);
            ancho = maxAncho;
          } else {
            ancho = Math.round((ancho * maxAlto) / alto);
            alto = maxAlto;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const nombreBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            // Se inyecta el sufijo para identificar si es thumbnail o imagen completa
            const nuevoNombre = `${nombreBase}_${Date.now()}${sufijo}.webp`;

            const archivoComprimido = new File([blob], nuevoNombre, {
              type: 'image/webp',
              lastModified: Date.now()
            });

            resolve(archivoComprimido);
          },
          'image/webp',
          calidad
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}

/**
 * OPTIMIZACIÓN 1: GENERACIÓN DE THUMBNAILS
 * Genera automáticamente 2 versiones de cada imagen al subirla.
 */
export async function generarVersionesImagen(file) {
  if (!file || !file.type.startsWith('image/')) {
    return { thumbnail: file, completa: file };
  }

  // Thumbnail: 400x400px, calidad 0.7, para la lista principal
  const thumbnail = await comprimirImagen(file, 0.7, 400, 400, '_thumb');
  
  // Completa: 1200x1200px, calidad 0.8, para el modal de detalle
  const completa = await comprimirImagen(file, 0.8, 1200, 1200, '_full');

  return { thumbnail, completa };
}