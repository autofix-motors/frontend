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
import { useDeleteUser } from '../users.queries'
import type { User } from '../users.schemas'

/**
 * Confirma el borrado de un usuario. El borrado es real: si el usuario ya dejó
 * algo registrado (órdenes, pagos, movimientos…), la API lo impide y aquí se
 * muestra por qué.
 */
export function DeleteUserDialog({
  user,
  onOpenChange,
}: {
  /** El usuario a borrar; sin él, el diálogo está cerrado. */
  user: User | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteUser()

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            Se eliminará a <strong>{user?.name}</strong> de forma definitiva.
            Esta acción no se puede deshacer. Si ya trabajó en el taller,
            desactívalo en su lugar.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!user || remove.isPending}
            onClick={() => {
              if (!user) return
              remove.mutate(user.userId, {
                onSuccess: () => onOpenChange(false),
              })
            }}
          >
            {remove.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
