import { z } from 'zod'
import { decimalError, groupThousands, parseDecimal } from './decimal'

// Las cantidades en la unidad de un producto (unidades, litros, galones…). La
// API las manda como texto con dos decimales («4.50») y las recibe como texto,
// igual que los montos.

/**
 * La cantidad para mostrar: «12» si es entera y «4.50» si tiene fracción, con
 * los miles agrupados («1,200»). Los decimales solo aparecen cuando dicen algo:
 * nadie tiene «12.00» filtros. Sin cantidad, o con una que no se entiende,
 * devuelve una raya.
 */
export function formatQuantity(
  value: string | number | null | undefined,
): string {
  const text = typeof value === 'number' ? value.toFixed(2) : value?.trim()
  const parts = text ? parseDecimal(text) : null
  if (!parts || parts.decimals.length > 2) return '—'
  const decimals = /^0*$/.test(parts.decimals)
    ? ''
    : `.${parts.decimals.padEnd(2, '0')}`
  return `${parts.sign}${groupThousands(parts.integer)}${decimals}`
}

/**
 * Por qué el texto no es una cantidad que acepte la API, o `null` si lo es: las
 * mismas reglas que `IsQuantity` del backend. `label` es el nombre del campo en
 * el mensaje («El stock mínimo»).
 */
export function quantityError(value: string, label: string): string | null {
  return decimalError(
    value,
    label,
    `${label} es una cantidad con hasta 2 decimales, por ejemplo 4.50`,
  )
}

/** Una cantidad de un formulario, como `moneySchema` con los montos. */
export const quantitySchema = (label: string) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = quantityError(value, label)
      if (message) ctx.addIssue({ code: 'custom', message })
    })

/**
 * Por qué el texto no es la cantidad de un movimiento de stock, o `null` si lo
 * es: las mismas reglas que `IsMovementQuantity` del backend. Nunca 0; sin
 * `signed` tiene que ser mayor que 0 (una compra) y con `signed` lleva su
 * signo (un ajuste).
 */
export function movementQuantityError(
  value: string,
  label: string,
  { signed }: { signed: boolean },
): string | null {
  // Sin signo, una negativa es lo mismo que un 0: no entra nada.
  const positive = `${label} tiene que ser mayor que 0`
  if (!signed && value.startsWith('-')) return positive
  const error = decimalError(
    value,
    label,
    signed
      ? `${label} es una cantidad con signo y hasta 2 decimales, por ejemplo -2.50`
      : `${label} es una cantidad con hasta 2 decimales, por ejemplo 4.50`,
    { signed },
  )
  if (error) return error
  // Ya se comprobó la forma: `Number` solo decide si es cero.
  if (Number(value) === 0) {
    return signed
      ? `${label} no puede ser 0: positiva suma al stock y negativa resta`
      : positive
  }
  return null
}

/** La cantidad de un movimiento de stock, como `quantitySchema`. */
export const movementQuantitySchema = (
  label: string,
  options: { signed: boolean },
) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = movementQuantityError(value, label, options)
      if (message) ctx.addIssue({ code: 'custom', message })
    })
