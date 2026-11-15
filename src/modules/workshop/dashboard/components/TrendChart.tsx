import { CalendarRangeIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import { formatMonthShort, isTrendEmpty } from '../dashboard.schemas'
import type { DashboardMonthTrend } from '../dashboard.schemas'
import { TREND_CHART_CONFIG } from './chart-colors'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

/**
 * Las órdenes recibidas y entregadas de los últimos 6 meses. Si las entregadas
 * van por debajo de las recibidas mes tras mes, el taller está acumulando
 * trabajo.
 */
export function TrendChart({
  tendencia,
  isAdmin,
  className,
}: {
  tendencia: DashboardMonthTrend[]
  isAdmin: boolean
  className?: string
}) {
  const data = tendencia.map((month) => ({
    ...month,
    etiqueta: formatMonthShort(month.mes),
  }))

  return (
    <DashboardCard
      title="Recibidas vs. entregadas"
      description={
        isAdmin
          ? 'Órdenes del taller en los últimos 6 meses.'
          : 'Tus órdenes en los últimos 6 meses.'
      }
      className={className}
    >
      {isTrendEmpty(tendencia) ? (
        <DashboardEmpty
          icon={CalendarRangeIcon}
          title="Todavía no hay movimiento"
          description="Aquí verás las órdenes de cada mes."
        />
      ) : (
        <ChartContainer
          config={TREND_CHART_CONFIG}
          className="aspect-auto h-60 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 12, top: 8 }}
          >
            <defs>
              {(['recibidas', 'entregadas'] as const).map((key) => (
                <linearGradient
                  key={key}
                  id={`trend-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="recibidas"
              type="monotone"
              stroke="var(--color-recibidas)"
              strokeWidth={2}
              fill="url(#trend-recibidas)"
              dot={{ r: 3, fill: 'var(--color-recibidas)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Area
              dataKey="entregadas"
              type="monotone"
              stroke="var(--color-entregadas)"
              strokeWidth={2}
              fill="url(#trend-entregadas)"
              dot={{ r: 3, fill: 'var(--color-entregadas)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      )}
    </DashboardCard>
  )
}
