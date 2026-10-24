import { Link } from '@tanstack/react-router'
import { CarIcon, ChevronRightIcon } from 'lucide-react'
import { Card, CardContent } from '#/components/ui/card'
import { defaultPortalWorkOrdersSearch } from '../portal.schemas'
import type { PortalVehicle } from '../portal.schemas'

/** Los vehículos del cliente; cada uno lleva a sus reparaciones. */
export function PortalVehicleList({
  vehicles,
  isSearching,
}: {
  vehicles: PortalVehicle[]
  /** Si la lista vacía es por la búsqueda y no porque no tenga vehículos. */
  isSearching: boolean
}) {
  if (!vehicles.length) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {isSearching
          ? 'Ningún vehículo coincide con la búsqueda.'
          : 'Todavía no tienes vehículos registrados en el taller.'}
      </p>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {vehicles.map((vehicle) => (
        <Link
          key={vehicle.vehicleId}
          to="/portal/work-orders"
          search={{
            ...defaultPortalWorkOrdersSearch,
            vehicleId: vehicle.vehicleId,
          }}
          className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <CarIcon className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">
                  {vehicle.brand} {vehicle.model}
                  {vehicle.year ? ` ${vehicle.year}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  {vehicle.plate}
                  {vehicle.color ? ` · ${vehicle.color}` : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {vehicle.workOrdersCount === 1
                    ? '1 reparación registrada'
                    : `${vehicle.workOrdersCount} reparaciones registradas`}
                </span>
              </div>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
