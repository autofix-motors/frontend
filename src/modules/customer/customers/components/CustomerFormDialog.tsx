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
import { useCreateCustomer, useUpdateCustomer } from '../customers.queries'
import {
  customerFormSchema,
  customerToForm,
  documentTypeOptions,
  emptyCustomerForm,
} from '../customers.schemas'
import type { Customer } from '../customers.schemas'

type CustomerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El cliente a editar; sin él, el diálogo registra uno nuevo. */
  customer?: Customer
}

/** Alta y edición de un cliente, en un diálogo sobre el listado. */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
          <DialogDescription>
            El teléfono es por donde se le avisa y se le envía el seguimiento.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores del
            cliente elegido, no con lo que quedó escrito la vez anterior. */}
        {open && (
          <CustomerForm
            customer={customer}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CustomerForm({
  customer,
  onDone,
}: {
  customer?: Customer
  onDone: () => void
}) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const mutation = customer ? update : create

  const form = useAppForm({
    defaultValues: customer ? customerToForm(customer) : emptyCustomerForm,
    validators: { onChange: customerFormSchema },
    // Si la API lo rechaza (documento repetido), el diálogo sigue abierto con
    // el mensaje de `mutation.error`. El error no se relanza: handleSubmit lo
    // devolvería como una promesa rechazada que nadie espera, y quedaría como
    // error sin capturar en la consola.
    onSubmit: ({ value }) =>
      (customer
        ? update.mutateAsync({ customerId: customer.customerId, values: value })
        : create.mutateAsync(value)
      ).then(onDone, () => undefined),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <form.AppField
            name="documentType"
            // El número se vuelve a validar cuando cambia el tipo: un DNI
            // válido deja de serlo si el tipo pasa a RUC.
            listeners={{
              onChange: () => {
                if (form.getFieldMeta('documentNumber')?.isTouched) {
                  void form.validateField('documentNumber', 'change')
                }
              },
            }}
          >
            {(field) => (
              <field.SelectField
                label="Tipo de documento"
                options={documentTypeOptions}
              />
            )}
          </form.AppField>
          <form.AppField name="documentNumber">
            {(field) => (
              <field.TextField label="Número de documento" autoFocus />
            )}
          </form.AppField>
        </div>
        <form.AppField name="name">
          {(field) => <field.TextField label="Nombre o razón social" />}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="phone">
            {(field) => (
              <field.TextField
                label="Teléfono"
                type="tel"
                placeholder="987654321"
              />
            )}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Correo (opcional)" type="email" />
            )}
          </form.AppField>
        </div>
        <form.AppField name="address">
          {(field) => <field.TextField label="Dirección (opcional)" />}
        </form.AppField>
        <form.AppField name="notes">
          {(field) => <field.TextareaField label="Notas (opcional)" rows={3} />}
        </form.AppField>
        <form.AppField name="isActive">
          {(field) => (
            <field.SwitchField
              label="Activo"
              description="Un cliente inactivo no se ofrece al crear órdenes."
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
            <form.SubmitButton
              label={customer ? 'Guardar cambios' : 'Registrar'}
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
