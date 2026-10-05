import { useRouter } from '@tanstack/react-router'
import { useAppForm } from '#/components/form/form'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useLogin } from '../auth.queries'
import { loginSchema } from '../auth.schemas'
import type { LoginInput } from '../auth.schemas'

const defaultValues: LoginInput = { email: '', password: '' }

/** El formulario de inicio de sesión. Al entrar, lleva a `redirectTo`. */
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const login = useLogin()

  const form = useAppForm({
    defaultValues,
    validators: { onChange: loginSchema },
    // Credenciales incorrectas: el mensaje sale de `login.error` y el error no
    // se relanza, para no dejarlo sin capturar en la consola.
    onSubmit: ({ value }) =>
      login.mutateAsync(value).then(
        () => router.navigate({ href: redirectTo }),
        () => undefined,
      ),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Correo"
              type="email"
              autoComplete="username"
              autoFocus
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
            />
          )}
        </form.AppField>
        {login.error && <FieldError>{login.error.message}</FieldError>}
        <form.AppForm>
          <form.SubmitButton label="Ingresar" pendingLabel="Ingresando…" />
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}
