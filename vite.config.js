import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nosotros: resolve(__dirname, 'src/pages/nosotros.html'),
        admin: resolve(__dirname, 'src/pages/admin.html'),
      },
    },
  },
});
