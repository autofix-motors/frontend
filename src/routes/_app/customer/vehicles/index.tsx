import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import { vehiclesQueries } from '#/modules/customer/vehicles/vehicles.queries'
import {
  defaultVehiclesSearch,
  vehiclesSearchSchema,
} from '#/modules/customer/vehicles/vehicles.schemas'
import { VehicleTable } from '#/modules/customer/vehicles/components/VehicleTable'

export const Route = createFileRoute('/_app/customer/vehicles/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y abrir ya filtrado por cliente desde el listado de
  // clientes. Los valores por defecto no se escriben.
  validateSearch: vehiclesSearchSchema,
  search: { middlewares: [stripSearchParams(defaultVehiclesSearch)] },
  // Solo el administrador gestiona vehículos; la API lo vuelve a exigir.
  beforeLoad: ({ context }) => {
    if (context.session.role !== 'ADMIN') throw redirect({ to: '/' })
  },
  loaderDeps: ({ search }) => search,
  // Las marcas y el cliente del filtro se precargan con `prefetchQuery`, que no
  // falla: si no llegan, la página se muestra igual y el filtro lo indica.
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(vehiclesQueries.list(deps)),
      queryClient.prefetchQuery(vehiclesQueries.brands()),
      deps.customerId &&
        queryClient.prefetchQuery(customersQueries.detail(deps.customerId)),
    ]),
  head: () => ({ meta: [{ title: 'Vehículos · AutoFix Motors' }] }),
  component: VehiclesPage,
})

function VehiclesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isFetching } = useSuspenseQuery(vehiclesQueries.list(search))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Los vehículos de los clientes: lo que entra al taller.
        </p>
      </div>
      <VehicleTable
        page={data}
        search={search}
        isFetching={isFetching}
        onSearchChange={(changes) =>
          void navigate({ search: (previous) => ({ ...previous, ...changes }) })
        }
      />
    </div>
  )
}
