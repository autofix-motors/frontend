import { Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CarIcon,
  ClockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { formatDateOnly, formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import { TONES } from '#/lib/tones'
import type { Tone } from '#/lib/tones'
import { cn } from '#/lib/utils'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import {
  TRANSITION_LABELS,
  allowedTransitions,
  canEditDiagnosis,
  defaultWorkOrdersSearch,
  formatWorkOrderNumber,
  isClosed,
  pendingQuote,
} from '../work-orders.schemas'
import type {
  Quote,
  WorkOrderDetail,
  WorkOrderStatus,
} from '../work-orders.schemas'
import { AddNoteForm } from './AddNoteForm'
import { ChangeStatusDialog } from './ChangeStatusDialog'
import { DecideQuoteDialog } from './DecideQuoteDialog'
import { DeleteWorkOrderDialog } from './DeleteWorkOrderDialog'
import { DiagnosisSection } from './DiagnosisSection'
import { EditWorkOrderDialog } from './EditWorkOrderDialog'
import { WorkOrderItemsSection } from './WorkOrderItemsSection'
import { WorkOrderQuotesSection } from './WorkOrderQuotesSection'
import { WorkOrderTimeline } from './WorkOrderTimeline'
import { OverdueBadge, WorkOrderStatusBadge } from './WorkOrderStatusBadge'

const kmFormat = new Intl.NumberFormat('es-PE')

/**
 * El detalle de una orden: dónde se trabaja. Los botones de estado son los
 * que el rol puede usar desde el estado actual (la misma tabla que la API);
 * editar, asignar y borrar son del administrador. Arriba, el resumen (vehículo,
 * cliente, mecánico y fechas, cada uno con su tono de `lib/tones.ts`) y, justo
 * debajo, el motivo y el diagnóstico: lo primero que se lee al abrir la orden.
 * Después, los servicios y repuestos (lo que más se toca mientras la orden
 * está en el taller) con los presupuestos, y al costado la línea de tiempo.
 * Mientras la orden espera aprobación, la cabecera lo avisa con el total
 * pendiente.
 */
export function WorkOrderView({
  workOrder,
  role,
}: {
  workOrder: WorkOrderDetail
  role: UserRole
}) {
  const [target, setTarget] = useState<WorkOrderStatus>()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deciding, setDeciding] = useState<Quote>()

  const isAdmin = role === 'ADMINISTRADOR'
  const transitions = allowedTransitions(workOrder.estado, role)
  const closed = isClosed(workOrder.estado)
  const pending = pendingQuote(workOrder)
  const datesTone: Tone = workOrder.vencida ? 'rose' : 'amber'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="self-start" asChild>
          <Link to="/workshop/work-orders" search={defaultWorkOrdersSearch}>
            <ArrowLeftIcon />
            Órdenes de trabajo
          </Link>
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-semibold">
                {formatWorkOrderNumber(workOrder.numero)}
              </h1>
              <WorkOrderStatusBadge status={workOrder.estado} />
              {workOrder.vencida && <OverdueBadge />}
            </div>
            <p className="text-sm text-muted-foreground">
              Código de seguimiento{' '}
              <span className="font-mono font-medium text-foreground">
                {workOrder.codigoSeguimiento}
              </span>{' '}
              · Recibida el {formatDateTime(workOrder.recibidaEn)} por{' '}
              {workOrder.creadoPor.nombre}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {transitions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'CANCELADO' ? 'destructive' : 'default'}
                onClick={() => setTarget(status)}
              >
                {TRANSITION_LABELS[status]}
              </Button>
            ))}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Más">
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* La API no edita una orden entregada o cancelada. */}
                  <DropdownMenuItem
                    disabled={closed}
                    onSelect={() => setEditing(true)}
                  >
                    <PencilIcon />
                    Editar o asignar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(true)}
                  >
                    <Trash2Icon />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {pending && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            <p className="flex items-center gap-2">
              <ClockIcon className="size-4 shrink-0" />
              <span>
                Esperando la respuesta del cliente al presupuesto v
                {pending.version} por{' '}
                <strong className="tabular-nums">
                  {formatMoney(pending.total)}
                </strong>
                , enviado el {formatDateTime(pending.enviadoEn)}.
              </span>
            </p>
            {isAdmin && (
              <Button size="sm" onClick={() => setDeciding(pending)}>
                Registrar respuesta del cliente
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Vehículo" icon={CarIcon} tone="sky">
          <p
            className={cn(
              'font-mono text-xl font-semibold tracking-wide',
              TONES.sky.text,
            )}
          >
            {workOrder.vehiculo.placa}
          </p>
          <p>
            {workOrder.vehiculo.marca} {workOrder.vehiculo.modelo}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {kmFormat.format(workOrder.kilometrajeIngreso)} km al ingreso
          </p>
        </InfoCard>
        <InfoCard title="Cliente" icon={UserIcon} tone="emerald">
          <p className={cn('text-base font-semibold', TONES.emerald.text)}>
            {workOrder.cliente.nombre}
          </p>
          <p className="text-muted-foreground">{workOrder.cliente.telefono}</p>
        </InfoCard>
        <InfoCard title="Mecánico" icon={WrenchIcon} tone="violet">
          {workOrder.mecanico ? (
            <p className={cn('text-base font-semibold', TONES.violet.text)}>
              {workOrder.mecanico.nombre}
            </p>
          ) : (
            <p className="text-base text-muted-foreground">Sin asignar</p>
          )}
        </InfoCard>
        {/* Vencida (lo decide la API), la tarjeta pasa a rosa. */}
        <InfoCard title="Fechas" icon={CalendarIcon} tone={datesTone}>
          <p>
            Prometida:{' '}
            <span
              className={cn(
                'text-base font-semibold tabular-nums',
                TONES[datesTone].text,
              )}
            >
              {workOrder.fechaPrometida
                ? formatDateOnly(workOrder.fechaPrometida)
                : 'sin fecha'}
            </span>
          </p>
          {workOrder.entregadaEn && (
            <p className="text-muted-foreground">
              Entregada:{' '}
              <span className="tabular-nums">
                {formatDateTime(workOrder.entregadaEn)}
              </span>
            </p>
          )}
          {workOrder.canceladaEn && (
            <p className="text-muted-foreground">
              Cancelada:{' '}
              <span className="tabular-nums">
                {formatDateTime(workOrder.canceladaEn)}
              </span>
            </p>
          )}
        </InfoCard>
      </div>

      {workOrder.motivoCancelacion && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Motivo de la cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">
              {workOrder.motivoCancelacion}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lado a lado lo que pidió el cliente y lo que encontró el taller. Las
          celdas de la grilla se estiran: las dos tarjetas quedan parejas. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Motivo del ingreso</CardTitle>
            <CardDescription>
              Lo que el cliente pidió o reportó al dejar el vehículo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{workOrder.motivo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
            <CardDescription>Lo que encontró el taller.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* La API ya filtró quién ve la orden: quien la ve aquí es el
                administrador o su mecánico. */}
            <DiagnosisSection
              key={workOrder.diagnostico ?? ''}
              workOrderId={workOrder.ordenTrabajoId}
              diagnosis={workOrder.diagnostico}
              canEdit={canEditDiagnosis(workOrder.estado)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <WorkOrderItemsSection workOrder={workOrder} role={role} />
          <WorkOrderQuotesSection
            workOrder={workOrder}
            role={role}
            onDecide={setDeciding}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
            <CardDescription>
              Lo marcado «Lo ve el cliente» aparece en su seguimiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <AddNoteForm workOrderId={workOrder.ordenTrabajoId} />
            <WorkOrderTimeline events={workOrder.eventos} />
          </CardContent>
        </Card>
      </div>

      <ChangeStatusDialog
        workOrder={workOrder}
        status={target}
        onOpenChange={(open) => !open && setTarget(undefined)}
      />
      {isAdmin && (
        <>
          <EditWorkOrderDialog
            open={editing}
            onOpenChange={setEditing}
            workOrder={workOrder}
          />
          <DeleteWorkOrderDialog
            open={deleting}
            onOpenChange={setDeleting}
            workOrder={workOrder}
          />
          <DecideQuoteDialog
            workOrderId={workOrder.ordenTrabajoId}
            quote={deciding}
            onOpenChange={(open) => !open && setDeciding(undefined)}
          />
        </>
      )}
    </div>
  )
}

/**
 * Un dato del resumen de la orden: tarjeta con el fondo y el borde de su tono,
 * el ícono en un círculo y el dato principal destacado. `h-full` iguala la
 * altura de las cuatro de la misma fila.
 */
function InfoCard({
  title,
  icon: Icon,
  tone,
  children,
}: {
  title: string
  icon: LucideIcon
  tone: Tone
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'flex h-full items-start gap-3 rounded-xl border p-4',
        TONES[tone].soft,
        TONES[tone].border,
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          TONES[tone].chip,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
