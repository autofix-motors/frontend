import { useState } from 'react'
import { toast } from 'sonner'
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'
import { useIssuePortalAccess } from '#/modules/core/customer-accounts/customer-accounts.queries'
import type { PortalCredentials } from '#/modules/core/customer-accounts/customer-accounts.schemas'
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
  /** Si al registrarlo se le dio acceso al portal: su contraseña temporal. */
  onPortalAccessIssued: (
    customer: Customer,
    credentials: PortalCredentials,
  ) => void
}

/** Alta y edición de un cliente, en un diálogo sobre el listado. */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onPortalAccessIssued,
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
            onPortalAccessIssued={onPortalAccessIssued}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CustomerForm({
  customer,
  onDone,
  onPortalAccessIssued,
}: {
  customer?: Customer
  onDone: () => void
  onPortalAccessIssued: CustomerFormDialogProps['onPortalAccessIssued']
}) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const issueAccess = useIssuePortalAccess()
  const mutation = customer ? update : create
  // Solo al registrar: el acceso de uno existente se maneja desde su menú.
  // No es un campo del cliente (no viaja en su alta): es un segundo paso.
  const [withPortalAccess, setWithPortalAccess] = useState(false)

  /**
   * Registra y, si se pidió, le da acceso al portal. Si el acceso falla, el
   * cliente ya quedó registrado: el diálogo se cierra igual y el aviso dice
   * que se reintente desde su menú.
   */
  const register = async (values: Parameters<typeof create.mutateAsync>[0]) => {
    const { customer: created } = await create.mutateAsync(values)
    if (!withPortalAccess) return
    await issueAccess.mutateAsync(created.customerId).then(
      ({ credentials }) => onPortalAccessIssued(created, credentials),
      (error: Error) =>
        toast.error(
          `El cliente quedó registrado, pero no se pudo darle acceso al portal: ${error.message}. Inténtalo desde su menú.`,
        ),
    )
  }

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
        : register(value)
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
        {!customer && (
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="with-portal-access">
                Dar acceso al portal
              </FieldLabel>
              <FieldDescription>
                Se le genera una contraseña temporal para enviarle por WhatsApp.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="with-portal-access"
              checked={withPortalAccess}
              onCheckedChange={setWithPortalAccess}
            />
          </Field>
        )}
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
