import { AlertTriangleIcon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import {
  WORK_ORDER_STATUS_COLORS,
  WORK_ORDER_STATUS_LABELS,
} from '../work-orders.schemas'
import type { WorkOrderStatus } from '../work-orders.schemas'

/** El estado de una orden, con su color. */
export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <Badge className={cn(WORK_ORDER_STATUS_COLORS[status])}>
      {WORK_ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

/** La marca de una orden que pasó su fecha prometida sin entregarse. */
export function OverdueBadge() {
  return (
    <Badge variant="destructive">
      <AlertTriangleIcon />
      Vencida
    </Badge>
  )
}
