import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { getSession } from '#/modules/core/auth/auth.fn'
import { safeRedirect } from '#/modules/core/auth/auth.schemas'
import { LoginForm } from '#/modules/core/auth/components/LoginForm'

// Fuera de _app: es la única pantalla que no pide sesión ni lleva la barra
// lateral. `redirect` es la página a la que se quería entrar.
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search.redirect === 'string' ? { redirect: search.redirect } : {},
  // Con sesión, el login no tiene nada que hacer: se sigue a donde iba.
  beforeLoad: async ({ search }) => {
    if (await getSession()) {
      throw redirect({ href: safeRedirect(search.redirect) })
    }
  },
  head: () => ({ meta: [{ title: 'Iniciar sesión · AutoFix Motors' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">AutoFix Motors</CardTitle>
          <CardDescription>
            Inicia sesión con la cuenta de tu organización.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={safeRedirect(redirectTo)} />
        </CardContent>
      </Card>
    </main>
  )
}
