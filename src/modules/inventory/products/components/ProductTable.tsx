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
import { formatMoney } from '#/lib/money'
import { cn } from '#/lib/utils'
import type { Page } from '#/server/api'
import {
  PRODUCT_FILTERS_CLEARED,
  PRODUCT_KIND_LABELS,
  formatStock,
} from '../products.schemas'
import type { Product, ProductKind, ProductsSearch } from '../products.schemas'
import { DeleteProductDialog } from './DeleteProductDialog'
import { ProductFormDialog } from './ProductFormDialog'

const column = createColumns<Product>()

// En plural, como se lee en el filtro.
const KIND_OPTIONS = [
  { value: 'PART', label: 'Repuestos' },
  { value: 'SUPPLY', label: 'Insumos' },
] satisfies { value: ProductKind; label: string }[]

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

const STOCK_OPTIONS = [
  { value: 'true', label: 'Stock bajo' },
  { value: 'false', label: 'Stock suficiente' },
]

/** Un filtro de sí/no de la barra: `undefined` es «todos». */
const toBooleanFilter = (value: string | undefined) =>
  value === undefined ? undefined : value === 'true'

const fromBooleanFilter = (value: boolean | undefined) =>
  value === undefined ? undefined : String(value)

type RowActions = {
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

/**
 * Las columnas. El costo y el margen solo para quien puede verlos (el
 * administrador: la API ni siquiera se los manda al mecánico), y las acciones
 * solo para quien puede modificar.
 */
function productColumns(canManage: boolean, actions: RowActions | undefined) {
  return column.columns([
    column.accessor('code', {
      header: 'Código',
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ),
    }),
    column.accessor('name', {
      header: 'Producto',
      cell: (info) => (
        <div className="flex max-w-sm flex-col">
          <span className="font-medium">{info.getValue()}</span>
          {info.row.original.brand && (
            <span className="truncate text-xs text-muted-foreground">
              {info.row.original.brand}
            </span>
          )}
        </div>
      ),
    }),
    column.accessor('kind', {
      header: 'Tipo',
      enableSorting: false,
      cell: (info) => PRODUCT_KIND_LABELS[info.getValue()],
    }),
    column.accessor('stock', {
      header: 'Stock',
      cell: (info) => {
        const { unit, minStock, isLowStock } = info.row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="tabular-nums">
                {formatStock(info.getValue(), unit)}
              </span>
              {isLowStock && <Badge variant="destructive">Stock bajo</Badge>}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              Mín. {formatStock(minStock, unit)}
            </span>
          </div>
        )
      },
    }),
    ...(canManage
      ? [
          column.accessor('cost', {
            header: 'Costo',
            enableSorting: false,
            cell: (info) => (
              <span className="tabular-nums">
                {formatMoney(info.getValue())}
              </span>
            ),
          }),
        ]
      : []),
    column.accessor('price', {
      header: 'Precio',
      cell: (info) => (
        <span className="tabular-nums">{formatMoney(info.getValue())}</span>
      ),
    }),
    ...(canManage
      ? [
          column.accessor('margin', {
            header: 'Margen',
            enableSorting: false,
            cell: (info) => {
              const margin = info.getValue()
              return (
                <span
                  className={cn(
                    'tabular-nums',
                    // Se vende por debajo del costo: que salte a la vista.
                    margin?.startsWith('-') && 'text-destructive',
                  )}
                >
                  {formatMoney(margin)}
                </span>
              )
            },
          }),
        ]
      : []),
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

type ProductTableProps = {
  page: Page<Product>
  search: ProductsSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<ProductsSearch>) => void
  isFetching: boolean
  /**
   * Si quien mira puede registrar, editar y borrar, y ver costos y márgenes
   * (el administrador). El mecánico ve el listado en solo lectura.
   */
  canManage: boolean
}

/** Los repuestos e insumos con su búsqueda, filtros, alta, edición y borrado. */
export function ProductTable({
  page,
  search,
  onSearchChange,
  isFetching,
  canManage,
}: ProductTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product>()
  const [deleting, setDeleting] = useState<Product>()

  const columns = useMemo(
    () =>
      productColumns(
        canManage,
        canManage
          ? {
              onEdit: (product) => {
                setEditing(product)
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
  const filter = (changes: Partial<ProductsSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search ||
    search.kind !== undefined ||
    search.isActive !== undefined ||
    search.lowStock !== undefined,
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
            ? 'Ningún producto coincide con la búsqueda'
            : 'Todavía no hay repuestos ni insumos registrados'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as ProductsSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por código, nombre o marca"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(PRODUCT_FILTERS_CLEARED)}
            actions={
              canManage && (
                <Button
                  onClick={() => {
                    setEditing(undefined)
                    setFormOpen(true)
                  }}
                >
                  <PlusIcon />
                  Nuevo producto
                </Button>
              )
            }
          >
            <DataTableFilter
              label="Tipo"
              allLabel="Todos los tipos"
              options={KIND_OPTIONS}
              value={search.kind}
              onChange={(value) =>
                filter({ kind: value as ProductsSearch['kind'] })
              }
            />
            <DataTableFilter
              label="Estado"
              allLabel="Todos los estados"
              options={STATUS_OPTIONS}
              value={fromBooleanFilter(search.isActive)}
              onChange={(value) => filter({ isActive: toBooleanFilter(value) })}
            />
            <DataTableFilter
              label="Stock"
              allLabel="Todo el stock"
              options={STOCK_OPTIONS}
              value={fromBooleanFilter(search.lowStock)}
              onChange={(value) => filter({ lowStock: toBooleanFilter(value) })}
            />
          </DataTableToolbar>
        }
      />
      {canManage && (
        <>
          <ProductFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            product={editing}
          />
          <DeleteProductDialog
            product={deleting}
            onOpenChange={(open) => !open && setDeleting(undefined)}
          />
        </>
      )}
    </>
  )
}
