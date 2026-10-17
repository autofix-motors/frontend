import { Link, createFileRoute, redirect } from '@tanstack/react-router'
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
import { homeFor } from '#/modules/core/auth/auth.schemas'
import { ChangePasswordForm } from '#/modules/core/auth/components/ChangePasswordForm'

// Fuera de los layouts: con la contraseña temporal, la API no deja hacer otra
// cosa (PasswordChangeGuard), así que los dos layouts mandan aquí. Sirve
// también para cambiarla por gusto, desde el menú de la cuenta.
export const Route = createFileRoute('/change-password')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { session }
  },
  head: () => ({ meta: [{ title: 'Cambiar contraseña · AutoFix Motors' }] }),
  component: ChangePasswordPage,
})

function ChangePasswordPage() {
  const { session } = Route.useRouteContext()
  const logout = useLogout()
  const isRequired = session.mustChangePassword

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {isRequired ? 'Crea tu contraseña' : 'Cambiar contraseña'}
          </CardTitle>
          <CardDescription>
            {isRequired
              ? `Hola, ${session.name}. Entraste con una contraseña temporal: elige una propia para continuar.`
              : 'Se cerrarán tus sesiones en otros dispositivos.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            submitLabel={isRequired ? 'Guardar y continuar' : 'Cambiar contraseña'}
          />
        </CardContent>
        <CardFooter className="justify-center">
          {isRequired ? (
            <Button
              variant="link"
              size="sm"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="link" size="sm" asChild>
              <Link to={homeFor(session)}>Volver</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
