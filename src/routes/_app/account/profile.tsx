import { createFileRoute } from '@tanstack/react-router'
import { authQueries } from '#/modules/core/auth/auth.queries'
import { ProfileView } from '#/modules/core/auth/components/ProfileView'

// «Mi perfil» del personal, dentro de la app (con la barra lateral). Se entra
// desde el menú del usuario; no es un ítem del menú, pero tiene su breadcrumb
// en OFF_MENU_PAGES (components/layout/navigation.ts).
export const Route = createFileRoute('/_app/account/profile')({
  loader: ({ context: { queryClient, session } }) =>
    queryClient.ensureQueryData(authQueries.profile(session)),
  head: () => ({ meta: [{ title: 'Mi perfil · AutoFix Motors' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = Route.useRouteContext()
  return <ProfileView session={session} />
}
