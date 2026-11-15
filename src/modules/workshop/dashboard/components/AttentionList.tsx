import { Link } from '@tanstack/react-router'
import { ChevronRightIcon, SmileIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { formatDateOnly, limaToday } from '#/lib/dates'
import { cn } from '#/lib/utils'
import { WorkOrderStatusBadge } from '#/modules/workshop/work-orders/components/WorkOrderStatusBadge'
import {
  defaultWorkOrdersSearch,
  formatWorkOrderNumber,
} from '#/modules/workshop/work-orders/work-orders.schemas'
import { dueLabel } from '../dashboard.schemas'
import type { DashboardAttentionOrder } from '../dashboard.schemas'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

/**
 * Las órdenes abiertas que ya pasaron su fecha prometida o vencen en dos días
 * o menos, de la más atrasada a la más nueva. Cada fila abre la orden.
 */
export function AttentionList({
  atencion,
  vencidas,
  isAdmin,
  className,
}: {
  atencion: DashboardAttentionOrder[]
  /** Todas las vencidas (la lista trae hasta 6): decide si se ofrece verlas. */
  vencidas: number
  isAdmin: boolean
  className?: string
}) {
  const today = limaToday()

  return (
    <DashboardCard
      title={isAdmin ? 'Órdenes para atender' : 'Mis órdenes para atender'}
      description="Vencidas y por vencer en los próximos 2 días."
      action={
        vencidas > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/workshop/work-orders"
              search={{ ...defaultWorkOrdersSearch, vencidas: true }}
            >
              Ver vencidas
            </Link>
          </Button>
        )
      }
      className={className}
    >
      {atencion.length === 0 ? (
        <DashboardEmpty
          icon={SmileIcon}
          title="Nada vencido: buen trabajo"
          description="Ninguna orden vence en los próximos 2 días."
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {atencion.map((order) => (
            <li key={order.ordenTrabajoId}>
              <Link
                to="/workshop/work-orders/$workOrderId"
                params={{ workOrderId: order.ordenTrabajoId }}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {formatWorkOrderNumber(order.numero)}
                    </span>
                    <span className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-xs tracking-wide uppercase">
                      {order.placa}
                    </span>
                  </div>
                  <WorkOrderStatusBadge status={order.estado} />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      order.vencida
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-foreground',
                    )}
                  >
                    {formatDateOnly(order.fechaPrometida)}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      order.vencida
                        ? 'text-rose-700/80 dark:text-rose-300/80'
                        : 'text-muted-foreground',
                    )}
                  >
                    {dueLabel(order.fechaPrometida, today)}
                  </span>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
