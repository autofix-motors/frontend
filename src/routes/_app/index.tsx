import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { hasRole } from '#/modules/core/auth/auth.schemas'
import { dashboardQueries } from '#/modules/workshop/dashboard/dashboard.queries'
import { formatTodayInLima } from '#/modules/workshop/dashboard/dashboard.schemas'
import { DashboardView } from '#/modules/workshop/dashboard/components/DashboardView'

// El inicio del personal: el panel del taller. Los dos roles entran (la API
// decide qué le manda a cada uno), así que no hay `beforeLoad` de rol.
export const Route = createFileRoute('/_app/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQueries.summary()),
  head: () => ({ meta: [{ title: 'Inicio · AutoFix Motors' }] }),
  component: HomePage,
})

function HomePage() {
  const { session } = Route.useRouteContext()
  const { data } = useSuspenseQuery(dashboardQueries.summary())
  const isAdmin = hasRole(session, 'ADMINISTRADOR')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Hola, {session.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {formatTodayInLima()} ·{' '}
          {isAdmin ? 'Así va el taller hoy.' : 'Así van tus órdenes hoy.'}
        </p>
      </div>
      <DashboardView dashboard={data} isAdmin={isAdmin} />
    </div>
  )
}
