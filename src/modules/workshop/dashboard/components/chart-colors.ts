import type { ChartConfig } from '#/components/ui/chart'
import { WORK_ORDER_STATUS_LABELS } from '#/modules/workshop/work-orders/work-orders.schemas'
import type { WorkOrderStatus } from '#/modules/workshop/work-orders/work-orders.schemas'

// Los colores de los gráficos del panel, con su versión para el modo oscuro
// (ChartContainer los escribe como `--color-<clave>` según el tema). Van en
// hex de la paleta de Tailwind y no como `var(--color-sky-300)`: Tailwind 4
// solo emite las variables de los colores que encuentra usados en una clase,
// y estos no lo están.
//
// Cada estado lleva el mismo color que su etiqueta (WORK_ORDER_STATUS_COLORS),
// en un paso más claro: el color sigue al estado en todo el panel.

const STATUS_COLORS: Record<WorkOrderStatus, { light: string; dark: string }> =
  {
    RECIBIDO: { light: '#94a3b8', dark: '#64748b' }, // slate 400 / 500
    EN_DIAGNOSTICO: { light: '#7dd3fc', dark: '#38bdf8' }, // sky 300 / 400
    ESPERANDO_APROBACION: { light: '#fcd34d', dark: '#fbbf24' }, // amber 300 / 400
    EN_REPARACION: { light: '#a5b4fc', dark: '#818cf8' }, // indigo 300 / 400
    ESPERANDO_REPUESTOS: { light: '#fdba74', dark: '#fb923c' }, // orange 300 / 400
    LISTO: { light: '#6ee7b7', dark: '#34d399' }, // emerald 300 / 400
    ENTREGADO: { light: '#cbd5e1', dark: '#475569' }, // slate 300 / 600
    CANCELADO: { light: '#fda4af', dark: '#fb7185' }, // rose 300 / 400
  }

/** Las barras de «Órdenes abiertas por estado»: una clave por estado. */
export const STATUS_CHART_CONFIG = {
  cantidad: { label: 'Órdenes' },
  ...Object.fromEntries(
    (Object.keys(STATUS_COLORS) as WorkOrderStatus[]).map((estado) => [
      estado,
      { label: WORK_ORDER_STATUS_LABELS[estado], theme: STATUS_COLORS[estado] },
    ]),
  ),
} satisfies ChartConfig

/**
 * Recibidas en celeste (el taller) y entregadas en verde (lo terminado). Más
 * oscuros que el resto porque son líneas finas: se comprobó que se distinguen
 * entre sí con daltonismo y contrastan con el fondo (2026-11-15).
 */
export const TREND_CHART_CONFIG = {
  recibidas: {
    label: 'Recibidas',
    theme: { light: '#0284c7', dark: '#0ea5e9' }, // sky 600 / 500
  },
  entregadas: {
    label: 'Entregadas',
    theme: { light: '#059669', dark: '#10b981' }, // emerald 600 / 500
  },
} satisfies ChartConfig

/** La carga del equipo en violeta (el personal); «Sin asignar», apagado. */
export const MECHANIC_CHART_CONFIG = {
  abiertas: {
    label: 'Órdenes abiertas',
    theme: { light: '#a78bfa', dark: '#8b5cf6' }, // violet 400 / 500
  },
  sinAsignar: {
    label: 'Sin asignar',
    theme: { light: '#cbd5e1', dark: '#475569' }, // slate 300 / 600
  },
} satisfies ChartConfig
