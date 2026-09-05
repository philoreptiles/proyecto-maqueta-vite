/**
 * Comprime y redimensiona una imagen utilizando Canvas API.
 * @param {File} file - Archivo de imagen original.
 * @param {number} calidad - Calidad de compresión (0.1 a 1.0).
 * @param {number} maxAncho - Ancho máximo permitido.
 * @param {number} maxAlto - Alto máximo permitido.
 * @returns {Promise<File>} Archivo comprimido en formato WebP.
 */
export async function comprimirImagen(file, calidad = 0.75, maxAncho = 1200, maxAlto = 1200) {
  return new Promise((resolve, reject) => {
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
              reject(new Error('Error al procesar el lienzo de imagen.'));
              return;
            }

            const nombreLimpio = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const nuevoNombre = `${nombreLimpio}_compressed.webp`;

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

      img.onerror = (err) => reject(new Error('Error al cargar la imagen: ' + err));
    };

    reader.onerror = (err) => reject(new Error('Error al leer el archivo: ' + err));
  });
}

/**
 * Procesa la imagen del input y calcula métricas de compresión.
 * @param {HTMLInputElement} fileInput 
 * @param {number} calidad 
 * @returns {Promise<{file: File, stats: {originalKb: string, comprimidoKb: string, ahorro: string}}|null>}
 */
export async function procesarFotoConCompresion(fileInput, calidad = 0.75) {
  if (!fileInput.files || fileInput.files.length === 0) return null;

  const archivoOriginal = fileInput.files[0];
  const tamanoOriginalKb = archivoOriginal.size / 1024;

  const archivoComprimido = await comprimirImagen(archivoOriginal, calidad);
  const tamanoComprimidoKb = archivoComprimido.size / 1024;

  const ahorroPorcentaje = ((1 - tamanoComprimidoKb / tamanoOriginalKb) * 100).toFixed(1);

  return {
    file: archivoComprimido,
    stats: {
      originalKb: tamanoOriginalKb.toFixed(1),
      comprimidoKb: tamanoComprimidoKb.toFixed(1),
      ahorro: Math.max(0, ahorroPorcentaje)
    }
  };
}