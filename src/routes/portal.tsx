import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { KeyRoundIcon, LogOutIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { getSession } from '#/modules/core/auth/auth.fn'
import { useLogout } from '#/modules/core/auth/auth.queries'
import { homeFor, isCustomerSession } from '#/modules/core/auth/auth.schemas'

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
  const logout = useLogout()

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/portal" className="font-heading text-lg font-semibold">
            AutoFix Motors
          </Link>
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.name}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/change-password">
                <KeyRoundIcon />
                <span className="sr-only sm:not-sr-only">Contraseña</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOutIcon />
              <span className="sr-only sm:not-sr-only">Salir</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
