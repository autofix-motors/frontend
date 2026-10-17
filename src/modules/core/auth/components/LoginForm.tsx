import { useRouter } from '@tanstack/react-router'
import { useAppForm } from '#/components/form/form'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useLogin } from '../auth.queries'
import { afterLogin, loginSchema } from '../auth.schemas'
import type { LoginAudience, LoginInput } from '../auth.schemas'

const defaultValues: LoginInput = { identifier: '', password: '' }

/** Qué se le pide a cada uno en el campo del usuario. */
const IDENTIFIER_LABELS: Record<LoginAudience, string> = {
  customer: 'Número de documento o correo',
  staff: 'DNI o correo',
}

/**
 * El formulario de inicio de sesión, del cliente o del personal. Al entrar
 * lleva a su inicio (o a cambiar la contraseña temporal), o a `redirect` si
 * corresponde a quien entró.
 */
export function LoginForm({
  audience,
  redirect,
}: {
  audience: LoginAudience
  redirect?: string
}) {
  const router = useRouter()
  const login = useLogin()

  const form = useAppForm({
    defaultValues,
    validators: { onChange: loginSchema },
    // Credenciales incorrectas: el mensaje sale de `login.error` y el error no
    // se relanza, para no dejarlo sin capturar en la consola.
    onSubmit: ({ value }) =>
      login.mutateAsync({ ...value, audience }).then(
        (session) => router.navigate({ href: afterLogin(session, redirect) }),
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
        <form.AppField name="identifier">
          {(field) => (
            <field.TextField
              label={IDENTIFIER_LABELS[audience]}
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
