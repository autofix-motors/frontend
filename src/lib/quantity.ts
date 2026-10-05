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
