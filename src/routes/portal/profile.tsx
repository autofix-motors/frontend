import { createFileRoute } from '@tanstack/react-router'
import { authQueries } from '#/modules/core/auth/auth.queries'
import { ProfileView } from '#/modules/core/auth/components/ProfileView'

// «Mi perfil» del cliente, dentro del portal (con su cabecera y su barra de
// abajo). Se entra desde el menú de la cuenta.
export const Route = createFileRoute('/portal/profile')({
  loader: ({ context: { queryClient, session } }) =>
    queryClient.ensureQueryData(authQueries.profile(session)),
  head: () => ({ meta: [{ title: 'Mi perfil · AutoFix Motors' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = Route.useRouteContext()
  return <ProfileView session={session} />
}
