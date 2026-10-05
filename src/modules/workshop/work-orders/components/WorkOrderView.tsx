import { Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
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
import { cn } from '#/lib/utils'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import {
  TRANSITION_LABELS,
  allowedTransitions,
  canEditDiagnosis,
  defaultWorkOrdersSearch,
  formatWorkOrderNumber,
  isClosed,
} from '../work-orders.schemas'
import type { WorkOrderDetail, WorkOrderStatus } from '../work-orders.schemas'
import { AddNoteForm } from './AddNoteForm'
import { ChangeStatusDialog } from './ChangeStatusDialog'
import { DeleteWorkOrderDialog } from './DeleteWorkOrderDialog'
import { DiagnosisSection } from './DiagnosisSection'
import { EditWorkOrderDialog } from './EditWorkOrderDialog'
import { WorkOrderTimeline } from './WorkOrderTimeline'
import { OverdueBadge, WorkOrderStatusBadge } from './WorkOrderStatusBadge'

const kmFormat = new Intl.NumberFormat('es-PE')

/**
 * El detalle de una orden: dónde se trabaja. Los botones de estado son los
 * que el rol puede usar desde el estado actual (la misma tabla que la API);
 * editar, asignar y borrar son del administrador.
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

  const isAdmin = role === 'ADMIN'
  const transitions = allowedTransitions(workOrder.status, role)
  const closed = isClosed(workOrder.status)

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
                {formatWorkOrderNumber(workOrder.number)}
              </h1>
              <WorkOrderStatusBadge status={workOrder.status} />
              {workOrder.isOverdue && <OverdueBadge />}
            </div>
            <p className="text-sm text-muted-foreground">
              Código de seguimiento{' '}
              <span className="font-mono font-medium text-foreground">
                {workOrder.trackingCode}
              </span>{' '}
              · Recibida el {formatDateTime(workOrder.receivedAt)} por{' '}
              {workOrder.createdBy.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {transitions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'CANCELLED' ? 'destructive' : 'default'}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Vehículo">
          <p className="font-mono font-medium">{workOrder.vehicle.plate}</p>
          <p className="text-muted-foreground">
            {workOrder.vehicle.brand} {workOrder.vehicle.model}
          </p>
          <p className="text-muted-foreground">
            {kmFormat.format(workOrder.mileageIn)} km al ingreso
          </p>
        </InfoCard>
        <InfoCard title="Cliente">
          <p className="font-medium">{workOrder.customer.name}</p>
          <p className="text-muted-foreground">{workOrder.customer.phone}</p>
        </InfoCard>
        <InfoCard title="Mecánico">
          {workOrder.mechanic ? (
            <p className="font-medium">{workOrder.mechanic.name}</p>
          ) : (
            <p className="text-muted-foreground">Sin asignar</p>
          )}
        </InfoCard>
        <InfoCard title="Fechas">
          <p>
            Prometida:{' '}
            <span
              className={cn(
                'tabular-nums',
                workOrder.isOverdue && 'font-medium text-destructive',
              )}
            >
              {workOrder.promisedDate
                ? formatDateOnly(workOrder.promisedDate)
                : 'sin fecha'}
            </span>
          </p>
          {workOrder.deliveredAt && (
            <p>
              Entregada:{' '}
              <span className="tabular-nums">
                {formatDateTime(workOrder.deliveredAt)}
              </span>
            </p>
          )}
          {workOrder.cancelledAt && (
            <p>
              Cancelada:{' '}
              <span className="tabular-nums">
                {formatDateTime(workOrder.cancelledAt)}
              </span>
            </p>
          )}
        </InfoCard>
      </div>

      {workOrder.cancelReason && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Motivo de la cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">
              {workOrder.cancelReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Motivo del ingreso</CardTitle>
              <CardDescription>
                Lo que el cliente pidió o reportó al dejar el vehículo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{workOrder.reason}</p>
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
                key={workOrder.diagnosis ?? ''}
                workOrderId={workOrder.workOrderId}
                diagnosis={workOrder.diagnosis}
                canEdit={canEditDiagnosis(workOrder.status)}
              />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
            <CardDescription>
              Lo marcado «Lo ve el cliente» aparece en su seguimiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <AddNoteForm workOrderId={workOrder.workOrderId} />
            <WorkOrderTimeline events={workOrder.events} />
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
        </>
      )}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5 text-sm">
        {children}
      </CardContent>
    </Card>
  )
}
