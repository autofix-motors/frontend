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
import { useRemoveWorkOrderItem } from '../work-orders.queries'
import { formatItemQuantity } from '../work-orders.schemas'
import type { WorkOrderItem } from '../work-orders.schemas'

/**
 * Confirma que se quita un ítem de la orden. Si es un repuesto, deja claro que
 * su cantidad vuelve al stock (la API registra la devolución en el kardex).
 */
export function RemoveItemDialog({
  workOrderId,
  item,
  onOpenChange,
}: {
  workOrderId: string
  /** El ítem que se quita; sin él, el diálogo está cerrado. */
  item: WorkOrderItem | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useRemoveWorkOrderItem()

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(next) => {
        if (!next) remove.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>
                {item.type === 'PRODUCT'
                  ? 'Quitar repuesto'
                  : 'Quitar servicio'}
              </DialogTitle>
              <DialogDescription>
                Se quitará <strong>{item.description}</strong> de la orden.
                {item.type === 'PRODUCT' &&
                  ` Su cantidad (${formatItemQuantity(item)}) vuelve al stock.`}
              </DialogDescription>
            </DialogHeader>
            {remove.error && <FieldError>{remove.error.message}</FieldError>}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(
                    {
                      workOrderId,
                      workOrderItemId: item.workOrderItemId,
                      type: item.type,
                    },
                    { onSuccess: () => onOpenChange(false) },
                  )
                }
              >
                {remove.isPending ? 'Quitando…' : 'Quitar'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
