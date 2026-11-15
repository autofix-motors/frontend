import { CoffeeIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import type { DashboardMechanicLoad } from '../dashboard.schemas'
import { MECHANIC_CHART_CONFIG } from './chart-colors'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

// Alto de cada fila: el gráfico crece con el equipo en vez de apretar las
// barras en un alto fijo.
const ROW_HEIGHT = 36

/**
 * Cuántas órdenes abiertas tiene cada mecánico, del más cargado al menos (en
 * el orden de la API). Las que no tienen mecánico van en «Sin asignar», en
 * gris: no son la carga de nadie, son trabajo por repartir.
 */
export function MechanicLoadChart({
  cargaMecanicos,
  className,
}: {
  cargaMecanicos: DashboardMechanicLoad[]
  className?: string
}) {
  const data = cargaMecanicos.map((row) => ({
    ...row,
    fill:
      row.usuarioId === null
        ? 'var(--color-sinAsignar)'
        : 'var(--color-abiertas)',
  }))
  const isEmpty = data.every((row) => row.abiertas === 0)

  return (
    <DashboardCard
      title="Carga por mecánico"
      description="Órdenes abiertas que tiene cada uno."
      className={className}
    >
      {isEmpty ? (
        <DashboardEmpty
          icon={CoffeeIcon}
          title="Nadie tiene órdenes abiertas"
          description="Cuando asignes una, aparecerá aquí."
        />
      ) : (
        <ChartContainer
          config={MECHANIC_CHART_CONFIG}
          className="aspect-auto w-full"
          style={{ height: Math.max(data.length * ROW_HEIGHT + 16, 120) }}
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
              dataKey="abiertas"
              allowDecimals={false}
              hide
            />
            <YAxis
              type="category"
              dataKey="nombre"
              tickLine={false}
              axisLine={false}
              width={130}
              tickFormatter={(name: string) =>
                name.length > 18 ? `${name.slice(0, 17)}…` : name
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="abiertas" radius={4} maxBarSize={24}>
              <LabelList
                dataKey="abiertas"
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
