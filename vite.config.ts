import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    // Vite 8 manda la consola del navegador a la terminal cuando lo arranca un
    // agente de IA, y TanStack Devtools manda la terminal de vuelta a la
    // consola: juntos, un solo console.error rebota sin fin. Apagado siempre,
    // para que no dependa de quién arranca el servidor.
    forwardConsole: false,
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
