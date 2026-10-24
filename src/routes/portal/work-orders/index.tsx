import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { PortalWorkOrderList } from '#/modules/workshop/portal/components/PortalWorkOrderList'
import { portalQueries } from '#/modules/workshop/portal/portal.queries'
import {
  defaultPortalWorkOrdersSearch,
  portalWorkOrdersSearchSchema,
} from '#/modules/workshop/portal/portal.schemas'

// Las reparaciones (órdenes) del cliente. La pestaña, el vehículo y la página
// viven en la URL: «Mis vehículos» enlaza a las de uno, ya filtradas.
export const Route = createFileRoute('/portal/work-orders/')({
  validateSearch: portalWorkOrdersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultPortalWorkOrdersSearch)] },
  loaderDeps: ({ search }) => search,
  // El vehículo del filtro (para mostrar su placa) se precarga sin bloquear.
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(portalQueries.workOrders(deps)),
      deps.vehicleId &&
        queryClient.prefetchQuery(portalQueries.vehicle(deps.vehicleId)),
    ]),
  head: () => ({ meta: [{ title: 'Mis reparaciones · AutoFix Motors' }] }),
  component: PortalWorkOrdersPage,
})

function PortalWorkOrdersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isFetching } = useSuspenseQuery(
    portalQueries.workOrders(search),
  )
  const { data: vehicle } = useQuery({
    ...portalQueries.vehicle(search.vehicleId ?? ''),
    enabled: Boolean(search.vehicleId),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Mis reparaciones</h1>
      <PortalWorkOrderList
        page={data}
        search={search}
        vehicle={vehicle}
        isFetching={isFetching}
        onSearchChange={(changes) =>
          void navigate({ search: (prev) => ({ ...prev, ...changes }) })
        }
      />
    </div>
  )
}
