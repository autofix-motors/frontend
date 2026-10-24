import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { productsQueries } from '#/modules/inventory/products/products.queries'
import { stockMovementsQueries } from '#/modules/inventory/stock-movements/stock-movements.queries'
import {
  defaultStockMovementsSearch,
  stockMovementsSearchSchema,
} from '#/modules/inventory/stock-movements/stock-movements.schemas'
import { StockMovementTable } from '#/modules/inventory/stock-movements/components/StockMovementTable'

// Sin `beforeLoad` de rol: el kardex lo consultan los dos roles. El mecánico
// lo ve en solo lectura y sin costos (la API no se los manda), y la API vuelve
// a exigir el rol al registrar.
export const Route = createFileRoute('/_app/inventory/stock-movements/')({
  // La búsqueda, los filtros y la página viven en la URL: el kardex se puede
  // recargar, compartir y abrir ya filtrado por producto desde Repuestos. Los
  // valores por defecto no se escriben.
  validateSearch: stockMovementsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultStockMovementsSearch)] },
  loaderDeps: ({ search }) => search,
  // El producto del filtro se precarga con `prefetchQuery`, que no falla: si
  // no llega, la página se muestra igual y el filtro lo indica.
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(stockMovementsQueries.list(deps)),
      deps.productId &&
        queryClient.prefetchQuery(productsQueries.detail(deps.productId)),
    ]),
  head: () => ({ meta: [{ title: 'Movimientos de stock · AutoFix Motors' }] }),
  component: StockMovementsPage,
})

function StockMovementsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(
    stockMovementsQueries.list(search),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Movimientos de stock</h1>
        <p className="text-sm text-muted-foreground">
          El kardex: cada entrada y salida de un producto, con su motivo. Un
          movimiento no se edita ni se borra; un error se corrige con un ajuste.
        </p>
      </div>
      <StockMovementTable
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
