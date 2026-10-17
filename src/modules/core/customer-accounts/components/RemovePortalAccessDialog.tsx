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
import type { Customer } from '#/modules/customer/customers/customers.schemas'
import { useRemovePortalAccess } from '../customer-accounts.queries'

/**
 * Quita el acceso de un cliente a su portal. Sus sesiones se cierran y su
 * contraseña se borra; sus órdenes no se tocan. Se le puede volver a dar
 * acceso cuando se quiera.
 */
export function RemovePortalAccessDialog({
  customer,
  onOpenChange,
}: {
  /** Sin cliente, el diálogo está cerrado. */
  customer: Customer | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useRemovePortalAccess()

  return (
    <Dialog
      open={Boolean(customer)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quitar acceso al portal</DialogTitle>
          <DialogDescription>
            {customer?.name ?? ''} ya no podrá entrar a su portal y se cerrará
            su sesión. Sus órdenes no cambian, y puedes volver a darle acceso
            cuando quieras.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            type="button"
            disabled={remove.isPending}
            onClick={() =>
              customer &&
              remove.mutate(customer.customerId, {
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            {remove.isPending ? 'Quitando…' : 'Quitar acceso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
