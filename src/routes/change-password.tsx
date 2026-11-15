import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { getSession } from '#/modules/core/auth/auth.fn'
import { useLogout } from '#/modules/core/auth/auth.queries'
import { profilePageFor } from '#/modules/core/auth/auth.schemas'
import { ChangePasswordForm } from '#/modules/core/auth/components/ChangePasswordForm'

// Solo para la contraseña temporal. Va fuera de los layouts: con ella la API
// no deja hacer otra cosa (PasswordChangeGuard), así que los dos layouts
// mandan aquí. Cambiarla por gusto es en «Mi perfil», dentro de cada layout
// (/account/profile, /portal/profile), y quien llega aquí sin una temporal
// pendiente (un enlace viejo, el botón «atrás») va a su perfil.
export const Route = createFileRoute('/change-password')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (!session.debeCambiarContrasena) {
      throw redirect({ to: profilePageFor(session) })
    }
    return { session }
  },
  head: () => ({ meta: [{ title: 'Crea tu contraseña · AutoFix Motors' }] }),
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  const { session } = Route.useRouteContext()
  const logout = useLogout()

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Crea tu contraseña</CardTitle>
          <CardDescription>
            Hola, {session.nombre}. Entraste con una contraseña temporal: elige
            una propia para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm mode="temporary" />
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            variant="link"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
