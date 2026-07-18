import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En dev, /api/* se redirige al backend proxy (evita CORS y mantiene la
    // key solo en el server). Arranca el backend con `npm run server`.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
