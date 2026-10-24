import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangleIcon, PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
import { DataTableComboboxFilter } from '#/components/data-table/DataTableComboboxFilter'
import { DataTableDateRangeFilter } from '#/components/data-table/DataTableDateRangeFilter'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { Button } from '#/components/ui/button'
import { formatDateOnly, formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { cn } from '#/lib/utils'
import { usersQueries } from '#/modules/core/users/users.queries'
import { userOption } from '#/modules/core/users/users.schemas'
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import { vehiclesQueries } from '#/modules/customer/vehicles/vehicles.queries'
import type { Page } from '#/server/api'
import {
  WORK_ORDER_FILTERS_CLEARED,
  formatWorkOrderNumber,
} from '../work-orders.schemas'
import type { WorkOrder, WorkOrdersSearch } from '../work-orders.schemas'
import { CreateWorkOrderDialog } from './CreateWorkOrderDialog'
import { OverdueBadge, WorkOrderStatusBadge } from './WorkOrderStatusBadge'
import { WorkOrderStatusFilter } from './WorkOrderStatusFilter'

const column = createColumns<WorkOrder>()

// El filtro ofrece a todo el personal, también al inactivo: sus órdenes
// siguen en el historial.
const allUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: false })

const muted = <span className="text-muted-foreground">—</span>

/**
 * Las columnas. El número lleva al detalle, que es donde se trabaja la orden:
 * el listado no tiene acciones por fila.
 */
const workOrderColumns = column.columns([
  column.accessor('number', {
    header: 'Orden',
    cell: (info) => (
      <div className="flex flex-col">
        <Link
          to="/workshop/work-orders/$workOrderId"
          params={{ workOrderId: info.row.original.workOrderId }}
          className="font-mono font-medium underline-offset-4 hover:underline"
        >
          {formatWorkOrderNumber(info.getValue())}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          {info.row.original.trackingCode}
        </span>
      </div>
    ),
  }),
  column.accessor('vehicle', {
    header: 'Vehículo',
    enableSorting: false,
    cell: (info) => {
      const vehicle = info.getValue()
      return (
        <div className="flex flex-col">
          <span className="font-mono font-medium">{vehicle.plate}</span>
          <span className="text-xs text-muted-foreground">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>
      )
    },
  }),
  column.accessor('customer', {
    header: 'Cliente',
    enableSorting: false,
    cell: (info) => {
      const customer = info.getValue()
      return (
        <div className="flex max-w-48 flex-col">
          <span className="truncate">{customer.name}</span>
          <span className="text-xs text-muted-foreground">
            {customer.phone}
          </span>
        </div>
      )
    },
  }),
  column.accessor('status', {
    header: 'Estado',
    enableSorting: false,
    cell: (info) => (
      <div className="flex flex-wrap items-center gap-1">
        <WorkOrderStatusBadge status={info.getValue()} />
        {info.row.original.isOverdue && <OverdueBadge />}
      </div>
    ),
  }),
  column.accessor('reason', {
    header: 'Motivo',
    enableSorting: false,
    cell: (info) => (
      // Las celdas no parten líneas: el motivo sí, hasta dos, para que uno
      // largo no ensanche la tabla.
      <span
        className="line-clamp-2 max-w-64 text-sm whitespace-normal"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor('mechanic', {
    header: 'Mecánico',
    enableSorting: false,
    cell: (info) =>
      info.getValue()?.name ?? (
        <span className="text-muted-foreground">Sin asignar</span>
      ),
  }),
  column.accessor('promisedDate', {
    header: 'Prometida',
    cell: (info) =>
      info.getValue() ? (
        <span
          className={cn(
            'whitespace-nowrap tabular-nums',
            info.row.original.isOverdue && 'font-medium text-destructive',
          )}
        >
          {formatDateOnly(info.getValue())}
        </span>
      ) : (
        muted
      ),
  }),
  column.accessor('receivedAt', {
    header: 'Ingreso',
    cell: (info) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatDateTime(info.getValue())}
      </span>
    ),
  }),
  // La API lo suma de los ítems de cada orden y no sabe ordenar por él.
  column.accessor('total', {
    header: 'Total',
    enableSorting: false,
    cell: (info) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatMoney(info.getValue())}
      </span>
    ),
  }),
])

type WorkOrderTableProps = {
  page: Page<WorkOrder>
  search: WorkOrdersSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<WorkOrdersSearch>) => void
  isFetching: boolean
  /**
   * Si quien mira es el administrador: registra órdenes y filtra por
   * mecánico. El mecánico ve solo las suyas (la API se lo impone).
   */
  canManage: boolean
}

