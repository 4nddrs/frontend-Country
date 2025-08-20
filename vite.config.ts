import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Configura el proxy
    proxy: {
      '/api': {
        // La URL de tu backend en Render
        target: 'https://backend-country-nnxe.onrender.com',
        // Esto cambia el encabezado del Host para que coincida con el target
        changeOrigin: true,
        // Reescribe el camino para eliminar /api cuando la petición llegue al servidor
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
