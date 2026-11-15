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
  column.accessor('numero', {
    header: 'Orden',
    cell: (info) => (
      <div className="flex flex-col">
        <Link
          to="/workshop/work-orders/$workOrderId"
          params={{ workOrderId: info.row.original.ordenTrabajoId }}
          className="font-mono font-medium underline-offset-4 hover:underline"
        >
          {formatWorkOrderNumber(info.getValue())}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          {info.row.original.codigoSeguimiento}
        </span>
      </div>
    ),
  }),
  column.accessor('vehiculo', {
    header: 'Vehículo',
    enableSorting: false,
    cell: (info) => {
      const vehicle = info.getValue()
      return (
        <div className="flex flex-col">
          <span className="font-mono font-medium">{vehicle.placa}</span>
          <span className="text-xs text-muted-foreground">
            {vehicle.marca} {vehicle.modelo}
          </span>
        </div>
      )
    },
  }),
  column.accessor('cliente', {
    header: 'Cliente',
    enableSorting: false,
    cell: (info) => {
      const customer = info.getValue()
      return (
        <div className="flex max-w-48 flex-col">
          <span className="truncate">{customer.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {customer.telefono}
          </span>
        </div>
      )
    },
  }),
  column.accessor('estado', {
    header: 'Estado',
    enableSorting: false,
    cell: (info) => (
      <div className="flex flex-wrap items-center gap-1">
        <WorkOrderStatusBadge status={info.getValue()} />
        {info.row.original.vencida && <OverdueBadge />}
      </div>
    ),
  }),
  column.accessor('motivo', {
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
  column.accessor('mecanico', {
    header: 'Mecánico',
    enableSorting: false,
    cell: (info) =>
      info.getValue()?.nombre ?? (
        <span className="text-muted-foreground">Sin asignar</span>
      ),
  }),
  column.accessor('fechaPrometida', {
    header: 'Prometida',
    cell: (info) =>
      info.getValue() ? (
        <span
          className={cn(
            'whitespace-nowrap tabular-nums',
            info.row.original.vencida && 'font-medium text-destructive',
          )}
        >
          {formatDateOnly(info.getValue())}
        </span>
      ) : (
        muted
      ),
  }),
  column.accessor('recibidaEn', {
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
    ...usersQueries.detail(search.mecanicoId ?? ''),
    enabled: canManage && Boolean(search.mecanicoId),
  })
  const mechanicFilterOption: ComboboxOption | undefined = search.mecanicoId
    ? filterUser.data
      ? userOption(filterUser.data)
      : filterUser.isError
        ? { value: search.mecanicoId, label: 'Usuario no encontrado' }
        : undefined
    : undefined

  const isFiltered = Boolean(
    search.search ||
    search.estado ||
    search.mecanicoId ||
    search.vehiculoId ||
    search.clienteId ||
    search.vencidas ||
    search.desde ||
    search.hasta,
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
        sort={{ ordenarPor: search.ordenarPor, sentido: search.sentido }}
        onSortChange={(sort) =>
          onSearchChange({
            ordenarPor: sort.ordenarPor as WorkOrdersSearch['ordenarPor'],
            sentido: sort.sentido,
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
              value={search.estado}
              onChange={(estado) => filter({ estado })}
            />
            {/* El personal solo lo lista el administrador (`/users`); el
                mecánico ya ve solo las suyas. */}
            {canManage && (
              <DataTableComboboxFilter
                label="Mecánico"
                allLabel="Todos los mecánicos"
                searchPlaceholder="Buscar por nombre o correo"
                value={search.mecanicoId}
                selectedOption={mechanicFilterOption}
                optionsQuery={allUserOptions}
                onChange={(mecanicoId) => filter({ mecanicoId })}
              />
            )}
            <Button
              variant={search.vencidas ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={Boolean(search.vencidas)}
              onClick={() =>
                filter({ vencidas: search.vencidas ? undefined : true })
              }
            >
              <AlertTriangleIcon />
              Vencidas
            </Button>
            <DataTableDateRangeFilter
              label="Ingreso"
              from={search.desde}
              to={search.hasta}
              onChange={({ from, to }) => filter({ desde: from, hasta: to })}
            />
            {search.vehiculoId && (
              <VehicleChip
                vehiculoId={search.vehiculoId}
                canLoad={canManage}
                onClear={() => filter({ vehiculoId: undefined })}
              />
            )}
            {search.clienteId && (
              <CustomerChip
                clienteId={search.clienteId}
                canLoad={canManage}
                onClear={() => filter({ clienteId: undefined })}
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
  vehiculoId,
  canLoad,
  onClear,
}: {
  vehiculoId: string
  canLoad: boolean
  onClear: () => void
}) {
  const vehicle = useQuery({
    ...vehiclesQueries.detail(vehiculoId),
    enabled: canLoad,
  }).data
  return (
    <FilterChip
      label={`Vehículo: ${vehicle?.placa ?? 'el elegido'}`}
      onClear={onClear}
    />
  )
}

function CustomerChip({
  clienteId,
  canLoad,
  onClear,
}: {
  clienteId: string
  canLoad: boolean
  onClear: () => void
}) {
  const customer = useQuery({
    ...customersQueries.detail(clienteId),
    enabled: canLoad,
  }).data
  return (
    <FilterChip
      label={`Cliente: ${customer?.nombre ?? 'el elegido'}`}
      onClear={onClear}
    />
  )
}
