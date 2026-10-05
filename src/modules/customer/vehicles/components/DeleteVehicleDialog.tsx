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
import { useDeleteVehicle } from '../vehicles.queries'
import type { Vehicle } from '../vehicles.schemas'

/**
 * Confirma el borrado de un vehículo. El borrado es real: si el vehículo tiene
 * órdenes de trabajo, la API lo impide y aquí se muestra por qué.
 */
export function DeleteVehicleDialog({
  vehicle,
  onOpenChange,
}: {
  /** El vehículo a borrar; sin él, el diálogo está cerrado. */
  vehicle: Vehicle | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteVehicle()

  return (
    <Dialog
      open={Boolean(vehicle)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar vehículo</DialogTitle>
          <DialogDescription>
            Se eliminará el vehículo de placa{' '}
            <strong className="font-mono">{vehicle?.plate}</strong> (
            {vehicle?.brand} {vehicle?.model}) de forma definitiva. Esta acción
            no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!vehicle || remove.isPending}
            onClick={() => {
              if (!vehicle) return
              remove.mutate(vehicle.vehicleId, {
                onSuccess: () => onOpenChange(false),
              })
            }}
          >
            {remove.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
