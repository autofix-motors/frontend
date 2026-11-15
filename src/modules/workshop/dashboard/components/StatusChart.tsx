import { PartyPopperIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import { WORK_ORDER_STATUS_LABELS } from '#/modules/workshop/work-orders/work-orders.schemas'
import type { DashboardStatusCount } from '../dashboard.schemas'
import { STATUS_CHART_CONFIG } from './chart-colors'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

/**
 * Las órdenes abiertas por estado, en barras horizontales y en el orden del
 * flujo (como las manda la API). Horizontales para que los nombres de los
 * estados se lean enteros también en un celular, sin girarlos ni cortarlos.
 */
export function StatusChart({
  porEstado,
  isAdmin,
  className,
}: {
  porEstado: DashboardStatusCount[]
  isAdmin: boolean
  className?: string
}) {
  const data = porEstado.map(({ estado, cantidad }) => ({
    estado,
    etiqueta: WORK_ORDER_STATUS_LABELS[estado],
    cantidad,
    fill: `var(--color-${estado})`,
  }))
  const isEmpty = data.every((row) => row.cantidad === 0)

  return (
    <DashboardCard
      title={isAdmin ? 'Órdenes abiertas por estado' : 'Mis órdenes por estado'}
      description="Dónde está cada orden que sigue en el taller."
      className={className}
    >
      {isEmpty ? (
        <DashboardEmpty
          icon={PartyPopperIcon}
          title="No hay órdenes abiertas"
          description="El taller está al día."
        />
      ) : (
        <ChartContainer
          config={STATUS_CHART_CONFIG}
          className="aspect-auto h-60 w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 32 }}
            barCategoryGap={6}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              dataKey="cantidad"
              allowDecimals={false}
              hide
            />
            <YAxis
              type="category"
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="estado" />}
            />
            <Bar dataKey="cantidad" radius={4} maxBarSize={28}>
              <LabelList
                dataKey="cantidad"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </DashboardCard>
  )
}
