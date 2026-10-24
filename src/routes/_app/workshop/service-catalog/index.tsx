import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { serviceCatalogQueries } from '#/modules/workshop/service-catalog/service-catalog.queries'
import {
  defaultServiceCatalogSearch,
  serviceCatalogSearchSchema,
} from '#/modules/workshop/service-catalog/service-catalog.schemas'
import { ServiceCatalogTable } from '#/modules/workshop/service-catalog/components/ServiceCatalogTable'

// Sin `beforeLoad` de rol: el catálogo lo consultan los dos roles. El mecánico
// lo ve en solo lectura y la API vuelve a exigir el rol en cada cambio.
export const Route = createFileRoute('/_app/workshop/service-catalog/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y recorrer con atrás y adelante. Los valores por
  // defecto no se escriben, para que la URL quede limpia.
  validateSearch: serviceCatalogSearchSchema,
  search: { middlewares: [stripSearchParams(defaultServiceCatalogSearch)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(serviceCatalogQueries.list(deps)),
  head: () => ({ meta: [{ title: 'Catálogo de servicios · AutoFix Motors' }] }),
  component: ServiceCatalogPage,
})

function ServiceCatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(
    serviceCatalogQueries.list(search),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Catálogo de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Los trabajos que ofrece el taller y su precio de mano de obra
          referencial.
        </p>
      </div>
      <ServiceCatalogTable
        page={data}
        search={search}
        isFetching={isFetching}
        canManage={hasRole(session, 'ADMIN')}
        onSearchChange={(changes) =>
          void navigate({ search: (previous) => ({ ...previous, ...changes }) })
        }
      />
    </div>
  )
}
