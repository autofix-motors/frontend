import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ClipboardListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
import { DataTableComboboxFilter } from '#/components/data-table/DataTableComboboxFilter'
import { DataTableFilter } from '#/components/data-table/DataTableFilter'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { formatDateTime } from '#/lib/dates'
import { customersQueries } from '#/modules/customer/customers/customers.queries'
import {
  DOCUMENT_TYPE_LABELS,
  customerOption,
} from '#/modules/customer/customers/customers.schemas'
import { defaultWorkOrdersSearch } from '#/modules/workshop/work-orders/work-orders.schemas'
import type { Page } from '#/server/api'
import { vehiclesQueries } from '../vehicles.queries'
import { VEHICLE_FILTERS_CLEARED } from '../vehicles.schemas'
import type { Vehicle, VehiclesSearch } from '../vehicles.schemas'
import { DeleteVehicleDialog } from './DeleteVehicleDialog'
import { VehicleFormDialog } from './VehicleFormDialog'

const column = createColumns<Vehicle>()

// El filtro ofrece todos los clientes, también los inactivos: sus vehículos
// siguen registrados.
const allCustomerOptions = (search: string) =>
  customersQueries.options({ search, onlyActive: false })

const muted = <span className="text-muted-foreground">—</span>

type RowActions = {
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

function vehicleColumns({ onEdit, onDelete }: RowActions) {
  return column.columns([
    column.accessor('placa', {
      header: 'Placa',
      cell: (info) => (
        <span className="font-mono font-medium">{info.getValue()}</span>
      ),
    }),
    column.accessor('marca', {
      header: 'Vehículo',
      cell: (info) => {
        const { modelo, anio, color } = info.row.original
        return (
          <div className="flex flex-col">
            <span>
              {info.getValue()} {modelo}
            </span>
            <span className="text-xs text-muted-foreground">
              {[anio, color].filter(Boolean).join(' · ') || '—'}
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
          <div className="flex flex-col">
            <span className="font-medium">{customer.nombre}</span>
            <span className="text-xs text-muted-foreground">
              {DOCUMENT_TYPE_LABELS[customer.tipoDocumento]}{' '}
              {customer.numeroDocumento}
            </span>
          </div>
        )
      },
    }),
    column.accessor('vin', {
      header: 'VIN',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ) : (
          muted
        ),
    }),
    column.accessor('cantidadOrdenes', {
      header: 'Órdenes',
      enableSorting: false,
      // Lleva al listado de órdenes filtrado por este vehículo.
      cell: (info) => (
        <Link
          to="/workshop/work-orders"
          search={{
            ...defaultWorkOrdersSearch,
            vehiculoId: info.row.original.vehiculoId,
          }}
          className="underline-offset-4 hover:underline"
          aria-label={`Ver las órdenes de ${info.row.original.placa}`}
        >
          {info.getValue()}
        </Link>
      ),
    }),
    column.accessor('creadoEn', {
      header: 'Registrado',
      cell: (info) => formatDateTime(info.getValue()),
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: (info) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Acciones">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to="/workshop/work-orders"
                search={{
                  ...defaultWorkOrdersSearch,
                  vehiculoId: info.row.original.vehiculoId,
                }}
              >
                <ClipboardListIcon />
                Ver órdenes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onEdit(info.row.original)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(info.row.original)}
            >
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

type VehicleTableProps = {
  page: Page<Vehicle>
  search: VehiclesSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<VehiclesSearch>) => void
  isFetching: boolean
}

/** El listado de vehículos con su búsqueda, filtros, alta, edición y borrado. */
export function VehicleTable({
  page,
  search,
  onSearchChange,
  isFetching,
}: VehicleTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle>()
  const [deleting, setDeleting] = useState<Vehicle>()

  const columns = useMemo(
    () =>
      vehicleColumns({
        onEdit: (vehicle) => {
          setEditing(vehicle)
          setFormOpen(true)
        },
        onDelete: setDeleting,
      }),
    [],
  )

  const brands = useQuery(vehiclesQueries.brands())
  const brandOptions = (brands.data ?? []).map(
    ({ marca, cantidadVehiculos }) => ({
      value: marca,
      label: `${marca} (${cantidadVehiculos})`,
    }),
  )
  // La marca de la URL puede venir con otras mayúsculas («toyota»): se elige
  // la opción que le corresponde, que es como la compara la API.
  const brandValue =
    search.marca &&
    (brandOptions.find(
      (option) => option.value.toLowerCase() === search.marca?.toLowerCase(),
    )?.value ??
      search.marca)

  // El nombre del cliente del filtro sale de la API: la URL solo trae su id
  // (por ejemplo, al llegar desde el listado de clientes).
  const filterCustomer = useQuery({
    ...customersQueries.detail(search.clienteId ?? ''),
    enabled: Boolean(search.clienteId),
  })
  const customerFilterOption: ComboboxOption | undefined = search.clienteId
    ? filterCustomer.data
      ? customerOption(filterCustomer.data)
      : filterCustomer.isError
        ? { value: search.clienteId, label: 'Cliente no encontrado' }
        : undefined
    : undefined

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<VehiclesSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(search.search || search.clienteId || search.marca)

  return (
    <>
      <DataTable
        columns={columns}
        data={page.items}
        meta={page.meta}
        isFetching={isFetching}
        emptyMessage={
          isFiltered
            ? 'Ningún vehículo coincide con la búsqueda'
            : 'Todavía no hay vehículos registrados'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ ordenarPor: search.ordenarPor, sentido: search.sentido }}
        onSortChange={(sort) =>
          onSearchChange({
            ordenarPor: sort.ordenarPor as VehiclesSearch['ordenarPor'],
            sentido: sort.sentido,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por placa, marca, modelo o cliente"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(VEHICLE_FILTERS_CLEARED)}
            actions={
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <PlusIcon />
                Nuevo vehículo
              </Button>
            }
          >
            <DataTableComboboxFilter
              label="Cliente"
              allLabel="Todos los clientes"
              searchPlaceholder="Buscar por nombre o documento"
              value={search.clienteId}
              selectedOption={customerFilterOption}
              optionsQuery={allCustomerOptions}
              onChange={(clienteId) => filter({ clienteId })}
            />
            <DataTableFilter
              label="Marca"
              allLabel="Todas las marcas"
              options={brandOptions}
              value={brandValue}
              onChange={(marca) => filter({ marca })}
            />
          </DataTableToolbar>
        }
      />
      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editing}
      />
      <DeleteVehicleDialog
        vehicle={deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      />
    </>
  )
}
