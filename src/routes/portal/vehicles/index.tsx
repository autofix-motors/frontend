import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { cn } from '#/lib/utils'
import { PortalPager } from '#/modules/workshop/portal/components/PortalPager'
import { PortalVehicleList } from '#/modules/workshop/portal/components/PortalVehicleList'
import { portalQueries } from '#/modules/workshop/portal/portal.queries'
import {
  defaultPortalVehiclesSearch,
  portalVehiclesSearchSchema,
} from '#/modules/workshop/portal/portal.schemas'
import type { PortalVehiclesSearch } from '#/modules/workshop/portal/portal.schemas'

// Los vehículos del cliente, con búsqueda por placa, marca o modelo. La
// búsqueda y la página viven en la URL.
export const Route = createFileRoute('/portal/vehicles/')({
  validateSearch: portalVehiclesSearchSchema,
  search: { middlewares: [stripSearchParams(defaultPortalVehiclesSearch)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(portalQueries.vehicles(deps)),
  head: () => ({ meta: [{ title: 'Mis vehículos · AutoFix Motors' }] }),
  component: PortalVehiclesPage,
})

function PortalVehiclesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isFetching } = useSuspenseQuery(portalQueries.vehicles(search))

  const change = (changes: Partial<PortalVehiclesSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...changes }) })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Mis vehículos</h1>
      <DataTableToolbar
        search={search.search}
        onSearchChange={(text) => change({ search: text, page: 1 })}
        searchPlaceholder="Buscar por placa, marca o modelo"
        isFiltered={Boolean(search.search)}
        onReset={() => change({ search: '', page: 1 })}
      />
      <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
        <PortalVehicleList
          vehicles={data.items}
          isSearching={Boolean(search.search)}
        />
      </div>
      <PortalPager meta={data.meta} onPageChange={(page) => change({ page })} />
    </div>
  )
}
