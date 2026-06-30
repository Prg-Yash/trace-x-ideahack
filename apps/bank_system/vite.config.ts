import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@gten/sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/@gten\/sdk/, /node_modules/],
    },
  },
})
