import { useRouter } from '@tanstack/react-router'
import { useAppForm } from '#/components/form/form'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useChangeOwnPassword } from '../auth.queries'
import {
  changePasswordFormSchema,
  emptyChangePasswordForm,
  homeFor,
} from '../auth.schemas'

/**
 * Cambiar la propia contraseña, para el personal y los clientes. Al guardar,
 * la API cierra las demás sesiones y deja una nueva; se sigue al inicio de
 * quien la cambió.
 */
export function ChangePasswordForm({ submitLabel }: { submitLabel: string }) {
  const router = useRouter()
  const change = useChangeOwnPassword()

  const form = useAppForm({
    defaultValues: emptyChangePasswordForm,
    validators: { onChange: changePasswordFormSchema },
    // Un rechazo (la actual no es correcta) queda en `change.error` y no se
    // relanza: quedaría sin capturar en la consola.
    onSubmit: ({ value }) =>
      change.mutateAsync(value).then(
        ({ session }) => router.navigate({ href: homeFor(session) }),
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
        <form.AppField name="currentPassword">
          {(field) => (
            <field.TextField
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              description="Si es tu primer ingreso, la que te compartió el taller."
              autoFocus
            />
          )}
        </form.AppField>
        <form.AppField
          name="newPassword"
          validators={{ onChangeListenTo: ['currentPassword'] }}
        >
          {(field) => (
            <field.TextField
              label="Contraseña nueva"
              type="password"
              autoComplete="new-password"
              description="Al menos 8 caracteres. No uses tu documento ni tu correo."
            />
          )}
        </form.AppField>
        <form.AppField
          name="confirmation"
          // Se vuelve a comparar cuando cambia la nueva, no solo la
          // confirmación.
          validators={{ onChangeListenTo: ['newPassword'] }}
        >
          {(field) => (
            <field.TextField
              label="Repite la contraseña nueva"
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        {change.error && <FieldError>{change.error.message}</FieldError>}
        <form.AppForm>
          <form.SubmitButton label={submitLabel} pendingLabel="Guardando…" />
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}
