import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { UserRoundIcon } from 'lucide-react'
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
import { DOCUMENT_TYPE_LABELS } from '#/modules/customer/customers/customers.schemas'
import { vehiclesQueries } from '#/modules/customer/vehicles/vehicles.queries'
import { useCreateWorkOrder } from '../work-orders.queries'
import {
  createWorkOrderFormSchema,
  emptyCreateWorkOrderForm,
} from '../work-orders.schemas'

const vehicleOptions = (search: string) => vehiclesQueries.options(search)

// Solo se le asigna una orden a alguien activo.
const activeUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: true })

type CreateWorkOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Recibir un vehículo: el alta de la orden. Al crearla se abre su detalle,
 * que es donde se sigue trabajando.
 */
export function CreateWorkOrderDialog({
  open,
  onOpenChange,
}: CreateWorkOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva orden de trabajo</DialogTitle>
          <DialogDescription>
            La orden queda a nombre del dueño actual del vehículo y nace en
            «Recibido», con su código de seguimiento para el cliente.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza vacía, no con lo que
            quedó escrito la vez anterior. */}
        {open && <CreateWorkOrderForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateWorkOrderForm({ onDone }: { onDone: () => void }) {
  const create = useCreateWorkOrder()
  const navigate = useNavigate()

  const form = useAppForm({
    defaultValues: emptyCreateWorkOrderForm,
    validators: { onChange: createWorkOrderFormSchema },
    // Un rechazo de la API (el vehículo ya tiene una orden abierta, el dueño
    // está inactivo) deja el diálogo abierto con su mensaje y no se relanza:
    // quedaría como error sin capturar en la consola.
    onSubmit: ({ value }) =>
      create.mutateAsync(value).then(
        ({ workOrder }) => {
          onDone()
          void navigate({
            to: '/workshop/work-orders/$workOrderId',
            params: { workOrderId: workOrder.workOrderId },
          })
        },
        () => undefined,
      ),
  })

  // El vehículo elegido, con su dueño: es el cliente que queda en la orden.
  const vehicleId = useStore(form.store, (state) => state.values.vehicleId)
  const vehicle = useQuery({
    ...vehiclesQueries.detail(vehicleId),
    enabled: Boolean(vehicleId),
  }).data

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="vehicleId">
          {(field) => (
            <field.ComboboxField
              label="Vehículo"
              placeholder="Selecciona el vehículo"
              searchPlaceholder="Buscar por placa, marca, modelo o dueño"
              emptyMessage="Ningún vehículo coincide"
              optionsQuery={vehicleOptions}
            />
          )}
        </form.AppField>
        {vehicle && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <UserRoundIcon className="size-4 text-muted-foreground" />
            <span>
              Cliente de la orden: <strong>{vehicle.customer.name}</strong>{' '}
              <span className="text-muted-foreground">
                ({DOCUMENT_TYPE_LABELS[vehicle.customer.documentType]}{' '}
                {vehicle.customer.documentNumber})
              </span>
            </span>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="mileageIn">
            {(field) => (
              <field.TextField
                label="Kilometraje al ingreso"
                inputMode="numeric"
                placeholder="84500"
              />
            )}
          </form.AppField>
          <form.AppField name="promisedDate">
            {(field) => (
              <field.DateField
                label="Fecha prometida (opcional)"
                description="Cuándo se le dijo al cliente que estaría listo."
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="reason">
          {(field) => (
            <field.TextareaField
              label="Motivo del ingreso"
              placeholder="Lo que el cliente pide o reporta, con sus palabras"
              rows={3}
            />
          )}
        </form.AppField>
        <form.AppField name="mechanicId">
          {(field) => (
            <field.ComboboxField
              label="Mecánico (opcional)"
              placeholder="Sin asignar"
              searchPlaceholder="Buscar por nombre o correo"
              emptyMessage="Nadie activo coincide"
              clearLabel="Dejarla sin asignar"
              optionsQuery={activeUserOptions}
              description="Se puede asignar después, desde el detalle."
            />
          )}
        </form.AppField>
        {create.error && <FieldError>{create.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Registrar orden" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