/** Las órdenes con su búsqueda, filtros y el alta. */
export function WorkOrderTable({
  page,
  search,
  onSearchChange,
  isFetching,
  canManage,
}: WorkOrderTableProps) {
  const [creating, setCreating] = useState(false)

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<WorkOrdersSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  // El nombre del mecánico del filtro: la URL solo guarda el id. Se pide al
  // módulo de usuarios (la ruta ya lo precargó).
  const filterUser = useQuery({
    ...usersQueries.detail(search.mechanicId ?? ''),
    enabled: canManage && Boolean(search.mechanicId),
  })
  const mechanicFilterOption: ComboboxOption | undefined = search.mechanicId
    ? filterUser.data
      ? userOption(filterUser.data)
      : filterUser.isError
        ? { value: search.mechanicId, label: 'Usuario no encontrado' }
        : undefined
    : undefined

  const isFiltered = Boolean(
    search.search ||
    search.status ||
    search.mechanicId ||
    search.vehicleId ||
    search.customerId ||
    search.overdue ||
    search.from ||
    search.to,
  )

  return (
    <>
      <DataTable
        columns={workOrderColumns}
        data={page.items}
        meta={page.meta}
        isFetching={isFetching}
        emptyMessage={
          isFiltered
            ? 'Ninguna orden coincide con la búsqueda'
            : canManage
              ? 'Todavía no hay órdenes registradas'
              : 'No tienes órdenes asignadas'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as WorkOrdersSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Número, placa, cliente o código"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(WORK_ORDER_FILTERS_CLEARED)}
            actions={
              canManage && (
                <Button onClick={() => setCreating(true)}>
                  <PlusIcon />
                  Nueva orden
                </Button>
              )
            }
          >
            <WorkOrderStatusFilter
              value={search.status}
              onChange={(status) => filter({ status })}
            />
            {/* El personal solo lo lista el administrador (`/users`); el
                mecánico ya ve solo las suyas. */}
            {canManage && (
              <DataTableComboboxFilter
                label="Mecánico"
                allLabel="Todos los mecánicos"
                searchPlaceholder="Buscar por nombre o correo"
                value={search.mechanicId}
                selectedOption={mechanicFilterOption}
                optionsQuery={allUserOptions}
                onChange={(mechanicId) => filter({ mechanicId })}
              />
            )}
            <Button
              variant={search.overdue ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={Boolean(search.overdue)}
              onClick={() =>
                filter({ overdue: search.overdue ? undefined : true })
              }
            >
              <AlertTriangleIcon />
              Vencidas
            </Button>
            <DataTableDateRangeFilter
              label="Ingreso"
              from={search.from}
              to={search.to}
              onChange={(range) => filter(range)}
            />
            {search.vehicleId && (
              <VehicleChip
                vehicleId={search.vehicleId}
                canLoad={canManage}
                onClear={() => filter({ vehicleId: undefined })}
              />
            )}
            {search.customerId && (
              <CustomerChip
                customerId={search.customerId}
                canLoad={canManage}
                onClear={() => filter({ customerId: undefined })}
              />
            )}
          </DataTableToolbar>
        }
      />
      {canManage && (
        <CreateWorkOrderDialog open={creating} onOpenChange={setCreating} />
      )}
    </>
  )
}

/**
 * Un filtro que llegó por la URL desde otra pantalla («Ver órdenes» en
 * Vehículos o en Clientes), con una cruz para quitarlo. No es un combobox:
 * se llega a él desde el registro, no se elige aquí.
 */
function FilterChip({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClear}
      aria-label={`Quitar el filtro ${label}`}
    >
      {label}
      <XIcon />
    </Button>
  )
}

// Los vehículos y los clientes solo los lee el administrador: para otro rol,
// el filtro se muestra sin nombre.
function VehicleChip({
  vehicleId,
  canLoad,
  onClear,
}: {
  vehicleId: string
  canLoad: boolean
  onClear: () => void
}) {
  const vehicle = useQuery({
    ...vehiclesQueries.detail(vehicleId),
    enabled: canLoad,
  }).data
  return (
    <FilterChip
      label={`Vehículo: ${vehicle?.plate ?? 'el elegido'}`}
      onClear={onClear}
    />
  )
}

function CustomerChip({
  customerId,
  canLoad,
  onClear,
}: {
  customerId: string
  canLoad: boolean
  onClear: () => void
}) {
  const customer = useQuery({
    ...customersQueries.detail(customerId),
    enabled: canLoad,
  }).data
  return (
    <FilterChip
      label={`Cliente: ${customer?.name ?? 'el elegido'}`}
      onClear={onClear}
    />
  )
}
