// ============================================
// app.js - Punto de entrada del JavaScript
// ============================================

import { cargarEjemplares } from './catalog.js';

console.log('🚀 ¡JavaScript está funcionando!');

document.addEventListener('DOMContentLoaded', () => {
  cargarEjemplares();
});