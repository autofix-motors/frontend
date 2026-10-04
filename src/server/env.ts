import '@tanstack/react-start/server-only'
import { z } from 'zod'

// Variables de entorno que solo lee el servidor de TanStack Start. Nada de aquí
// puede llegar al navegador: el import de arriba hace fallar el build si un
// archivo del cliente importa este módulo.

const envSchema = z.object({
  API_URL: z.url({ error: 'API_URL tiene que ser la URL de la API de NestJS' }),
})

type ServerEnv = z.infer<typeof envSchema>

let env: ServerEnv | undefined

// Se valida en la primera lectura y no al importar: así un error de
// configuración sale con un mensaje claro en la primera llamada, y no rompe
// herramientas que solo cargan el módulo (el build, los tests).
export function getServerEnv(): ServerEnv {
  env ??= envSchema.parse(process.env)
  return env
}
