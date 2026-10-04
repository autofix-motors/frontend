import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Config aparte de vite.config.ts: el plugin de TanStack Start arma el servidor
// y las server functions, y los tests no lo necesitan. Solo React y los alias.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
