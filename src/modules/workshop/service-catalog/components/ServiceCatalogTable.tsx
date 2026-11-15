import {
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
import { formatMoney } from '#/lib/money'
import type { Page } from '#/server/api'
import { SERVICE_CATALOG_FILTERS_CLEARED } from '../service-catalog.schemas'
import type {
  ServiceCatalogItem,
  ServiceCatalogSearch,
} from '../service-catalog.schemas'
import { DeleteServiceCatalogItemDialog } from './DeleteServiceCatalogItemDialog'
import { PriceRangeFilter } from './PriceRangeFilter'
import { ServiceCatalogItemFormDialog } from './ServiceCatalogItemFormDialog'

const column = createColumns<ServiceCatalogItem>()

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

type RowActions = {
  onEdit: (item: ServiceCatalogItem) => void
  onDelete: (item: ServiceCatalogItem) => void
}

/** Las columnas; las acciones solo si quien mira puede modificar el catálogo. */
function serviceCatalogColumns(actions: RowActions | undefined) {
  return column.columns([
    column.accessor('nombre', {
      header: 'Servicio',
      cell: (info) => (
        <div className="flex max-w-md flex-col">
          <span className="font-medium">{info.getValue()}</span>
          {info.row.original.descripcion && (
            <span className="truncate text-xs text-muted-foreground">
              {info.row.original.descripcion}
            </span>
          )}
        </div>
      ),
    }),
    column.accessor('precioManoObra', {
      header: 'Mano de obra',
      cell: (info) => (
        <span className="tabular-nums">{formatMoney(info.getValue())}</span>
      ),
    }),
    column.accessor('activo', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <Badge variant="secondary">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    }),
    column.accessor('creadoEn', {
      header: 'Registrado',
      cell: (info) => formatDateTime(info.getValue()),
    }),
    ...(actions ? [actionsColumn(actions)] : []),
  ])
}

function actionsColumn(actions: RowActions) {
  return column.display({
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
          <DropdownMenuItem onSelect={() => actions.onEdit(info.row.original)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => actions.onDelete(info.row.original)}
          >
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  })
}

type ServiceCatalogTableProps = {
  page: Page<ServiceCatalogItem>
  search: ServiceCatalogSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<ServiceCatalogSearch>) => void
  isFetching: boolean
  /**
   * Si quien mira puede registrar, editar y borrar (el administrador). El
   * mecánico ve el catálogo en solo lectura: la API le rechazaría los cambios.
   */
  canManage: boolean
}

/** El catálogo de servicios con su búsqueda, filtros, alta, edición y borrado. */
export function ServiceCatalogTable({
  page,
  search,
  onSearchChange,
  isFetching,
  canManage,
}: ServiceCatalogTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceCatalogItem>()
  const [deleting, setDeleting] = useState<ServiceCatalogItem>()

  const columns = useMemo(
    () =>
      serviceCatalogColumns(
        canManage
          ? {
              onEdit: (item) => {
                setEditing(item)
                setFormOpen(true)
              },
              onDelete: setDeleting,
            }
          : undefined,
      ),
    [canManage],
  )

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<ServiceCatalogSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search ||
    search.activo !== undefined ||
    search.precioMinimo !== undefined ||
    search.precioMaximo !== undefined,
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
            ? 'Ningún servicio coincide con la búsqueda'
            : 'Todavía no hay servicios en el catálogo'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ ordenarPor: search.ordenarPor, sentido: search.sentido }}
        onSortChange={(sort) =>
          onSearchChange({
            ordenarPor: sort.ordenarPor as ServiceCatalogSearch['ordenarPor'],
            sentido: sort.sentido,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por nombre o descripción"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(SERVICE_CATALOG_FILTERS_CLEARED)}
            actions={
              canManage && (
                <Button
                  onClick={() => {
                    setEditing(undefined)
                    setFormOpen(true)
                  }}
                >
                  <PlusIcon />
                  Nuevo servicio
                </Button>
              )
            }
          >
            <DataTableFilter
              label="Estado"
              allLabel="Todos los estados"
              options={STATUS_OPTIONS}
              value={
                search.activo === undefined ? undefined : String(search.activo)
              }
              onChange={(value) =>
                filter({
                  activo: value === undefined ? undefined : value === 'true',
                })
              }
            />
            <PriceRangeFilter
              precioMinimo={search.precioMinimo}
              precioMaximo={search.precioMaximo}
              onChange={filter}
            />
          </DataTableToolbar>
        }
      />
      {canManage && (
        <>
          <ServiceCatalogItemFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            item={editing}
          />
          <DeleteServiceCatalogItemDialog
            item={deleting}
            onOpenChange={(open) => !open && setDeleting(undefined)}
          />
        </>
      )}
    </>
  )
}
