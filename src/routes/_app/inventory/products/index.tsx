import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { productsQueries } from '#/modules/inventory/products/products.queries'
import {
  defaultProductsSearch,
  productsSearchSchema,
} from '#/modules/inventory/products/products.schemas'
import { ProductTable } from '#/modules/inventory/products/components/ProductTable'

// Sin `beforeLoad` de rol: los repuestos los consultan los dos roles. El
// mecánico los ve en solo lectura y sin costos (la API no se los manda), y la
// API vuelve a exigir el rol en cada cambio.
export const Route = createFileRoute('/_app/inventory/products/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y recorrer con atrás y adelante. Los valores por
  // defecto no se escriben, para que la URL quede limpia.
  validateSearch: productsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultProductsSearch)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(productsQueries.list(deps)),
  head: () => ({ meta: [{ title: 'Repuestos e insumos · AutoFix Motors' }] }),
  component: ProductsPage,
})

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(productsQueries.list(search))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Repuestos e insumos</h1>
        <p className="text-sm text-muted-foreground">
          Lo que el taller compra, guarda y consume en las órdenes, con su stock
          y la alerta de stock bajo.
        </p>
      </div>
      <ProductTable
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
