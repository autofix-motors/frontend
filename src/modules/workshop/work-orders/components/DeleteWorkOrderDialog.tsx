import { useNavigate } from '@tanstack/react-router'
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
import { useDeleteWorkOrder } from '../work-orders.queries'
import {
  defaultWorkOrdersSearch,
  formatWorkOrderNumber,
} from '../work-orders.schemas'
import type { WorkOrderDetail } from '../work-orders.schemas'

/**
 * Confirma el borrado de una orden registrada por error. El borrado es real;
 * si la orden ya tiene ítems, presupuestos o pagos, la API lo impide y aquí
 * se muestra por qué (lo que corresponde entonces es cancelarla). Al borrar,
 * vuelve al listado.
 */
export function DeleteWorkOrderDialog({
  open,
  onOpenChange,
  workOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder: WorkOrderDetail
}) {
  const remove = useDeleteWorkOrder()
  const navigate = useNavigate()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) remove.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar orden</DialogTitle>
          <DialogDescription>
            Se eliminará{' '}
            <strong>{formatWorkOrderNumber(workOrder.number)}</strong> y su
            línea de tiempo de forma definitiva. Es para una orden registrada
            por error; si el trabajo no se hará, cancélala.
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
              remove.mutate(workOrder.workOrderId, {
                onSuccess: () =>
                  void navigate({
                    to: '/workshop/work-orders',
                    search: defaultWorkOrdersSearch,
                  }),
              })
            }
          >
            {remove.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
