import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Static vitrine build (see CLAUDE.md §10b) is triggered by setting
// VITE_STATIC_TENANT=<slug> and VITE_STATIC_BASE=/repo-name/ at build time.
export default defineConfig(() => {
  const staticTenant = process.env.VITE_STATIC_TENANT
  const base = staticTenant ? (process.env.VITE_STATIC_BASE || '/') : '/'

  return {
    plugins: [react()],
    base,
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      sourcemap: false,
    },
  }
})
