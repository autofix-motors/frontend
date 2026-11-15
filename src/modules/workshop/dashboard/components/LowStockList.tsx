import { Link } from '@tanstack/react-router'
import { PackageCheckIcon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { formatQuantity } from '#/lib/quantity'
import { TONES } from '#/lib/tones'
import { cn } from '#/lib/utils'
import {
  UNIT_OF_MEASURE_SYMBOLS,
  defaultProductsSearch,
} from '#/modules/inventory/products/products.schemas'
import type { DashboardLowStockProduct } from '../dashboard.schemas'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

/**
 * Los productos activos en su stock mínimo o por debajo, los que más les falta
 * primero (hasta 6, en el orden de la API). El total va junto al título y
 * «Ver todos» abre los repuestos con el filtro de stock bajo.
 */
export function LowStockList({
  productosStockBajo,
  stockBajo,
  className,
}: {
  productosStockBajo: DashboardLowStockProduct[]
  /** Cuántos productos tienen stock bajo en total. */
  stockBajo: number
  className?: string
}) {
  return (
    <DashboardCard
      title={
        <span className="flex items-center gap-2">
          Stock bajo
          {stockBajo > 0 && (
            <Badge className={cn('tabular-nums', TONES.amber.chip)}>
              {stockBajo}
            </Badge>
          )}
        </span>
      }
      description="Repuestos e insumos en su mínimo o por debajo."
      action={
        stockBajo > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/inventory/products"
              search={{ ...defaultProductsSearch, stockBajo: true }}
            >
              Ver todos
            </Link>
          </Button>
        )
      }
      className={className}
    >
      {productosStockBajo.length === 0 ? (
        <DashboardEmpty
          icon={PackageCheckIcon}
          title="Todo el stock está en orden"
          description="Ningún producto está en su mínimo."
        />
      ) : (
        <ul className="flex flex-col divide-y">
          {productosStockBajo.map((product) => {
            const unit = UNIT_OF_MEASURE_SYMBOLS[product.unidad]
            return (
              <li
                key={product.productoId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {product.nombre}
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {product.codigo}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      TONES.rose.text,
                    )}
                  >
                    {formatQuantity(product.stock)} {unit}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    mín. {formatQuantity(product.stockMinimo)} {unit}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardCard>
  )
}
