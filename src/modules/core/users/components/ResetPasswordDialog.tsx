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
import { FieldError } from '#/components/ui/field'
import { useIssueUserTemporaryPassword } from '../users.queries'
import type { TemporaryPassword, User } from '../users.schemas'

/**
 * Restablece la contraseña de un usuario con una temporal que genera el
 * sistema (no hay «olvidé mi contraseña»). La API cierra sus sesiones; la
 * temporal se muestra después, para compartirla.
 */
export function ResetPasswordDialog({
  user,
  isSelf,
  onOpenChange,
  onIssued,
}: {
  /** El usuario al que se le restablece; sin él, el diálogo está cerrado. */
  user: User | undefined
  /** Si es el usuario de la sesión, también se le cierra la suya. */
  isSelf: boolean
  onOpenChange: (open: boolean) => void
  onIssued: (user: User, password: TemporaryPassword) => void
}) {
  const issue = useIssueUserTemporaryPassword()

  const reset = () => {
    if (!user) return
    issue.mutate(user.userId, {
      onSuccess: ({ password }) => {
        onOpenChange(false)
        onIssued(user, password)
      },
    })
  }

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) issue.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription>
            {isSelf
              ? 'Se generará una contraseña temporal y se cerrarán todas tus sesiones: tendrás que entrar con ella y elegir una nueva.'
              : `Se generará una contraseña temporal para ${user?.name ?? ''} y se cerrarán sus sesiones. Al entrar tendrá que elegir una nueva.`}
          </DialogDescription>
        </DialogHeader>
        {issue.error && <FieldError>{issue.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" disabled={issue.isPending} onClick={reset}>
            {issue.isPending ? 'Generando…' : 'Generar contraseña temporal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
