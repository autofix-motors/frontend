import { useQuery } from '@tanstack/react-query'
import { PackageMinusIcon, PackagePlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
import { DataTableComboboxFilter } from '#/components/data-table/DataTableComboboxFilter'
import { DataTableDateRangeFilter } from '#/components/data-table/DataTableDateRangeFilter'
import { DataTableFilter } from '#/components/data-table/DataTableFilter'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { cn } from '#/lib/utils'
import { productsQueries } from '#/modules/inventory/products/products.queries'
import { productOption } from '#/modules/inventory/products/products.schemas'
import type { Page } from '#/server/api'
import {
  STOCK_MOVEMENT_FILTERS_CLEARED,
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_TYPE_LABELS,
  formatMovementQuantity,
} from '../stock-movements.schemas'
import type {
  StockMovement,
  StockMovementType,
  StockMovementsSearch,
} from '../stock-movements.schemas'
import { AdjustmentDialog } from './AdjustmentDialog'
import { PurchaseDialog } from './PurchaseDialog'

const column = createColumns<StockMovement>()

// El filtro ofrece todos los productos, también los inactivos: su kardex
// sigue ahí.
const allProductOptions = (search: string) =>
  productsQueries.options({ search, onlyActive: false })

const TYPE_OPTIONS = STOCK_MOVEMENT_TYPES.map((value) => ({
  value,
  label: STOCK_MOVEMENT_TYPE_LABELS[value],
}))

const TYPE_BADGES: Record<StockMovementType, 'secondary' | 'outline'> = {
  PURCHASE: 'secondary',
  WORK_ORDER: 'outline',
  ADJUSTMENT: 'outline',
}

const muted = <span className="text-muted-foreground">—</span>

/**
 * Las columnas. El costo unitario solo para el administrador: la API ni
 * siquiera se lo manda al mecánico. No hay acciones por fila: un movimiento
 * no se edita ni se borra.
 */
function stockMovementColumns(canManage: boolean) {
  return column.columns([
    column.accessor('createdAt', {
      header: 'Fecha',
      cell: (info) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    column.accessor('product', {
      header: 'Producto',
      enableSorting: false,
      cell: (info) => {
        const product = info.getValue()
        return (
          <div className="flex max-w-xs flex-col">
            <span className="truncate font-medium">{product.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {product.code}
            </span>
          </div>
        )
      },
    }),
    column.accessor('type', {
      header: 'Tipo',
      enableSorting: false,
      cell: (info) => (
        <Badge variant={TYPE_BADGES[info.getValue()]}>
          {STOCK_MOVEMENT_TYPE_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    column.accessor('quantity', {
      header: 'Cantidad',
      cell: (info) => {
        const quantity = info.getValue()
        return (
          <span
            className={cn(
              'font-medium whitespace-nowrap tabular-nums',
              // Entrada en verde y salida en rojo, que se lea de un vistazo.
              quantity.startsWith('-')
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {formatMovementQuantity(quantity, info.row.original.product.unit)}
          </span>
        )
      },
    }),
    ...(canManage
      ? [
          column.accessor('unitCost', {
            header: 'Costo unit.',
            enableSorting: false,
            cell: (info) => (
              <span className="tabular-nums">
                {info.getValue() ? formatMoney(info.getValue()) : muted}
              </span>
            ),
          }),
        ]
      : []),
    column.accessor('note', {
      header: 'Nota',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          // Las celdas no parten líneas: la nota sí, hasta dos, para que una
          // nota larga (proveedor y factura) no ensanche la tabla.
          <span
            className="line-clamp-2 max-w-64 text-sm whitespace-normal"
            title={info.getValue() ?? undefined}
          >
            {info.getValue()}
          </span>
        ) : (
          muted
        ),
    }),
    column.accessor('createdBy', {
      header: 'Registró',
      enableSorting: false,
      cell: (info) => info.getValue().name,
    }),
  ])
}

type StockMovementTableProps = {
  page: Page<StockMovement>
  search: StockMovementsSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<StockMovementsSearch>) => void
  isFetching: boolean
  /**
   * Si quien mira puede registrar compras y ajustes, y ver costos (el
   * administrador). El mecánico ve el kardex en solo lectura.
   */
  canManage: boolean
}

/** El kardex con su búsqueda, filtros y el registro de compras y ajustes. */
export function StockMovementTable({
  page,
  search,
  onSearchChange,
  isFetching,
  canManage,
}: StockMovementTableProps) {
  const [dialog, setDialog] = useState<'purchase' | 'adjustment'>()

  const columns = useMemo(() => stockMovementColumns(canManage), [canManage])

  // El producto del filtro sale de la API: la URL solo trae su id (por
  // ejemplo, al llegar desde «Ver movimientos» en Repuestos). Con él también
  // se proponen los registros.
  const filterProduct = useQuery({
    ...productsQueries.detail(search.productId ?? ''),
    enabled: Boolean(search.productId),
  })
  const productFilterOption: ComboboxOption | undefined = search.productId
    ? filterProduct.data
      ? productOption(filterProduct.data)
      : filterProduct.isError
        ? { value: search.productId, label: 'Producto no encontrado' }
        : undefined
    : undefined
  // Solo se propone un producto activo: la API no registra movimientos de
  // los inactivos.
  const proposedProduct = filterProduct.data?.isActive
    ? filterProduct.data
    : undefined

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<StockMovementsSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search ||
    search.type ||
    search.productId ||
    search.from ||
    search.to,
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
            ? 'Ningún movimiento coincide con la búsqueda'
            : 'Todavía no hay movimientos registrados'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as StockMovementsSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por código, producto o nota"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(STOCK_MOVEMENT_FILTERS_CLEARED)}
            actions={
              canManage && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setDialog('adjustment')}
                  >
                    <PackageMinusIcon />
                    Registrar ajuste
                  </Button>
                  <Button onClick={() => setDialog('purchase')}>
                    <PackagePlusIcon />
                    Registrar compra
                  </Button>
                </>
              )
            }
          >
            <DataTableComboboxFilter
              label="Producto"
              allLabel="Todos los productos"
              searchPlaceholder="Buscar por código, nombre o marca"
              value={search.productId}
              selectedOption={productFilterOption}
              optionsQuery={allProductOptions}
              onChange={(productId) => filter({ productId })}
            />
            <DataTableFilter
              label="Tipo"
              allLabel="Todos los tipos"
              options={TYPE_OPTIONS}
              value={search.type}
              onChange={(value) =>
                filter({ type: value as StockMovementsSearch['type'] })
              }
            />
            <DataTableDateRangeFilter
              label="Fecha"
              from={search.from}
              to={search.to}
              onChange={(range) => filter(range)}
            />
          </DataTableToolbar>
        }
      />
      {canManage && (
        <>
          <PurchaseDialog
            open={dialog === 'purchase'}
            onOpenChange={(open) => !open && setDialog(undefined)}
            product={proposedProduct}
          />
          <AdjustmentDialog
            open={dialog === 'adjustment'}
            onOpenChange={(open) => !open && setDialog(undefined)}
            product={proposedProduct}
          />
        </>
      )}
    </>
  )
}
