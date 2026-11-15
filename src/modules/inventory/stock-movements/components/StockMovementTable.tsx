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
  COMPRA: 'secondary',
  ORDEN_TRABAJO: 'outline',
  AJUSTE: 'outline',
}

const muted = <span className="text-muted-foreground">—</span>

/**
 * Las columnas. El costo unitario solo para el administrador: la API ni
 * siquiera se lo manda al mecánico. No hay acciones por fila: un movimiento
 * no se edita ni se borra.
 */
function stockMovementColumns(canManage: boolean) {
  return column.columns([
    column.accessor('creadoEn', {
      header: 'Fecha',
      cell: (info) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    column.accessor('producto', {
      header: 'Producto',
      enableSorting: false,
      cell: (info) => {
        const product = info.getValue()
        return (
          <div className="flex max-w-xs flex-col">
            <span className="truncate font-medium">{product.nombre}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {product.codigo}
            </span>
          </div>
        )
      },
    }),
    column.accessor('tipo', {
      header: 'Tipo',
      enableSorting: false,
      cell: (info) => (
        <Badge variant={TYPE_BADGES[info.getValue()]}>
          {STOCK_MOVEMENT_TYPE_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    column.accessor('cantidad', {
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
            {formatMovementQuantity(
              quantity,
              info.row.original.producto.unidad,
            )}
          </span>
        )
      },
    }),
    ...(canManage
      ? [
          column.accessor('costoUnitario', {
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
    column.accessor('nota', {
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
    column.accessor('creadoPor', {
      header: 'Registró',
      enableSorting: false,
      cell: (info) => info.getValue().nombre,
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
    ...productsQueries.detail(search.productoId ?? ''),
    enabled: Boolean(search.productoId),
  })
  const productFilterOption: ComboboxOption | undefined = search.productoId
    ? filterProduct.data
      ? productOption(filterProduct.data)
      : filterProduct.isError
        ? { value: search.productoId, label: 'Producto no encontrado' }
        : undefined
    : undefined
  // Solo se propone un producto activo: la API no registra movimientos de
  // los inactivos.
  const proposedProduct = filterProduct.data?.activo
    ? filterProduct.data
    : undefined

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<StockMovementsSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search ||
    search.tipo ||
    search.productoId ||
    search.desde ||
    search.hasta,
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
        sort={{ ordenarPor: search.ordenarPor, sentido: search.sentido }}
        onSortChange={(sort) =>
          onSearchChange({
            ordenarPor: sort.ordenarPor as StockMovementsSearch['ordenarPor'],
            sentido: sort.sentido,
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
              value={search.productoId}
              selectedOption={productFilterOption}
              optionsQuery={allProductOptions}
              onChange={(productoId) => filter({ productoId })}
            />
            <DataTableFilter
              label="Tipo"
              allLabel="Todos los tipos"
              options={TYPE_OPTIONS}
              value={search.tipo}
              onChange={(value) =>
                filter({ tipo: value as StockMovementsSearch['tipo'] })
              }
            />
            <DataTableDateRangeFilter
              label="Fecha"
              from={search.desde}
              to={search.hasta}
              onChange={({ from, to }) => filter({ desde: from, hasta: to })}
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
