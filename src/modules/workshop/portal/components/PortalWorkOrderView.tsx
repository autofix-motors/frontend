import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, CheckIcon, ClockIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formatDateOnly, formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { WorkOrderStatusBadge } from '#/modules/workshop/work-orders/components/WorkOrderStatusBadge'
import { defaultPortalWorkOrdersSearch, pendingQuote } from '../portal.schemas'
import type { PortalDecision, PortalWorkOrderDetail } from '../portal.schemas'
import { DecideMyQuoteDialog } from './DecideMyQuoteDialog'
import { PortalLinesTable } from './PortalLinesTable'
import { PortalQuotes } from './PortalQuotes'
import { PortalTimeline } from './PortalTimeline'

/**
 * El detalle de una orden en el portal. Arriba lo que el cliente vino a ver:
 * en qué estado está y, si el taller espera su respuesta, el presupuesto con
 * los botones para aprobarlo o rechazarlo.
 */
export function PortalWorkOrderView({
  order,
}: {
  order: PortalWorkOrderDetail
}) {
  const pending = pendingQuote(order)
  const [decision, setDecision] = useState<PortalDecision>('APPROVED')
  const [deciding, setDeciding] = useState(false)

  const answer = (value: PortalDecision) => {
    setDecision(value)
    setDeciding(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link to="/portal/work-orders" search={defaultPortalWorkOrdersSearch}>
          <ArrowLeftIcon />
          Mis reparaciones
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">
            {order.vehicle.brand} {order.vehicle.model}
          </h1>
          <WorkOrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Placa {order.vehicle.plate} · Código {order.trackingCode}
        </p>
      </div>

      {pending && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          <p className="flex items-start gap-2 text-sm">
            <ClockIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              El taller te envió un presupuesto (versión {pending.version}) por{' '}
              <strong className="tabular-nums">
                {formatMoney(pending.total)}
              </strong>{' '}
              el {formatDateTime(pending.sentAt)}. Revísalo abajo y danos tu
              respuesta.
            </span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => answer('APPROVED')}>
              <CheckIcon />
              Aprobar
            </Button>
            <Button variant="outline" onClick={() => answer('REJECTED')}>
              <XIcon />
              Rechazar
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Presupuestos</CardTitle>
              <CardDescription>
                Lo que el taller te propuso, versión por versión.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortalQuotes quotes={order.quotes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicios y repuestos</CardTitle>
              <CardDescription>
                Lo que lleva hoy tu reparación, con sus precios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.items.length ? (
                <PortalLinesTable
                  lines={order.items}
                  total={order.totals.total}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no se registraron servicios ni repuestos.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avance</CardTitle>
              <CardDescription>Lo que pasó con tu vehículo.</CardDescription>
            </CardHeader>
            <CardContent>
              <PortalTimeline events={order.events} />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la reparación</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Ingresó</dt>
                <dd>{formatDateTime(order.receivedAt)}</dd>
                <dt className="text-muted-foreground">Kilometraje</dt>
                <dd className="tabular-nums">
                  {order.mileageIn.toLocaleString('es-PE')} km
                </dd>
                {order.promisedDate && (
                  <>
                    <dt className="text-muted-foreground">Prometido</dt>
                    <dd>{formatDateOnly(order.promisedDate)}</dd>
                  </>
                )}
                {order.deliveredAt && (
                  <>
                    <dt className="text-muted-foreground">Entregado</dt>
                    <dd>{formatDateTime(order.deliveredAt)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Mecánico</dt>
                <dd>{order.mechanicName ?? 'Por asignar'}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Motivo del ingreso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{order.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">
                {order.diagnosis ??
                  'El mecánico todavía no registra el diagnóstico.'}
              </p>
            </CardContent>
          </Card>

          {order.cancelReason && (
            <Card>
              <CardHeader>
                <CardTitle>Motivo de la cancelación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {order.cancelReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <DecideMyQuoteDialog
        workOrderId={order.workOrderId}
        quote={deciding ? pending : undefined}
        decision={decision}
        onClose={() => setDeciding(false)}
      />
    </div>
  )
}
