// ============================================
// app.js - Punto de entrada del JavaScript
// ============================================

import { inicializarCatalogo } from './catalog.js';
import { inicializarModal } from './modal.js';

console.log('🚀 ¡JavaScript está funcionando!');

document.addEventListener('DOMContentLoaded', () => {
  inicializarCatalogo();
  inicializarModal();
});