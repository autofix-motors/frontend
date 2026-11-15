import type { Dashboard } from '../dashboard.schemas'
import { AttentionList } from './AttentionList'
import { IndicatorCards } from './IndicatorCards'
import { LowStockList } from './LowStockList'
import { MechanicLoadChart } from './MechanicLoadChart'
import { StatusChart } from './StatusChart'
import { TopServicesList } from './TopServicesList'
import { TrendChart } from './TrendChart'

/**
 * El panel de inicio. El administrador ve todo el taller: indicadores con el
 * valor entregado, los gráficos, la carga del equipo, los servicios del mes y
 * las dos listas para actuar (órdenes y stock). El mecánico, solo lo suyo: lo
 * de administración le llega en null y aquí no se dibuja, en vez de dejarle
 * tarjetas vacías.
 *
 * Cuadrícula de 12 columnas en pantallas anchas, de 2 en tabletas y apilada en
 * el celular.
 */
export function DashboardView({
  dashboard,
  isAdmin,
}: {
  dashboard: Dashboard
  isAdmin: boolean
}) {
  const {
    indicadores,
    porEstado,
    tendencia,
    cargaMecanicos,
    serviciosTop,
    atencion,
    productosStockBajo,
  } = dashboard

  return (
    <div className="flex flex-col gap-4">
      <IndicatorCards indicadores={indicadores} isAdmin={isAdmin} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <StatusChart
          porEstado={porEstado}
          isAdmin={isAdmin}
          className="xl:col-span-5"
        />
        <TrendChart
          tendencia={tendencia}
          isAdmin={isAdmin}
          className="xl:col-span-7"
        />
        {isAdmin && cargaMecanicos && (
          <MechanicLoadChart
            cargaMecanicos={cargaMecanicos}
            className="xl:col-span-6"
          />
        )}
        {isAdmin && serviciosTop && (
          <TopServicesList
            serviciosTop={serviciosTop}
            className="xl:col-span-6"
          />
        )}
        <AttentionList
          atencion={atencion}
          vencidas={indicadores.vencidas}
          isAdmin={isAdmin}
          className={
            isAdmin && productosStockBajo
              ? 'xl:col-span-7'
              : 'md:col-span-2 xl:col-span-12'
          }
        />
        {isAdmin && productosStockBajo && (
          <LowStockList
            productosStockBajo={productosStockBajo}
            stockBajo={indicadores.stockBajo ?? productosStockBajo.length}
            className="xl:col-span-5"
          />
        )}
      </div>
    </div>
  )
}
