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
import { afterLogin } from '#/modules/core/auth/auth.schemas'
import type { LoginAudience } from '#/modules/core/auth/auth.schemas'
import { LoginForm } from '#/modules/core/auth/components/LoginForm'

type LoginSearch = { redirect?: string; audience?: 'staff' }

// Fuera de _app: no pide sesión ni lleva la barra lateral. Es un solo login
// para todos: por omisión el del cliente, y con «Soy interno» el del personal
// (`?audience=staff`). `redirect` es la página a la que se quería entrar.
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    ...(typeof search.redirect === 'string' && { redirect: search.redirect }),
    ...(search.audience === 'staff' && { audience: 'staff' as const }),
  }),
  // Con sesión, el login no tiene nada que hacer: se sigue a su inicio.
  beforeLoad: async ({ search }) => {
    const session = await getSession()
    if (session) throw redirect({ href: afterLogin(session, search.redirect) })
  },
  head: () => ({ meta: [{ title: 'Iniciar sesión · AutoFix Motors' }] }),
  component: LoginPage,
})

const COPY: Record<LoginAudience, { description: string; switchLabel: string }> =
  {
    customer: {
      description:
        'Sigue las reparaciones de tu vehículo y responde tus presupuestos.',
      switchLabel: 'Soy interno',
    },
    staff: {
      description: 'Acceso del personal del taller.',
      switchLabel: 'Soy cliente',
    },
  }

function LoginPage() {
  const search = Route.useSearch()
  const audience: LoginAudience = search.audience ?? 'customer'
  const copy = COPY[audience]

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">AutoFix Motors</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* La key vuelve a montar el formulario al cambiar de login: no se
              arrastra lo escrito en el otro. */}
          <LoginForm
            key={audience}
            audience={audience}
            redirect={search.redirect}
          />
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" size="sm" asChild>
            <Link
              to="/login"
              search={{
                redirect: search.redirect,
                audience: audience === 'customer' ? 'staff' : undefined,
              }}
            >
              {copy.switchLabel}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
