import { createFileRoute } from '@tanstack/react-router'

// El inicio del portal. Por ahora solo confirma la sesión del cliente: sus
// vehículos, órdenes y presupuestos llegan con el módulo del portal.
export const Route = createFileRoute('/portal/')({
  head: () => ({ meta: [{ title: 'Mi portal · AutoFix Motors' }] }),
  component: PortalHomePage,
})

function PortalHomePage() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">
        Hola, {session.name}
      </h1>
      <p className="text-sm text-muted-foreground">
        Pronto verás aquí tus vehículos, el avance de tus reparaciones y los
        presupuestos por responder.
      </p>
    </div>
  )
}
