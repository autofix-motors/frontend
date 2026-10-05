import { z } from 'zod'
import { decimalError, groupThousands, parseDecimal } from './decimal'

// Los montos en soles. La API los manda como texto con dos decimales
// («1250.00», ver la regla de los Decimal en el backend) y los recibe como
// texto: aquí no pasan por un `number` que los redondee.

/**
 * «S/ 1,250.00» para un monto de la API. Sin monto, o con uno que no se
 * entiende, devuelve una raya.
 */
export function formatMoney(value: string | number | null | undefined): string {
  const text = typeof value === 'number' ? value.toFixed(2) : value?.trim()
  const parts = text ? parseDecimal(text) : null
  if (!parts || parts.decimals.length > 2) return '—'
  return `S/ ${parts.sign}${groupThousands(parts.integer)}.${parts.decimals.padEnd(2, '0')}`
}

/**
 * Por qué el texto no es un monto que acepte la API, o `null` si lo es: las
 * mismas reglas que `IsMoney` del backend (no negativo, hasta 2 decimales,
 * hasta 99999999.99), para avisar al momento. `label` es el nombre del campo
 * en el mensaje («El precio de mano de obra»).
 */
export function moneyError(value: string, label: string): string | null {
  return decimalError(
    value,
    label,
    `${label} es un monto en soles con hasta 2 decimales, por ejemplo 120.50`,
  )
}

/**
 * Un monto de un formulario, con el mensaje de `moneyError` si no lo es. Se
 * encadena detrás del chequeo de vacío del campo:
 * `z.string().trim().min(1, 'Ingresa…').pipe(moneySchema('El costo'))`.
 */
export const moneySchema = (label: string) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = moneyError(value, label)
      if (message) ctx.addIssue({ code: 'custom', message })
    })
