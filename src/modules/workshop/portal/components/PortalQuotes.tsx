import { Badge } from '#/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { ChevronDownIcon } from 'lucide-react'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { cn } from '#/lib/utils'
import {
  DECISION_CHANNEL_LABELS,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
} from '#/modules/workshop/work-orders/work-orders.schemas'
import type { PortalQuote } from '../portal.schemas'
import { PortalLinesTable } from './PortalLinesTable'

/**
 * Las versiones del presupuesto que envió el taller, de la más nueva a la más
 * vieja, con su respuesta. Cada una se despliega para ver sus ítems. La
 * pendiente se responde desde el aviso de arriba de la página.
 */
export function PortalQuotes({ quotes }: { quotes: PortalQuote[] }) {
  if (!quotes.length) {
    return (
      <p className="text-sm text-muted-foreground">
        El taller todavía no te envió un presupuesto.
      </p>
    )
  }
  return (
    <ul className="flex flex-col divide-y">
      {quotes.map((quote, index) => (
        <li key={quote.quoteId} className="py-3 first:pt-0 last:pb-0">
          <Collapsible defaultOpen={index === 0}>
            <CollapsibleTrigger className="group flex w-full items-start justify-between gap-3 text-left">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Versión {quote.version}</span>
                  <Badge className={cn(QUOTE_STATUS_COLORS[quote.status])}>
                    {QUOTE_STATUS_LABELS[quote.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviado el {formatDateTime(quote.sentAt)}
                  {quote.decidedAt &&
                    ` · ${QUOTE_STATUS_LABELS[quote.status]} el ${formatDateTime(quote.decidedAt)}`}
                  {quote.decisionChannel &&
                    ` (${DECISION_CHANNEL_LABELS[quote.decisionChannel]})`}
                </p>
                {quote.decisionNote && (
                  <p className="text-sm whitespace-pre-line">
                    {quote.decisionNote}
                  </p>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1 font-medium tabular-nums">
                {formatMoney(quote.total)}
                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <PortalLinesTable lines={quote.items} total={quote.total} />
            </CollapsibleContent>
          </Collapsible>
        </li>
      ))}
    </ul>
  )
}
