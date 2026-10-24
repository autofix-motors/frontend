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
import { usersQueries } from '#/modules/core/users/users.queries'
import { useUpdateWorkOrder } from '../work-orders.queries'
import {
  formatWorkOrderNumber,
  updateWorkOrderFormSchema,
  workOrderToForm,
} from '../work-orders.schemas'
import type { WorkOrderDetail } from '../work-orders.schemas'

// Solo se le asigna una orden a alguien activo.
const activeUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: true })

type EditWorkOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder: WorkOrderDetail
}

/**
 * Corregir los datos del ingreso y asignar o cambiar el mecánico. El vehículo
 * no se cambia: la orden es un ingreso de ese vehículo.
 */
export function EditWorkOrderDialog({
  open,
  onOpenChange,
  workOrder,
}: EditWorkOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar {formatWorkOrderNumber(workOrder.number)}
          </DialogTitle>
          <DialogDescription>
            Cambiar el mecánico queda anotado en la línea de tiempo (como nota
            interna).
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores de la
            orden, no con lo que quedó escrito la vez anterior. */}
        {open && (
          <EditWorkOrderForm
            workOrder={workOrder}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditWorkOrderForm({
  workOrder,
  onDone,
}: {
  workOrder: WorkOrderDetail
  onDone: () => void
}) {
  const update = useUpdateWorkOrder()

  const form = useAppForm({
    defaultValues: workOrderToForm(workOrder),
    validators: {
      onChange: updateWorkOrderFormSchema(workOrder.promisedDate),
    },
    // Un rechazo de la API (mecánico inactivo, la orden se cerró mientras
    // tanto) deja el diálogo abierto con su mensaje y no se relanza.
    onSubmit: ({ value }) =>
      update
        .mutateAsync({ workOrderId: workOrder.workOrderId, values: value })
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
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="mileageIn">
            {(field) => (
              <field.TextField
                label="Kilometraje al ingreso"
                inputMode="numeric"
                autoFocus
              />
            )}
          </form.AppField>
          <form.AppField name="promisedDate">
            {(field) => (
              <field.DateField
                label="Fecha prometida (opcional)"
                description="Vacía: sin fecha comprometida."
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="reason">
          {(field) => (
            <field.TextareaField label="Motivo del ingreso" rows={3} />
          )}
        </form.AppField>
        <form.AppField name="mechanicId">
          {(field) => (
            <field.ComboboxField
              label="Mecánico"
              placeholder="Sin asignar"
              searchPlaceholder="Buscar por nombre o correo"
              emptyMessage="Nadie activo coincide"
              clearLabel="Dejarla sin asignar"
              optionsQuery={activeUserOptions}
              selectedOption={
                workOrder.mechanic
                  ? {
                      value: workOrder.mechanic.userId,
                      label: workOrder.mechanic.name,
                    }
                  : undefined
              }
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
