import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import {
  AlarmClockIcon,
  BanknoteIcon,
  CircleCheckBigIcon,
  ClipboardListIcon,
  HourglassIcon,
  PackageCheckIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatMoney } from '#/lib/money'
import { TONES } from '#/lib/tones'
import type { Tone } from '#/lib/tones'
import { cn } from '#/lib/utils'
import {
  OPEN_STATUSES,
  defaultWorkOrdersSearch,
} from '#/modules/workshop/work-orders/work-orders.schemas'
import type { DashboardIndicators } from '../dashboard.schemas'

type Indicator = {
  label: string
  value: string
  hint: string
  tone: Tone
  icon: LucideIcon
  /** El listado de órdenes ya filtrado por lo que cuenta el indicador. */
  search?: LinkProps<'/workshop/work-orders'>['search']
}

const count = new Intl.NumberFormat('es-PE')

/**
 * Los indicadores de arriba del panel, en tarjetas pastel con el tono de cada
 * significado (`lib/tones.ts`). Los que tienen un listado detrás lo abren ya
 * filtrado. El valor entregado solo llega para el administrador: sin él, la
 * fila es de cinco.
 */
export function IndicatorCards({
  indicadores,
  isAdmin,
}: {
  indicadores: DashboardIndicators
  isAdmin: boolean
}) {
  const own = isAdmin ? '' : ' asignadas a ti'
  const items: Indicator[] = [
    {
      label: 'Abiertas',
      value: count.format(indicadores.abiertas),
      hint: `En el taller${own}`,
      tone: 'sky',
      icon: ClipboardListIcon,
      search: { ...defaultWorkOrdersSearch, estado: [...OPEN_STATUSES] },
    },
    {
      label: 'Esperando aprobación',
      value: count.format(indicadores.esperandoAprobacion),
      hint: 'Presupuesto con el cliente',
      tone: 'violet',
      icon: HourglassIcon,
      search: { ...defaultWorkOrdersSearch, estado: ['ESPERANDO_APROBACION'] },
    },
    {
      label: 'Listas para entregar',
      value: count.format(indicadores.listas),
      hint: 'Esperan al cliente',
      tone: 'emerald',
      icon: PackageCheckIcon,
      search: { ...defaultWorkOrdersSearch, estado: ['LISTO'] },
    },
    {
      label: 'Vencidas',
      value: count.format(indicadores.vencidas),
      hint: 'Pasó la fecha prometida',
      tone: 'rose',
      icon: AlarmClockIcon,
      search: { ...defaultWorkOrdersSearch, vencidas: true },
    },
    {
      label: 'Entregadas este mes',
      value: count.format(indicadores.entregadasMes),
      hint: isAdmin ? 'Desde el día 1' : 'Tuyas, desde el día 1',
      tone: 'amber',
      icon: CircleCheckBigIcon,
    },
  ]
  if (isAdmin && indicadores.valorEntregadoMes !== null) {
    items.push({
      label: 'Valor entregado del mes',
      value: formatMoney(indicadores.valorEntregadoMes),
      hint: 'Total de lo entregado',
      tone: 'emerald',
      icon: BanknoteIcon,
    })
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3',
        // Con el monto, seis por fila recién en pantallas anchas: en una de
        // 1280 px, con la barra lateral, «S/ 18,450.50» no entra en la tarjeta.
        items.length === 6 ? '2xl:grid-cols-6' : 'xl:grid-cols-5',
      )}
    >
      {items.map((item) => (
        <IndicatorCard key={item.label} {...item} />
      ))}
    </div>
  )
}

function IndicatorCard({
  label,
  value,
  hint,
  tone,
  icon: Icon,
  search,
}: Indicator) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            TONES[tone].chip,
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-sm leading-tight font-medium text-foreground/80">
          {label}
        </span>
      </div>
      <p
        className={cn(
          'text-xl font-semibold tracking-tight tabular-nums @[11rem]:text-2xl',
          TONES[tone].text,
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </>
  )
  const className = cn(
    '@container flex min-w-0 flex-col gap-2 rounded-xl border p-4',
    TONES[tone].soft,
    TONES[tone].border,
  )

  if (!search) return <div className={className}>{body}</div>
  return (
    <Link
      to="/workshop/work-orders"
      search={search}
      className={cn(
        className,
        'transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50',
      )}
    >
      {body}
    </Link>
  )
}
