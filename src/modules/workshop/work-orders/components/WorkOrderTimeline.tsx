import { EyeIcon, LockIcon } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { formatDateTime } from '#/lib/dates'
import { cn } from '#/lib/utils'
import type { WorkOrderEvent } from '../work-orders.schemas'
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge'

/**
 * La línea de tiempo de la orden, de lo más reciente a lo más antiguo. Cada
 * evento dice si lo ve el cliente en su seguimiento o si queda en el taller.
 */
export function WorkOrderTimeline({ events }: { events: WorkOrderEvent[] }) {
  // La API los manda del más antiguo al más reciente; aquí se lee al revés,
  // con lo último arriba.
  const ordered = [...events].reverse()

  return (
    <ol aria-label="Línea de tiempo" className="flex flex-col">
      {ordered.map((event, index) => (
        <li key={event.workOrderEventId} className="relative flex gap-3 pb-5">
          {/* La línea que une los eventos, salvo después del último. */}
          {index < ordered.length - 1 && (
            <span
              aria-hidden
              className="absolute top-4 left-[5px] h-full w-px bg-border"
            />
          )}
          <span
            aria-hidden
            className={cn(
              'relative mt-1.5 size-[11px] shrink-0 rounded-full border-2',
              event.status
                ? 'border-primary bg-primary'
                : 'border-muted-foreground bg-background',
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {event.status ? (
                <WorkOrderStatusBadge status={event.status} />
              ) : (
                <span className="text-sm font-medium">Nota</span>
              )}
              <VisibilityBadge isPublic={event.isPublic} />
            </div>
            {event.note && (
              <p className="text-sm whitespace-pre-line">{event.note}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {event.createdBy.name} · {formatDateTime(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <Badge variant="outline">
      <EyeIcon />
      Lo ve el cliente
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <LockIcon />
      Interna
    </Badge>
  )
}
