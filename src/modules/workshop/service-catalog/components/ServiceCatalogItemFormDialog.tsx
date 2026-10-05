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
import {
  useCreateServiceCatalogItem,
  useUpdateServiceCatalogItem,
} from '../service-catalog.queries'
import {
  emptyServiceCatalogItemForm,
  serviceCatalogItemFormSchema,
  serviceCatalogItemToForm,
} from '../service-catalog.schemas'
import type { ServiceCatalogItem } from '../service-catalog.schemas'

type ServiceCatalogItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El servicio a editar; sin él, el diálogo registra uno nuevo. */
  item?: ServiceCatalogItem
}

/** Alta y edición de un servicio del catálogo, en un diálogo sobre el listado. */
export function ServiceCatalogItemFormDialog({
  open,
  onOpenChange,
  item,
}: ServiceCatalogItemFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar servicio' : 'Nuevo servicio'}
          </DialogTitle>
          <DialogDescription>
            El precio es una referencia: al agregar el servicio a una orden se
            copia y ahí se puede ajustar.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores del
            servicio elegido, no con lo que quedó escrito la vez anterior. */}
        {open && (
          <ServiceCatalogItemForm
            item={item}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ServiceCatalogItemForm({
  item,
  onDone,
}: {
  item?: ServiceCatalogItem
  onDone: () => void
}) {
  const create = useCreateServiceCatalogItem()
  const update = useUpdateServiceCatalogItem()
  const mutation = item ? update : create

  const form = useAppForm({
    defaultValues: item
      ? serviceCatalogItemToForm(item)
      : emptyServiceCatalogItemForm,
    validators: { onChange: serviceCatalogItemFormSchema },
    onSubmit: async ({ value }) => {
      if (item) {
        await update.mutateAsync({
          serviceCatalogItemId: item.serviceCatalogItemId,
          values: value,
        })
      } else {
        await create.mutateAsync(value)
      }
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
        <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <form.AppField name="name">
            {(field) => <field.TextField label="Nombre" autoFocus />}
          </form.AppField>
          <form.AppField name="laborPrice">
            {(field) => <field.MoneyField label="Mano de obra" />}
          </form.AppField>
        </div>
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label="Descripción (opcional)"
              rows={3}
              placeholder="Qué incluye el servicio"
            />
          )}
        </form.AppField>
        <form.AppField name="isActive">
          {(field) => (
            <field.SwitchField
              label="Activo"
              description="Un servicio inactivo deja de ofrecerse al armar órdenes."
            />
          )}
        </form.AppField>
        {mutation.error && <FieldError>{mutation.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label={item ? 'Guardar cambios' : 'Registrar'} />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
