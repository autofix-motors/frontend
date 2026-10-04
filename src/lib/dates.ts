// Cómo se muestran las fechas de la API. Hay dos formas y no se mezclan: el día
// sin hora (`AAAA-MM-DD`, de las columnas de fecha) y la marca de tiempo (ISO
// 8601).

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * «05/10/2026» para un día `AAAA-MM-DD`. No pasa por `Date`: `new
 * Date('2026-10-05')` se lee en UTC y en Lima, que va cinco horas atrás,
 * mostraría el día anterior. Sin fecha devuelve una raya.
 */
export function formatDateOnly(value: string | null | undefined): string {
  const match = value ? DATE_ONLY.exec(value) : null
  if (!match) return '—'
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

const DATE_TIME = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  // Fija, para que el servidor y el navegador rendericen lo mismo y la obra se
  // lea siempre en la hora de Lima, que es la que usa la API para «hoy».
  timeZone: 'America/Lima',
})

/** «05/10/2026, 14:30» para una marca de tiempo ISO, en la hora de Lima. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME.format(date)
}
