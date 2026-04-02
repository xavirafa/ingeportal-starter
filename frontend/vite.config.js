import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    // Puerto configurable: 5173 en prod (Nginx), 5175 en dev. Ver NSSM service.
    port: parseInt(process.env.VITE_PORT) || 5173,
    allowedHosts: true,
    // Si corre en puerto 5175 (dev) → backend dev en 8001 con BD separada
    // Si corre en otro puerto (prod nginx) → backend prod en 8000
    proxy: (process.env.VITE_PORT === '5175') ? {
      '/api': { target: 'http://127.0.0.1:8001', changeOrigin: true, xfwd: true },
      '/ws':  { target: 'ws://127.0.0.1:8001',   ws: true,           xfwd: true },
    } : {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true, xfwd: true },
      '/ws':  { target: 'ws://127.0.0.1:8000',   ws: true,           xfwd: true },
    },
  },
})
