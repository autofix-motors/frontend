import { Link } from '@tanstack/react-router'
import { ChevronRightIcon, ClockIcon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { formatDateOnly, formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { WorkOrderStatusBadge } from '#/modules/workshop/work-orders/components/WorkOrderStatusBadge'
import type { PortalWorkOrder } from '../portal.schemas'

/** Una orden del cliente en su lista: se toca para ver el detalle. */
export function PortalWorkOrderCard({ order }: { order: PortalWorkOrder }) {
  return (
    <Link
      to="/portal/work-orders/$workOrderId"
      params={{ workOrderId: order.workOrderId }}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {order.vehicle.brand} {order.vehicle.model}
              </span>
              <span className="text-sm text-muted-foreground">
                {order.vehicle.plate}
              </span>
              <WorkOrderStatusBadge status={order.status} />
              {order.hasPendingQuote && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <ClockIcon />
                  Presupuesto por responder
                </Badge>
              )}
            </div>
            <p className="truncate text-sm">{order.reason}</p>
            <p className="text-xs text-muted-foreground">
              {order.trackingCode} · Ingresó el{' '}
              {formatDateTime(order.receivedAt)}
              {order.deliveredAt
                ? ` · Entregado el ${formatDateTime(order.deliveredAt)}`
                : order.promisedDate
                  ? ` · Prometido para el ${formatDateOnly(order.promisedDate)}`
                  : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-sm font-medium tabular-nums">
              {formatMoney(order.total)}
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
