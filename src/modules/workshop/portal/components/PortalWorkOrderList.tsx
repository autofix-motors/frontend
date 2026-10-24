import { XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { cn } from '#/lib/utils'
import type { Page } from '#/server/api'
import { PORTAL_TABS } from '../portal.schemas'
import type {
  PortalVehicle,
  PortalWorkOrder,
  PortalWorkOrdersSearch,
  PortalWorkOrderState,
} from '../portal.schemas'
import { PortalPager } from './PortalPager'
import { PortalWorkOrderCard } from './PortalWorkOrderCard'

const EMPTY: Record<PortalWorkOrderState, string> = {
  OPEN: 'No tienes vehículos en el taller ahora mismo.',
  CLOSED: 'Todavía no hay reparaciones anteriores.',
}

/**
 * Las órdenes del cliente: pestañas «En curso» y «Anteriores», el filtro por
 * vehículo (si llegó desde «Mis vehículos») y la paginación.
 */
export function PortalWorkOrderList({
  page,
  search,
  vehicle,
  onSearchChange,
  isFetching,
}: {
  page: Page<PortalWorkOrder>
  search: PortalWorkOrdersSearch
  /** El vehículo del filtro, para mostrar su placa. */
  vehicle?: PortalVehicle
  onSearchChange: (changes: Partial<PortalWorkOrdersSearch>) => void
  isFetching: boolean
}) {
  const { meta } = page

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={search.state}
          onValueChange={(value) =>
            onSearchChange({ state: value as PortalWorkOrderState, page: 1 })
          }
        >
          <TabsList>
            {PORTAL_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {search.vehicleId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearchChange({ vehicleId: undefined, page: 1 })}
          >
            Vehículo {vehicle?.plate ?? 'elegido'}
            <XIcon />
          </Button>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 transition-opacity',
          isFetching && 'opacity-60',
        )}
      >
        {page.items.length ? (
          page.items.map((order) => (
            <PortalWorkOrderCard key={order.workOrderId} order={order} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {EMPTY[search.state]}
          </p>
        )}
      </div>

      <PortalPager
        meta={meta}
        onPageChange={(page) => onSearchChange({ page })}
      />
    </div>
  )
}
