import { ChevronDownIcon, MessageSquareReplyIcon, SendIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { formatQuantity } from '#/lib/quantity'
import { cn } from '#/lib/utils'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import {
  DECISION_CHANNEL_LABELS,
  ITEM_TYPE_LABELS,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  canSendQuote,
  pendingQuote,
} from '../work-orders.schemas'
import type {
  Quote,
  QuoteStatus,
  WorkOrderDetail,
} from '../work-orders.schemas'
import { SendQuoteDialog } from './SendQuoteDialog'

/**
 * Los presupuestos de la orden, de la versión más nueva a la más vieja. El
 * administrador envía uno nuevo (con la orden en diagnóstico o en reparación,
 * y con ítems) y registra la respuesta del cliente sobre la versión
 * pendiente; el mecánico los ve. Cada versión se despliega para ver los
 * ítems tal como se enviaron.
 */
export function WorkOrderQuotesSection({
  workOrder,
  role,
  onDecide,
}: {
  workOrder: WorkOrderDetail
  role: UserRole
  /** Abre el diálogo de la respuesta del cliente (vive en la página). */
  onDecide: (quote: Quote) => void
}) {
  const [sending, setSending] = useState(false)

  const isAdmin = role === 'ADMINISTRADOR'
  const canSend = isAdmin && canSendQuote(workOrder.estado)
  const hasItems = workOrder.detalles.length > 0
  const pending = pendingQuote(workOrder)

  return (
    <Card id="presupuestos">
      <CardHeader>
        <CardTitle>Presupuestos</CardTitle>
        <CardDescription>
          {canSend && !hasItems
            ? 'Agrega al menos un servicio o repuesto para enviar un presupuesto.'
            : canSend
              ? 'Enviar congela los servicios y repuestos de ahora y su total: el cliente lo ve en su seguimiento.'
              : 'Lo que se le propuso al cliente, versión por versión.'}
        </CardDescription>
        {canSend && hasItems && (
          <CardAction>
            <Button size="sm" onClick={() => setSending(true)}>
              <SendIcon />
              Enviar presupuesto
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {workOrder.presupuestos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no se envió ningún presupuesto.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {workOrder.presupuestos.map((quote, index) => (
              <QuoteRow
                key={quote.presupuestoId}
                quote={quote}
                // La más nueva se ve desplegada: es la que se discute.
                defaultOpen={index === 0}
                onDecide={
                  isAdmin && quote.presupuestoId === pending?.presupuestoId
                    ? () => onDecide(quote)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </CardContent>

      {canSend && (
        <SendQuoteDialog
          open={sending}
          onOpenChange={setSending}
          workOrder={workOrder}
        />
      )}
    </Card>
  )
}

/** El estado de una versión del presupuesto, con su color. */
function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge className={cn(QUOTE_STATUS_COLORS[status])}>
      {QUOTE_STATUS_LABELS[status]}
    </Badge>
  )
}

function QuoteRow({
  quote,
  defaultOpen,
  onDecide,
}: {
  quote: Quote
  defaultOpen: boolean
  /** Solo en la versión pendiente, y solo para el administrador. */
  onDecide?: () => void
}) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      {/* La key vuelve a montarlo cuando llega una versión más nueva: la que
          deja de ser la última se pliega, en vez de quedar como estaba. */}
      <Collapsible key={String(defaultOpen)} defaultOpen={defaultOpen}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">
                v{quote.version}
              </span>
              <QuoteStatusBadge status={quote.estado} />
              <span className="font-semibold tabular-nums">
                {formatMoney(quote.total)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enviado el {formatDateTime(quote.enviadoEn)} por{' '}
              {quote.enviadoPor.nombre}
            </p>
            {quote.decididoEn && (
              <p className="text-xs text-muted-foreground">
                {QUOTE_STATUS_LABELS[quote.estado]} el{' '}
                {formatDateTime(quote.decididoEn)}
                {quote.canalDecision &&
                  ` · ${DECISION_CHANNEL_LABELS[quote.canalDecision]}`}{' '}
                ·{' '}
                {quote.decididoPor
                  ? `lo registró ${quote.decididoPor.nombre}`
                  : 'respondió el cliente'}
              </p>
            )}
            {quote.notaDecision && (
              <p className="text-sm whitespace-pre-line">
                {quote.notaDecision}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onDecide && (
              <Button size="sm" onClick={onDecide}>
                <MessageSquareReplyIcon />
                Registrar respuesta del cliente
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="group/trigger"
                aria-label={`Ítems del presupuesto v${quote.version}`}
              >
                {quote.detalles.length}{' '}
                {quote.detalles.length === 1 ? 'ítem' : 'ítems'}
                <ChevronDownIcon className="transition-transform group-data-[state=open]/trigger:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">P. unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.detalles.map((item) => (
                <TableRow key={item.detallePresupuestoId}>
                  <TableCell>
                    <Badge
                      variant={
                        item.tipo === 'SERVICIO' ? 'secondary' : 'outline'
                      }
                    >
                      {ITEM_TYPE_LABELS[item.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    {item.descripcion}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(item.cantidad)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(item.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell colSpan={4} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatMoney(quote.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
