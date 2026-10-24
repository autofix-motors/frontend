import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { PortalWorkOrderCard } from '#/modules/workshop/portal/components/PortalWorkOrderCard'
import { portalQueries } from '#/modules/workshop/portal/portal.queries'
import { defaultPortalWorkOrdersSearch } from '#/modules/workshop/portal/portal.schemas'

// El inicio del portal: primero lo que espera su respuesta, después lo que
// está en el taller. Los gráficos llegan con el módulo de inicios.
export const Route = createFileRoute('/portal/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(
      portalQueries.workOrders(defaultPortalWorkOrdersSearch),
    ),
  head: () => ({ meta: [{ title: 'Mi portal · AutoFix Motors' }] }),
  component: PortalHomePage,
})

function PortalHomePage() {
  const { session } = Route.useRouteContext()
  const { data } = useSuspenseQuery(
    portalQueries.workOrders(defaultPortalWorkOrdersSearch),
  )
  const awaiting = data.items.filter((order) => order.hasPendingQuote)
  const inShop = data.items.filter((order) => !order.hasPendingQuote)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">
          Hola, {session.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Aquí sigues las reparaciones de tus vehículos.
        </p>
      </div>

      {awaiting.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Esperan tu respuesta</h2>
          {awaiting.map((order) => (
            <PortalWorkOrderCard key={order.workOrderId} order={order} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">En el taller</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/portal/work-orders"
              search={defaultPortalWorkOrdersSearch}
            >
              Ver todas
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        {inShop.length ? (
          inShop.map((order) => (
            <PortalWorkOrderCard key={order.workOrderId} order={order} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {awaiting.length
              ? 'No tienes otros vehículos en el taller.'
              : 'No tienes vehículos en el taller ahora mismo.'}
          </p>
        )}
      </section>
    </div>
  )
}
