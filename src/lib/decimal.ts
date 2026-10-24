// Los números con hasta dos decimales que la API maneja como texto: los montos
// en soles (`money.ts`) y las cantidades en la unidad de un producto
// (`quantity.ts`). En el backend van en columnas `Decimal(10, 2)`: hasta ocho
// dígitos enteros y dos decimales. Las reglas viven aquí una sola vez; cada
// archivo les pone su formato y sus mensajes.

const DECIMAL_TEXT = /^(-?)(\d+)(?:\.(\d+))?$/
const MAX_INTEGER_DIGITS = 8

/** Las partes de un texto decimal («-1250.5»), o `null` si no lo es. */
export function parseDecimal(
  text: string,
): { sign: string; integer: string; decimals: string } | null {
  const match = DECIMAL_TEXT.exec(text)
  if (!match) return null
  const [, sign, integer, decimals = ''] = match
  return { sign, integer, decimals }
}

/**
 * Por qué el texto no cabe en un `Decimal(10, 2)`, o `null` si cabe: las
 * mismas reglas que `decimalError` del backend, para avisar al momento.
 * `invalidMessage` es el mensaje para lo que ni siquiera tiene forma de
 * número. Sin `signed` exige que no sea negativo; con `signed` acepta el signo
 * (un ajuste de stock que resta).
 */
export function decimalError(
  value: string,
  label: string,
  invalidMessage: string,
  { signed = false }: { signed?: boolean } = {},
): string | null {
  const parts = parseDecimal(value)
  if (!parts) return invalidMessage
  if (parts.sign && !signed) return `${label} no puede ser negativo`
  if (parts.decimals.length > 2) return `${label} tiene como máximo 2 decimales`
  if (parts.integer.replace(/^0+(?=\d)/, '').length > MAX_INTEGER_DIGITS) {
    return signed
      ? `${label} va de -99999999.99 a 99999999.99`
      : `${label} es como máximo 99999999.99`
  }
  return null
}

/**
 * La parte entera con los miles agrupados con coma («1,250»), sin ceros a la
 * izquierda. A mano y sin `Intl`: el servidor y el navegador pueden traer datos
 * de idioma distintos, y el texto tiene que salir igual en los dos para que
 * React no se queje al hidratar.
 */
export function groupThousands(integer: string): string {
  return integer.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
