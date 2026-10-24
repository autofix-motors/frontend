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
import { useDeleteCustomer } from '../customers.queries'
import type { Customer } from '../customers.schemas'

/**
 * Confirma el borrado de un cliente. El borrado es real: si el cliente tiene
 * vehículos u órdenes, la API lo impide y aquí se muestra por qué.
 */
export function DeleteCustomerDialog({
  customer,
  onOpenChange,
}: {
  /** El cliente a borrar; sin él, el diálogo está cerrado. */
  customer: Customer | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteCustomer()

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
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            Se eliminará a <strong>{customer?.name}</strong> de forma
            definitiva. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!customer || remove.isPending}
            onClick={() => {
              if (!customer) return
              remove.mutate(customer.customerId, {
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
