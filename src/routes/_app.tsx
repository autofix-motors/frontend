import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { AppHeader } from '#/components/layout/AppHeader'
import { AppSidebar } from '#/components/layout/AppSidebar'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { getSession } from '#/modules/core/auth/auth.fn'

// La cookie donde shadcn guarda si la barra lateral quedó abierta o colapsada
// (components/ui/sidebar.tsx). Leerla al renderizar en el servidor evita que la
// barra aparezca abierta y se cierre de golpe al cargar la página.
const SIDEBAR_COOKIE = 'sidebar_state'

const readSidebarOpen = createIsomorphicFn()
  .server(() => getCookie(SIDEBAR_COOKIE) !== 'false')
  .client(() => !document.cookie.includes(`${SIDEBAR_COOKIE}=false`))

// Layout de la aplicación: todo lo que va dentro de _app/ comparte la barra
// lateral y exige sesión. El prefijo _ hace que no agregue nada a la URL.
export const Route = createFileRoute('/_app')({
  // Una sola comprobación protege todas las páginas de la app. Corre antes que
  // los loaders, y es el único lugar donde la sesión se renueva (ver getSession).
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    // Queda en el contexto: la leen la barra lateral y cualquier página con
    // Route.useRouteContext(), sin volver a pedirla.
    return { session }
  },
  loader: () => ({ sidebarOpen: readSidebarOpen() }),
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  const { sidebarOpen } = Route.useLoaderData()

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar session={session} />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
