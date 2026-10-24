import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import {
  customersSearchSchema,
  defaultCustomersSearch,
} from '#/modules/customer/customers/customers.schemas'
import { CustomerTable } from '#/modules/customer/customers/components/CustomerTable'

export const Route = createFileRoute('/_app/customer/customers/')({
  // La búsqueda, los filtros y la página viven en la URL: el listado se puede
  // recargar, compartir y recorrer con atrás y adelante. Los valores por
  // defecto no se escriben, para que la URL quede limpia.
  validateSearch: customersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultCustomersSearch)] },
  // Solo el administrador gestiona clientes; la API lo vuelve a exigir.
  beforeLoad: ({ context }) => {
    if (context.session.role !== 'ADMIN') throw redirect({ to: '/' })
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(customersQueries.list(deps)),
  head: () => ({ meta: [{ title: 'Clientes · AutoFix Motors' }] }),
  component: CustomersPage,
})

function CustomersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isFetching } = useSuspenseQuery(customersQueries.list(search))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Las personas y empresas que traen sus vehículos al taller.
        </p>
      </div>
      <CustomerTable
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
