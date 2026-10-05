import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { usersQueries } from '#/modules/core/users/users.queries'
import {
  defaultUsersSearch,
  usersSearchSchema,
} from '#/modules/core/users/users.schemas'
import { UserTable } from '#/modules/core/users/components/UserTable'

export const Route = createFileRoute('/_app/core/users/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y recorrer con atrás y adelante. Los valores por
  // defecto no se escriben, para que la URL quede limpia.
  validateSearch: usersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultUsersSearch)] },
  // Solo el administrador gestiona el personal; la API lo vuelve a exigir.
  beforeLoad: ({ context }) => {
    if (context.session.role !== 'ADMIN') throw redirect({ to: '/' })
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(usersQueries.list(deps)),
  head: () => ({ meta: [{ title: 'Personal · AutoFix Motors' }] }),
  component: UsersPage,
})

function UsersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { session } = Route.useRouteContext()
  const { data, isFetching } = useSuspenseQuery(usersQueries.list(search))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Personal</h1>
        <p className="text-sm text-muted-foreground">
          Quienes inician sesión en el sistema: administradores y mecánicos.
        </p>
      </div>
      <UserTable
        page={data}
        search={search}
        isFetching={isFetching}
        currentUserId={session.userId}
        onSearchChange={(changes) =>
          void navigate({ search: (previous) => ({ ...previous, ...changes }) })
        }
      />
    </div>
  )
}
