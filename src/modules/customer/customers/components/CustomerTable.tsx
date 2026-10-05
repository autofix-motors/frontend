import { Link } from '@tanstack/react-router'
import {
  ClipboardListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
import { DataTableFilter } from '#/components/data-table/DataTableFilter'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { formatDateTime } from '#/lib/dates'
import { defaultVehiclesSearch } from '#/modules/customer/vehicles/vehicles.schemas'
import { defaultWorkOrdersSearch } from '#/modules/workshop/work-orders/work-orders.schemas'
import type { Page } from '#/server/api'
import {
  CUSTOMER_FILTERS_CLEARED,
  DOCUMENT_TYPE_LABELS,
  documentTypeOptions,
} from '../customers.schemas'
import type { Customer, CustomersSearch } from '../customers.schemas'
import { CustomerFormDialog } from './CustomerFormDialog'
import { DeleteCustomerDialog } from './DeleteCustomerDialog'

const column = createColumns<Customer>()

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

type RowActions = {
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

function customerColumns({ onEdit, onDelete }: RowActions) {
  return column.columns([
    column.accessor('documentNumber', {
      header: 'Documento',
      enableSorting: false,
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm">{info.getValue()}</span>
          <span className="text-xs text-muted-foreground">
            {DOCUMENT_TYPE_LABELS[info.row.original.documentType]}
          </span>
        </div>
      ),
    }),
    column.accessor('name', {
      header: 'Nombre',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    column.accessor('phone', { header: 'Teléfono', enableSorting: false }),
    column.accessor('email', {
      header: 'Correo',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    column.accessor('vehiclesCount', {
      header: 'Vehículos',
      enableSorting: false,
      // Lleva al listado de vehículos filtrado por este cliente.
      cell: (info) => (
        <Link
          to="/customer/vehicles"
          search={{
            ...defaultVehiclesSearch,
            customerId: info.row.original.customerId,
          }}
          className="underline-offset-4 hover:underline"
          aria-label={`Ver los vehículos de ${info.row.original.name}`}
        >
          {info.getValue()}
        </Link>
      ),
    }),
    column.accessor('isActive', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <Badge variant="secondary">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    }),
    column.accessor('createdAt', {
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
            {/* Las órdenes que trajo, de todos sus vehículos. */}
            <DropdownMenuItem asChild>
              <Link
                to="/workshop/work-orders"
                search={{
                  ...defaultWorkOrdersSearch,
                  customerId: info.row.original.customerId,
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

type CustomerTableProps = {
  page: Page<Customer>
  search: CustomersSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<CustomersSearch>) => void
  isFetching: boolean
}

/** El listado de clientes con su búsqueda, filtros, alta, edición y borrado. */
export function CustomerTable({
  page,
  search,
  onSearchChange,
  isFetching,
}: CustomerTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer>()
  const [deleting, setDeleting] = useState<Customer>()

  const columns = useMemo(
    () =>
      customerColumns({
        onEdit: (customer) => {
          setEditing(customer)
          setFormOpen(true)
        },
        onDelete: setDeleting,
      }),
    [],
  )

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<CustomersSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search || search.documentType || search.isActive !== undefined,
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={page.items}
        meta={page.meta}
        isFetching={isFetching}
        emptyMessage={
          isFiltered
            ? 'Ningún cliente coincide con la búsqueda'
            : 'Todavía no hay clientes registrados'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as CustomersSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por nombre o documento"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(CUSTOMER_FILTERS_CLEARED)}
            actions={
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <PlusIcon />
                Nuevo cliente
              </Button>
            }
          >
            <DataTableFilter
              label="Tipo de documento"
              allLabel="Todos los documentos"
              options={documentTypeOptions}
              value={search.documentType}
              onChange={(value) =>
                filter({
                  documentType: value as CustomersSearch['documentType'],
                })
              }
            />
            <DataTableFilter
              label="Estado"
              allLabel="Todos los estados"
              options={STATUS_OPTIONS}
              value={
                search.isActive === undefined
                  ? undefined
                  : String(search.isActive)
              }
              onChange={(value) =>
                filter({
                  isActive: value === undefined ? undefined : value === 'true',
                })
              }
            />
          </DataTableToolbar>
        }
      />
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
      />
      <DeleteCustomerDialog
        customer={deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      />
    </>
  )
}
