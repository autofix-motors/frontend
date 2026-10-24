import { formatDateTime } from '#/lib/dates'
import { cn } from '#/lib/utils'
import { WorkOrderStatusBadge } from '#/modules/workshop/work-orders/components/WorkOrderStatusBadge'
import type { PortalEvent } from '../portal.schemas'

/**
 * La línea de tiempo que ve el cliente: solo lo que el taller marcó como
 * público, qué pasó y cuándo. La más reciente arriba: es lo que viene a ver.
 */
export function PortalTimeline({ events }: { events: PortalEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay avances.</p>
    )
  }
  return (
    <ol className="flex flex-col gap-4">
      {[...events].reverse().map((event, index) => (
        <li key={`${event.createdAt}-${index}`} className="flex gap-3">
          <span
            className={cn(
              'relative mt-1.5 size-[11px] shrink-0 rounded-full border-2',
              event.status
                ? 'border-primary bg-primary'
                : 'border-muted-foreground bg-background',
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {event.status && <WorkOrderStatusBadge status={event.status} />}
            {event.note && (
              <p className="text-sm whitespace-pre-line">{event.note}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
