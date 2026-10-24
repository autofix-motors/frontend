import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { usersQueries } from '#/modules/core/users/users.queries'
import { toolsQueries } from '#/modules/inventory/tools/tools.queries'
import {
  defaultToolsSearch,
  toolsSearchSchema,
} from '#/modules/inventory/tools/tools.schemas'
import { ToolTable } from '#/modules/inventory/tools/components/ToolTable'

// Sin `beforeLoad` de rol: las herramientas las consultan los dos roles. El
// mecánico las ve en solo lectura, y la API vuelve a exigir el rol en cada
// cambio.
export const Route = createFileRoute('/_app/inventory/tools/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y recorrer con atrás y adelante. Los valores por
  // defecto no se escriben, para que la URL quede limpia.
  validateSearch: toolsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultToolsSearch)] },
  loaderDeps: ({ search }) => search,
  // El nombre de quien filtra el administrador se precarga con
  // `prefetchQuery`, que no falla: si no llega, la página se muestra igual y
  // el filtro lo indica. El mecánico no lo pide: `/users` es solo de ADMIN.
  loader: ({ context: { queryClient, session }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(toolsQueries.list(deps)),
      hasRole(session, 'ADMIN') &&
        deps.assignedToId &&
        queryClient.prefetchQuery(usersQueries.detail(deps.assignedToId)),
    ]),
  head: () => ({ meta: [{ title: 'Herramientas · AutoFix Motors' }] }),
  component: ToolsPage,
})

function ToolsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(toolsQueries.list(search))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Herramientas</h1>
        <p className="text-sm text-muted-foreground">
          Lo que el taller presta a sus mecánicos: en qué estado está cada
          herramienta y quién la tiene.
        </p>
      </div>
      <ToolTable
        page={data}
        search={search}
        isFetching={isFetching}
        canManage={hasRole(session, 'ADMIN')}
        sessionUserId={session.userId}
        onSearchChange={(changes) =>
          void navigate({ search: (previous) => ({ ...previous, ...changes }) })
        }
      />
    </div>
  )
}
