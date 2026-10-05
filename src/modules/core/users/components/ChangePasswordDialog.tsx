import { useAppForm } from '#/components/form/form'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useChangeUserPassword } from '../users.queries'
import { emptyPasswordForm, passwordFormSchema } from '../users.schemas'
import type { User } from '../users.schemas'

/**
 * El administrador le asigna una contraseña nueva a un usuario (no hay «olvidé
 * mi contraseña»). La API cierra sus sesiones abiertas.
 */
export function ChangePasswordDialog({
  user,
  isSelf,
  onOpenChange,
}: {
  /** El usuario al que se le cambia; sin él, el diálogo está cerrado. */
  user: User | undefined
  /** Si es el usuario de la sesión, también se le cierra la suya. */
  isSelf: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {isSelf
              ? 'Se cerrarán todas tus sesiones: tendrás que volver a iniciar sesión con la contraseña nueva.'
              : `Se cerrarán las sesiones abiertas de ${user?.name ?? ''}: tendrá que volver a iniciar sesión con la contraseña nueva.`}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <PasswordForm user={user} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PasswordForm({ user, onDone }: { user: User; onDone: () => void }) {
  const change = useChangeUserPassword()

  const form = useAppForm({
    defaultValues: emptyPasswordForm,
    validators: { onChange: passwordFormSchema },
    onSubmit: async ({ value }) => {
      await change.mutateAsync({ userId: user.userId, values: value })
      onDone()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label="Contraseña nueva"
              type="password"
              autoComplete="new-password"
              description="Al menos 8 caracteres."
              autoFocus
            />
          )}
        </form.AppField>
        <form.AppField
          name="passwordConfirmation"
          validators={{ onChangeListenTo: ['password'] }}
        >
          {(field) => (
            <field.TextField
              label="Repite la contraseña"
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        {change.error && <FieldError>{change.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Cambiar contraseña" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
