import { ChevronDownIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  OPEN_STATUSES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
} from '../work-orders.schemas'
import type { WorkOrderStatus } from '../work-orders.schemas'

/** Si dos listas de estados son el mismo conjunto, en cualquier orden. */
const sameStatuses = (a: readonly WorkOrderStatus[], b: readonly string[]) =>
  a.length === b.length && a.every((status) => b.includes(status))

/** Lo que dice el botón: «Todos los estados», uno, «Abiertas» o cuántos. */
function summary(value: WorkOrderStatus[] | undefined): string {
  if (!value) return 'Todos los estados'
  if (value.length === 1) return WORK_ORDER_STATUS_LABELS[value[0]]
  if (sameStatuses(value, OPEN_STATUSES)) return 'Abiertas'
  return `${value.length} estados`
}

/**
 * El filtro de estado: varios a la vez (la API los recibe separados por
 * coma), con el atajo «Abiertas» —todo lo que sigue en el taller—. Sin
 * ninguno marcado, no se filtra. Vive en el módulo porque es el único listado
 * que filtra por varios valores; si aparece un segundo, se generaliza en
 * `components/data-table/`.
 */
export function WorkOrderStatusFilter({
  value,
  onChange,
}: {
  value: WorkOrderStatus[] | undefined
  onChange: (value: WorkOrderStatus[] | undefined) => void
}) {
  const toggle = (status: WorkOrderStatus, checked: boolean) => {
    const current = value ?? []
    // Se guarda en el orden del flujo, no en el de los clics: la URL sale
    // igual para la misma selección.
    const next = WORK_ORDER_STATUSES.filter((option) =>
      option === status ? checked : current.includes(option),
    )
    onChange(next.length ? next : undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Estado"
          className="min-w-36 justify-between font-normal"
        >
          {summary(value)}
          <ChevronDownIcon className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => onChange(undefined)}>
          Todos los estados
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onChange([...OPEN_STATUSES])}>
          Abiertas (sin entregar ni cancelar)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Estados</DropdownMenuLabel>
        {WORK_ORDER_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={value?.includes(status) ?? false}
            onCheckedChange={(checked) => toggle(status, checked)}
            // Sin cerrar: se marcan varios de una vez.
            onSelect={(event) => event.preventDefault()}
          >
            {WORK_ORDER_STATUS_LABELS[status]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
