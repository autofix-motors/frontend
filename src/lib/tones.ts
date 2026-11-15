// Los tonos pastel de la app. Un tono es un significado, no un adorno: el
// mismo color dice lo mismo en el menú, en el detalle de la orden y en el
// panel (Taller y vehículos en celeste, clientes en verde, inventario y fechas
// en ámbar, personal y administración en violeta, lo vencido en rosa).
//
// Las clases van escritas enteras a propósito: Tailwind solo genera las que
// encuentra literales en el código, así que `bg-${tone}-50` no funcionaría.

export type Tone = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose'

export type ToneClasses = {
  /** Fondo suave, para una tarjeta o una fila. */
  soft: string
  /** Borde del mismo tono que el fondo suave. */
  border: string
  /** Texto fuerte: el dato que se destaca sobre el fondo suave. */
  text: string
  /** El cuadrito o círculo que lleva un ícono. */
  chip: string
  /**
   * Fondo suave y texto del tono para el ítem actual de un menú de shadcn:
   * van con `data-active:` para reemplazar (vía `cn`) el `data-active:` de la
   * primitiva en vez de competir con él.
   */
  active: string
}

export const TONES: Record<Tone, ToneClasses> = {
  sky: {
    soft: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-900',
    text: 'text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
    active:
      'data-active:bg-sky-50 data-active:text-sky-700 dark:data-active:bg-sky-950/40 dark:data-active:text-sky-300',
  },
  emerald: {
    soft: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    active:
      'data-active:bg-emerald-50 data-active:text-emerald-700 dark:data-active:bg-emerald-950/40 dark:data-active:text-emerald-300',
  },
  amber: {
    soft: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    text: 'text-amber-700 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    active:
      'data-active:bg-amber-50 data-active:text-amber-700 dark:data-active:bg-amber-950/40 dark:data-active:text-amber-300',
  },
  violet: {
    soft: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-900',
    text: 'text-violet-700 dark:text-violet-300',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
    active:
      'data-active:bg-violet-50 data-active:text-violet-700 dark:data-active:bg-violet-950/40 dark:data-active:text-violet-300',
  },
  rose: {
    soft: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    text: 'text-rose-700 dark:text-rose-300',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    active:
      'data-active:bg-rose-50 data-active:text-rose-700 dark:data-active:bg-rose-950/40 dark:data-active:text-rose-300',
  },
}
