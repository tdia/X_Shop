import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base relative : le build fonctionne à la racine d'un domaine
  // comme dans un sous-dossier (hébergement mutualisé, etc.)
  base: './',
  plugins: [react()],
})
