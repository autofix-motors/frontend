import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '#/modules/core/auth/auth.fn'
import { homeFor, isCustomerSession } from '#/modules/core/auth/auth.schemas'
import { PortalBottomNav } from '#/modules/workshop/portal/components/PortalBottomNav'
import { PortalHeader } from '#/modules/workshop/portal/components/PortalHeader'

// Layout del portal del cliente: sus páginas cuelgan de /portal y no llevan la
// barra lateral del personal. Como _app, exige sesión, y es el único lugar del
// portal donde se renueva (getSession).
export const Route = createFileRoute('/portal')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    // El personal tiene su app; con la contraseña temporal, solo se cambia.
    if (!isCustomerSession(session) || session.mustChangePassword) {
      throw redirect({ href: homeFor(session) })
    }
    return { session }
  },
  component: PortalLayout,
})

function PortalLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <PortalHeader session={session} />
      {/* Abajo deja lugar para la barra de secciones del celular. */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pb-24 sm:pb-6 md:p-6">
        <Outlet />
      </main>
      <PortalBottomNav />
    </div>
  )
}
