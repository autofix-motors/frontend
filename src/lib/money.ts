// Los montos en soles. La API los manda como texto con dos decimales
// («1250.00», ver la regla de los Decimal en el backend) y los recibe como
// texto: aquí no pasan por un `number` que los redondee.

const MONEY_TEXT = /^(-?)(\d+)(?:\.(\d+))?$/
const MAX_INTEGER_DIGITS = 8

/**
 * «S/ 1,250.00» para un monto de la API. Agrupa los miles a mano, sin
 * `Intl`: el servidor y el navegador pueden traer datos de idioma distintos y
 * el texto tiene que salir igual en los dos para que React no se queje al
 * hidratar. Sin monto, o con uno que no se entiende, devuelve una raya.
 */
export function formatMoney(value: string | number | null | undefined): string {
  const text = typeof value === 'number' ? value.toFixed(2) : value?.trim()
  const match = text ? MONEY_TEXT.exec(text) : null
  if (!match || (match[3] ?? '').length > 2) return '—'
  const [, sign, integer, decimals = ''] = match
  const grouped = integer
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `S/ ${sign}${grouped}.${decimals.padEnd(2, '0')}`
}

/**
 * Por qué el texto no es un monto que acepte la API, o `null` si lo es: las
 * mismas reglas que `IsMoney` del backend (no negativo, hasta 2 decimales,
 * hasta 99999999.99), para avisar al momento. `label` es el nombre del campo
 * en el mensaje («El precio de mano de obra»).
 */
export function moneyError(value: string, label: string): string | null {
  const match = MONEY_TEXT.exec(value)
  if (!match) {
    return `${label} es un monto en soles con hasta 2 decimales, por ejemplo 120.50`
  }
  const [, sign, integer, decimals = ''] = match
  if (sign) return `${label} no puede ser negativo`
  if (decimals.length > 2) return `${label} tiene como máximo 2 decimales`
  if (integer.replace(/^0+(?=\d)/, '').length > MAX_INTEGER_DIGITS) {
    return `${label} es como máximo 99999999.99`
  }
  return null
}
