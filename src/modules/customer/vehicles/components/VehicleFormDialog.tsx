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
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import { customerOption } from '#/modules/customer/customers/customers.schemas'
import { useCreateVehicle, useUpdateVehicle } from '../vehicles.queries'
import {
  emptyVehicleForm,
  vehicleFormSchema,
  vehicleToForm,
} from '../vehicles.schemas'
import type { Vehicle } from '../vehicles.schemas'

// Al asignar un vehículo solo se ofrecen los clientes activos: la API rechaza
// a los inactivos.
const activeCustomerOptions = (search: string) =>
  customersQueries.options({ search, onlyActive: true })

type VehicleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El vehículo a editar; sin él, el diálogo registra uno nuevo. */
  vehicle?: Vehicle
}

/** Alta y edición de un vehículo, en un diálogo sobre el listado. */
export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Editar vehículo' : 'Nuevo vehículo'}
          </DialogTitle>
          <DialogDescription>
            La placa se guarda en mayúsculas y sin guion (ABC123).
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores del
            vehículo elegido, no con lo que quedó escrito la vez anterior. */}
        {open && (
          <VehicleForm vehicle={vehicle} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function VehicleForm({
  vehicle,
  onDone,
}: {
  vehicle?: Vehicle
  onDone: () => void
}) {
  const create = useCreateVehicle()
  const update = useUpdateVehicle()
  const mutation = vehicle ? update : create

  const form = useAppForm({
    defaultValues: vehicle ? vehicleToForm(vehicle) : emptyVehicleForm,
    validators: { onChange: vehicleFormSchema },
    onSubmit: async ({ value }) => {
      if (vehicle) {
        await update.mutateAsync({
          vehicleId: vehicle.vehicleId,
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
        <form.AppField name="customerId">
          {(field) => (
            <field.ComboboxField
              label="Cliente"
              placeholder="Selecciona el cliente"
              searchPlaceholder="Buscar por nombre o documento"
              emptyMessage="Ningún cliente activo coincide"
              optionsQuery={activeCustomerOptions}
              // Al editar, el dueño actual se muestra aunque no salga en la
              // primera página de resultados (o esté inactivo).
              selectedOption={vehicle && customerOption(vehicle.customer)}
            />
          )}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-3">
          <form.AppField name="plate">
            {(field) => (
              <field.TextField
                label="Placa"
                placeholder="ABC-123"
                className="font-mono uppercase"
              />
            )}
          </form.AppField>
          <form.AppField name="brand">
            {(field) => <field.TextField label="Marca" placeholder="Toyota" />}
          </form.AppField>
          <form.AppField name="model">
            {(field) => <field.TextField label="Modelo" placeholder="Yaris" />}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <form.AppField name="year">
            {(field) => (
              <field.TextField
                label="Año (opcional)"
                inputMode="numeric"
                placeholder="2019"
              />
            )}
          </form.AppField>
          <form.AppField name="color">
            {(field) => <field.TextField label="Color (opcional)" />}
          </form.AppField>
          <form.AppField name="vin">
            {(field) => (
              <field.TextField
                label="VIN (opcional)"
                className="font-mono uppercase"
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="notes">
          {(field) => <field.TextareaField label="Notas (opcional)" rows={3} />}
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
              label={vehicle ? 'Guardar cambios' : 'Registrar'}
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
