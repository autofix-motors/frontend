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
import { useChangeWorkOrderStatus } from '../work-orders.queries'
import {
  TRANSITION_LABELS,
  WORK_ORDER_STATUS_LABELS,
  emptyStatusChangeForm,
  isClosed,
  statusChangeFormSchema,
} from '../work-orders.schemas'
import type { WorkOrderDetail, WorkOrderStatus } from '../work-orders.schemas'

type ChangeStatusDialogProps = {
  workOrder: WorkOrderDetail
  /** El estado al que se lleva la orden; sin él, el diálogo está cerrado. */
  status: WorkOrderStatus | undefined
  onOpenChange: (open: boolean) => void
}

/**
 * Confirmar un cambio de estado, con una nota para la línea de tiempo. Por
 * defecto el cliente lo ve en su seguimiento; cancelar pide el motivo y lo
 * deja interno.
 */
export function ChangeStatusDialog({
  workOrder,
  status,
  onOpenChange,
}: ChangeStatusDialogProps) {
  return (
    <Dialog open={Boolean(status)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {status && (
          <>
            <DialogHeader>
              <DialogTitle>{TRANSITION_LABELS[status]}</DialogTitle>
              <DialogDescription>
                La orden pasa de «{WORK_ORDER_STATUS_LABELS[workOrder.status]}»
                a «{WORK_ORDER_STATUS_LABELS[status]}».
                {isClosed(status) &&
                  ' Queda cerrada: ya no se edita ni cambia de estado.'}
              </DialogDescription>
            </DialogHeader>
            {/* Se monta con cada estado: la nota empieza vacía. */}
            <ChangeStatusForm
              key={status}
              workOrder={workOrder}
              status={status}
              onDone={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChangeStatusForm({
  workOrder,
  status,
  onDone,
}: {
  workOrder: WorkOrderDetail
  status: WorkOrderStatus
  onDone: () => void
}) {
  const change = useChangeWorkOrderStatus()
  const isCancel = status === 'CANCELLED'

  const form = useAppForm({
    defaultValues: emptyStatusChangeForm(status),
    validators: { onChange: statusChangeFormSchema(status) },
    // Un rechazo de la API (otro la movió mientras tanto) deja el diálogo
    // abierto con su mensaje y no se relanza.
    onSubmit: ({ value }) =>
      change
        .mutateAsync({ workOrderId: workOrder.workOrderId, status, ...value })
        .then(onDone, () => undefined),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label={isCancel ? 'Motivo de la cancelación' : 'Nota (opcional)'}
              placeholder={
                isCancel
                  ? 'El cliente decidió no reparar, no llegó el repuesto…'
                  : 'Lo que el cliente o el taller necesitan saber de este paso'
              }
              rows={3}
              autoFocus
            />
          )}
        </form.AppField>
        <form.AppField name="isPublic">
          {(field) => (
            <field.SwitchField
              label="Lo ve el cliente"
              description="En su página de seguimiento, junto al cambio de estado."
            />
          )}
        </form.AppField>
        {change.error && <FieldError>{change.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Volver
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label={TRANSITION_LABELS[status]} />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
