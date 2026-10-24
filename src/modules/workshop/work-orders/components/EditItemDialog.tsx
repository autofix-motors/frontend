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
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import { useUpdateWorkOrderItem } from '../work-orders.queries'
import {
  editItemFormSchema,
  formatItemQuantity,
  itemToEditForm,
  toUpdateItemRequest,
} from '../work-orders.schemas'
import type { WorkOrderItem } from '../work-orders.schemas'

type EditItemDialogProps = {
  workOrderId: string
  /** El ítem que se edita; sin él, el diálogo está cerrado. */
  item: WorkOrderItem | undefined
  role: UserRole
  onOpenChange: (open: boolean) => void
}

/**
 * Editar un ítem. De un servicio se cambia la cantidad; el precio y la
 * descripción, solo el administrador. La cantidad de un repuesto no se edita:
 * ya movió el stock, y para corregirla se quita y se vuelve a agregar.
 */
export function EditItemDialog({
  workOrderId,
  item,
  role,
  onOpenChange,
}: EditItemDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>Editar ítem</DialogTitle>
              <DialogDescription>
                {item.type === 'PRODUCT'
                  ? `La cantidad (${formatItemQuantity(item)}) ya se descontó del stock: para cambiarla, quita el repuesto y vuelve a agregarlo.`
                  : item.description}
              </DialogDescription>
            </DialogHeader>
            <EditItemForm
              key={item.workOrderItemId}
              workOrderId={workOrderId}
              item={item}
              role={role}
              onDone={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditItemForm({
  workOrderId,
  item,
  role,
  onDone,
}: {
  workOrderId: string
  item: WorkOrderItem
  role: UserRole
  onDone: () => void
}) {
  const update = useUpdateWorkOrderItem()
  const canEditQuantity = item.type === 'SERVICE'
  const canEditPrice = role === 'ADMIN'

  const form = useAppForm({
    defaultValues: itemToEditForm(item),
    validators: {
      onChange: editItemFormSchema({ canEditQuantity, canEditPrice }),
    },
    // Un rechazo de la API deja el diálogo abierto con su mensaje.
    onSubmit: ({ value }) =>
      update
        .mutateAsync(toUpdateItemRequest(workOrderId, item, value, role))
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
        {canEditPrice && (
          <form.AppField name="description">
            {(field) => <field.TextField label="Descripción" autoFocus />}
          </form.AppField>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {canEditQuantity && (
            <form.AppField name="quantity">
              {(field) => (
                <field.QuantityField label="Veces" autoFocus={!canEditPrice} />
              )}
            </form.AppField>
          )}
          {canEditPrice && (
            <form.AppField name="unitPrice">
              {(field) => <field.MoneyField label="Precio unitario" />}
            </form.AppField>
          )}
        </div>
        {update.error && <FieldError>{update.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Guardar" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
