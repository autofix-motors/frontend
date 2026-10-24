import {
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  Trash2Icon,
  WrenchIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatMoney } from '#/lib/money'
import { cn } from '#/lib/utils'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import {
  ITEM_TYPE_LABELS,
  canChangeItems,
  canEditItem,
  formatItemQuantity,
} from '../work-orders.schemas'
import type {
  ItemType,
  WorkOrderDetail,
  WorkOrderItem,
} from '../work-orders.schemas'
import { AddItemDialog } from './AddItemDialog'
import { EditItemDialog } from './EditItemDialog'
import { RemoveItemDialog } from './RemoveItemDialog'

/**
 * Los servicios y repuestos de la orden, con lo que suman. Se agregan, editan
 * y quitan mientras la orden se diagnostica o se repara (como en la API);
 * después, la tabla queda de solo lectura. El costo y el margen de los
 * repuestos solo llegan para el administrador, y solo para él se muestran.
 */
export function WorkOrderItemsSection({
  workOrder,
  role,
}: {
  workOrder: WorkOrderDetail
  role: UserRole
}) {
  const [adding, setAdding] = useState<ItemType>()
  const [editing, setEditing] = useState<WorkOrderItem>()
  const [removing, setRemoving] = useState<WorkOrderItem>()

  const canChange = canChangeItems(workOrder.status)
  const { items, totals } = workOrder

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios y repuestos</CardTitle>
        <CardDescription>
          {canChange
            ? 'Lo que se hace y se cobra. Un repuesto se descuenta del stock al agregarlo.'
            : 'Lo que se hizo y se cobra. Ya no se cambia en este estado.'}
        </CardDescription>
        {canChange && (
          <CardAction className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdding('SERVICE')}
            >
              <WrenchIcon />
              Agregar servicio
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdding('PRODUCT')}
            >
              <PackageIcon />
              Agregar repuesto
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no hay servicios ni repuestos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">P. unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                {canChange && (
                  <TableHead className="w-10">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.workOrderItemId}>
                  <TableCell>
                    <Badge
                      variant={
                        item.type === 'SERVICE' ? 'secondary' : 'outline'
                      }
                    >
                      {ITEM_TYPE_LABELS[item.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatItemQuantity(item)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                    {formatMoney(item.subtotal)}
                  </TableCell>
                  {canChange && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Acciones de ${item.description}`}
                          >
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditItem(item, role) && (
                            <DropdownMenuItem onSelect={() => setEditing(item)}>
                              <PencilIcon />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setRemoving(item)}
                          >
                            <Trash2Icon />
                            Quitar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TotalRow
                label="Mano de obra"
                amount={totals.labor}
                span={canChange}
              />
              <TotalRow
                label="Repuestos"
                amount={totals.parts}
                span={canChange}
              />
              <TotalRow
                label="Total"
                amount={totals.total}
                span={canChange}
                className="text-base font-semibold"
              />
            </TableFooter>
          </Table>
        )}
        {totals.partsCost !== undefined && totals.partsMargin !== undefined && (
          <p className="mt-3 text-sm text-muted-foreground">
            Costo de los repuestos:{' '}
            <span className="tabular-nums">
              {formatMoney(totals.partsCost)}
            </span>{' '}
            · Margen:{' '}
            <span
              className={cn(
                'font-medium tabular-nums',
                totals.partsMargin.startsWith('-')
                  ? 'text-destructive'
                  : 'text-foreground',
              )}
            >
              {formatMoney(totals.partsMargin)}
            </span>
          </p>
        )}
      </CardContent>

      <AddItemDialog
        workOrderId={workOrder.workOrderId}
        type={adding}
        role={role}
        onOpenChange={(open) => !open && setAdding(undefined)}
      />
      <EditItemDialog
        workOrderId={workOrder.workOrderId}
        item={editing}
        role={role}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
      <RemoveItemDialog
        workOrderId={workOrder.workOrderId}
        item={removing}
        onOpenChange={(open) => !open && setRemoving(undefined)}
      />
    </Card>
  )
}

/** Una fila del pie: la etiqueta ocupa las columnas hasta el subtotal. */
function TotalRow({
  label,
  amount,
  span,
  className,
}: {
  label: ReactNode
  amount: string
  /** Si la tabla tiene la columna de acciones, que el pie también cubre. */
  span: boolean
  className?: string
}) {
  return (
    <TableRow className={className}>
      <TableCell colSpan={4} className="text-right">
        {label}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {formatMoney(amount)}
      </TableCell>
      {span && <TableCell />}
    </TableRow>
  )
}
