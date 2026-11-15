import { WrenchIcon } from 'lucide-react'
import { barWidth } from '../dashboard.schemas'
import type { DashboardServiceCount } from '../dashboard.schemas'
import { DashboardCard, DashboardEmpty } from './DashboardCard'

/**
 * Los servicios más agregados a las órdenes del mes, como lista con una barra
 * debajo de cada nombre: los nombres son largos («Cambio de pastillas de
 * freno delanteras») y en el eje de un gráfico quedarían cortados.
 */
export function TopServicesList({
  serviciosTop,
  className,
}: {
  serviciosTop: DashboardServiceCount[]
  className?: string
}) {
  const max = Math.max(0, ...serviciosTop.map((service) => service.cantidad))

  return (
    <DashboardCard
      title="Servicios más realizados del mes"
      description="Los que más se agregaron a las órdenes recibidas este mes."
      className={className}
    >
      {serviciosTop.length === 0 ? (
        <DashboardEmpty
          icon={WrenchIcon}
          title="Aún no hay servicios este mes"
          description="Aparecerán cuando se agreguen a las órdenes."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {serviciosTop.map((service, index) => (
            <li key={service.nombre} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="mr-2 text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  {service.nombre}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {service.cantidad}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sky-300 dark:bg-sky-500"
                  style={{ width: `${barWidth(service.cantidad, max)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  )
}
