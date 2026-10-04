import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

/**
 * Lo que se muestra cuando una página no puede cargar: la API caída, un error
 * de la API o una excepción. Se registra una vez como `defaultErrorComponent`
 * del router, así que cubre todas las rutas; como se muestra en lugar de la
 * página y no del layout, la barra lateral sigue disponible.
 *
 * El mensaje es el que trae el error: los de la API ya vienen en español desde
 * `server/api.ts`.
 */
export function ErrorScreen({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Reintentar es volver a correr los loaders de la página, no solo re-renderizar:
  // `invalidate` vuelve a pedir los datos y `reset` limpia el estado de error.
  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="text-lg font-semibold">No se pudo cargar la página</h1>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error && error.message
          ? error.message
          : 'Ocurrió un error inesperado'}
      </p>
      <Button variant="outline" size="sm" onClick={retry}>
        Reintentar
      </Button>
    </div>
  )
}
