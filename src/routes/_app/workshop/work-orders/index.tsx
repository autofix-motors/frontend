import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { usersQueries } from '#/modules/core/users/users.queries'
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import { vehiclesQueries } from '#/modules/customer/vehicles/vehicles.queries'
import { workOrdersQueries } from '#/modules/workshop/work-orders/work-orders.queries'
import {
  defaultWorkOrdersSearch,
  workOrdersSearchSchema,
} from '#/modules/workshop/work-orders/work-orders.schemas'
import { WorkOrderTable } from '#/modules/workshop/work-orders/components/WorkOrderTable'

// Sin `beforeLoad` de rol: los dos roles tienen su listado. El mecánico ve
// solo las suyas porque la API se lo impone, no por un filtro de la pantalla.
export const Route = createFileRoute('/_app/workshop/work-orders/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y abrir ya filtrado desde Vehículos o Clientes. Los
  // valores por defecto no se escriben, para que la URL quede limpia.
  validateSearch: workOrdersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultWorkOrdersSearch)] },
  loaderDeps: ({ search }) => search,
  // Los nombres de los filtros que llegan por id (mecánico, vehículo,
  // cliente) se precargan con `prefetchQuery`, que no falla: si no llegan, la
  // página se muestra igual. Solo para el administrador: esos listados son
  // suyos.
  loader: ({ context: { queryClient, session }, deps }) => {
    const isAdmin = hasRole(session, 'ADMIN')
    return Promise.all([
      queryClient.ensureQueryData(workOrdersQueries.list(deps)),
      isAdmin &&
        deps.mechanicId &&
        queryClient.prefetchQuery(usersQueries.detail(deps.mechanicId)),
      isAdmin &&
        deps.vehicleId &&
        queryClient.prefetchQuery(vehiclesQueries.detail(deps.vehicleId)),
      isAdmin &&
        deps.customerId &&
        queryClient.prefetchQuery(customersQueries.detail(deps.customerId)),
    ])
  },
  head: () => ({ meta: [{ title: 'Órdenes de trabajo · AutoFix Motors' }] }),
  component: WorkOrdersPage,
})

function WorkOrdersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(workOrdersQueries.list(search))
  const isAdmin = hasRole(session, 'ADMIN')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">
          {isAdmin ? 'Órdenes de trabajo' : 'Mis órdenes'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Cada ingreso de un vehículo al taller, desde que se recibe hasta que se entrega.'
            : 'Las órdenes que tienes asignadas. Abre una para registrar el diagnóstico, avanzar su estado o dejar una nota.'}
        </p>
      </div>
      <WorkOrderTable
        page={data}
        search={search}
        isFetching={isFetching}
        canManage={isAdmin}
        onSearchChange={(changes) =>
          void navigate({ search: (previous) => ({ ...previous, ...changes }) })
        }
      />
    </div>
  )
}
