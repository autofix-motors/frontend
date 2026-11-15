import type { components } from '#/types/api.gen'

/** El panel completo. Para el mecánico, lo de administración llega en null. */
export type Dashboard = components['schemas']['Dashboard']
export type DashboardIndicators = components['schemas']['DashboardIndicators']
export type DashboardStatusCount = components['schemas']['DashboardStatusCount']
export type DashboardMonthTrend = components['schemas']['DashboardMonthTrend']
export type DashboardMechanicLoad =
  components['schemas']['DashboardMechanicLoad']
export type DashboardServiceCount =
  components['schemas']['DashboardServiceCount']
export type DashboardAttentionOrder =
  components['schemas']['DashboardAttentionOrder']
export type DashboardLowStockProduct =
  components['schemas']['DashboardLowStockProduct']

// Fijos en vez de Intl: «sept.» o «sep» cambian según la versión de ICU, y el
// servidor y el navegador tienen que escribir lo mismo para no romper la
// hidratación.
const SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

/**
 * «nov 26» para un mes `AAAA-MM` de la tendencia. No pasa por `Date`: el mes
 * ya viene en la hora de Lima. Si no tiene la forma, lo devuelve tal cual.
 */
export function formatMonthShort(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  const name = match ? SHORT_MONTHS[Number(match[2]) - 1] : undefined
  return match && name ? `${name} ${match[1].slice(2)}` : month
}

const LONG_DATE = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  // El «hoy» del taller es el de Lima, el mismo con el que la API cuenta lo
  // vencido y lo entregado en el mes.
  timeZone: 'America/Lima',
})

/** «Domingo, 15 de noviembre de 2026»: la fecha de hoy en Lima, para el saludo. */
export function formatTodayInLima(now: Date = new Date()): string {
  const text = LONG_DATE.format(now)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Días entre dos fechas `AAAA-MM-DD` (positivo si `to` es posterior). */
function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) -
      Date.UTC(fromYear, fromMonth - 1, fromDay)) /
      86_400_000,
  )
}

/**
 * Cuánto le falta (o hace cuánto pasó) la fecha prometida de una orden, contado
 * desde `today` (`limaToday()`): «Venció hace 3 días», «Vence hoy», «Vence
 * mañana», «Vence en 2 días».
 */
export function dueLabel(fechaPrometida: string, today: string): string {
  const days = daysBetween(today, fechaPrometida)
  if (days < -1) return `Venció hace ${-days} días`
  if (days === -1) return 'Venció ayer'
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `Vence en ${days} días`
}

/** Si el panel no tiene nada que contar en sus gráficos (todo en cero). */
export function isTrendEmpty(tendencia: DashboardMonthTrend[]): boolean {
  return tendencia.every((month) => month.recibidas + month.entregadas === 0)
}

/**
 * El ancho de cada barra de una lista con barras (servicios más realizados),
 * en porcentaje del mayor. Nunca 0 para un valor positivo: una barra que no se
 * ve parece un dato que falta.
 */
export function barWidth(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.max(4, Math.round((value / max) * 100))
}
