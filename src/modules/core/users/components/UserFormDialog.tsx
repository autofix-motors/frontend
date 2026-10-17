import { useRouter } from '@tanstack/react-router'
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
import { useCreateUser, useUpdateUser } from '../users.queries'
import {
  emptyNewUserForm,
  newUserFormSchema,
  roleOptions,
  userFormSchema,
  userToForm,
} from '../users.schemas'
import type { IssuedUser, User } from '../users.schemas'

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El usuario a editar; sin él, el diálogo registra uno nuevo. */
  user?: User
  /** El usuario de la sesión: no puede desactivarse ni cambiarse el rol. */
  currentUserId: string
  /** Al registrar uno nuevo: su contraseña temporal, para compartirla. */
  onCreated: (issued: IssuedUser) => void
}

/** Alta y edición de un usuario, en un diálogo sobre el listado. */
export function UserFormDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onCreated,
}: UserFormDialogProps) {
  const onDone = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'La contraseña se restablece desde «Restablecer contraseña».'
              : 'Inicia sesión con su DNI o su correo. El sistema le genera una contraseña temporal que le compartes y él cambia al entrar.'}
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores del
            usuario elegido, no con lo que quedó escrito la vez anterior. */}
        {open &&
          (user ? (
            <EditUserForm
              user={user}
              isSelf={user.userId === currentUserId}
              onDone={onDone}
            />
          ) : (
            <NewUserForm
              onDone={(issued) => {
                onDone()
                onCreated(issued)
              }}
            />
          ))}
      </DialogContent>
    </Dialog>
  )
}

function NewUserForm({ onDone }: { onDone: (issued: IssuedUser) => void }) {
  const create = useCreateUser()

  const form = useAppForm({
    defaultValues: emptyNewUserForm,
    validators: { onChange: newUserFormSchema },
    // Un rechazo de la API (correo repetido) deja el diálogo abierto con su
    // mensaje y no se relanza: quedaría como error sin capturar en la consola.
    onSubmit: ({ value }) =>
      create.mutateAsync(value).then(
        ({ issued }) => onDone(issued),
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
        <form.AppField name="name">
          {(field) => <field.TextField label="Nombre" autoFocus />}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Correo" type="email" autoComplete="off" />
            )}
          </form.AppField>
          <form.AppField name="documentNumber">
            {(field) => (
              <field.TextField label="DNI" inputMode="numeric" maxLength={12} />
            )}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="phone">
            {(field) => (
              <field.TextField
                label="Celular (opcional)"
                type="tel"
                description="Para enviarle su acceso por WhatsApp."
              />
            )}
          </form.AppField>
          <form.AppField name="role">
            {(field) => (
              <field.SelectField label="Rol" options={roleOptions} />
            )}
          </form.AppField>
        </div>
        {create.error && <FieldError>{create.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Registrar" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}

function EditUserForm({
  user,
  isSelf,
  onDone,
}: {
  user: User
  isSelf: boolean
  onDone: () => void
}) {
  const update = useUpdateUser()
  const router = useRouter()

  const form = useAppForm({
    defaultValues: userToForm(user),
    validators: { onChange: userFormSchema },
    onSubmit: async ({ value }) => {
      try {
        await update.mutateAsync({ userId: user.userId, values: value })
      } catch {
        // El mensaje queda en `update.error`; relanzarlo lo dejaría sin
        // capturar en la consola.
        return
      }
      // El nombre y el correo propios se muestran en la barra lateral, que lee
      // la sesión del contexto del router: se vuelve a pedir.
      if (isSelf) await router.invalidate()
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
        <form.AppField name="name">
          {(field) => <field.TextField label="Nombre" autoFocus />}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Correo" type="email" autoComplete="off" />
            )}
          </form.AppField>
          <form.AppField name="documentNumber">
            {(field) => (
              <field.TextField label="DNI" inputMode="numeric" maxLength={12} />
            )}
          </form.AppField>
        </div>
        <form.AppField name="phone">
          {(field) => (
            <field.TextField label="Celular (opcional)" type="tel" />
          )}
        </form.AppField>
        {/* La API no deja que nadie se quite el rol ni se desactive a sí
            mismo: en el propio usuario esos campos no se ofrecen. */}
        <form.AppField name="role">
          {(field) => (
            <field.SelectField
              label="Rol"
              options={roleOptions}
              disabled={isSelf}
            />
          )}
        </form.AppField>
        <form.AppField name="isActive">
          {(field) => (
            <field.SwitchField
              label="Activo"
              description={
                isSelf
                  ? 'No puedes desactivar tu propio usuario.'
                  : 'Un usuario inactivo no puede iniciar sesión. Al desactivarlo o cambiarle el rol se cierran sus sesiones.'
              }
              disabled={isSelf}
            />
          )}
        </form.AppField>
        {update.error && <FieldError>{update.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Guardar cambios" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
