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
 * Dónde se usa el formulario:
 * - `temporary`: la contraseña temporal (`/change-password`). Es lo único que
 *   hay en la pantalla, así que toma el foco, y al guardar sigue al inicio de
 *   quien la cambió: esa navegación vuelve a correr el `beforeLoad` del
 *   layout, que pide la sesión nueva (ya sin la marca). Con `replace`,
 *   «atrás» no vuelve al formulario.
 * - `profile`: el apartado de «Mi perfil» (`/account/profile`,
 *   `/portal/profile`). No toma el foco (abriría el teclado del celular
 *   encima de los datos) y al guardar se queda en la página con el formulario
 *   vacío: quien vino a su perfil a cambiarla no espera que lo saquen de ahí.
 */
type ChangePasswordMode = 'temporary' | 'profile'

/**
 * Cambiar la propia contraseña, para el personal y los clientes. Al guardar,
 * la API cierra las demás sesiones y deja una nueva; se avisa con un toast.
 */
export function ChangePasswordForm({ mode }: { mode: ChangePasswordMode }) {
  const router = useRouter()
  const change = useChangeOwnPassword()
  const isTemporary = mode === 'temporary'

  const form = useAppForm({
    defaultValues: emptyChangePasswordForm,
    validators: { onChange: changePasswordFormSchema },
    // Un rechazo (la actual no es correcta) queda en `change.error` y no se
    // relanza: quedaría sin capturar en la consola.
    onSubmit: ({ value, formApi }) =>
      change.mutateAsync(value).then(
        ({ session }) =>
          isTemporary
            ? router.navigate({ href: homeFor(session), replace: true })
            : formApi.reset(),
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
        <form.AppField name="contrasenaActual">
          {(field) => (
            <field.TextField
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              description={
                isTemporary
                  ? 'Si es tu primer ingreso, la que te compartió el taller.'
                  : undefined
              }
              autoFocus={isTemporary}
            />
          )}
        </form.AppField>
        <form.AppField
          name="contrasenaNueva"
          validators={{ onChangeListenTo: ['contrasenaActual'] }}
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
          name="confirmacion"
          // Se vuelve a comparar cuando cambia la nueva, no solo la
          // confirmación.
          validators={{ onChangeListenTo: ['contrasenaNueva'] }}
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
          <form.SubmitButton
            label={isTemporary ? 'Guardar y continuar' : 'Cambiar contraseña'}
            pendingLabel="Guardando…"
          />
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}
