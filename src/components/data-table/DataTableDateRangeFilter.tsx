import { useEffect, useState } from 'react'
import { Input } from '#/components/ui/input'
import { isDateOnly } from '#/lib/dates'

// El selector de fecha cambia su valor con cada dígito del año que se teclea
// (0002, 0020, 0202, 2026): se espera a que el usuario termine para no pedirle
// a la API una consulta por tecla.
const DATE_DEBOUNCE_MS = 400

/** Un rango de días `AAAA-MM-DD`, los dos extremos opcionales e inclusivos. */
export type DateRange = { from?: string; to?: string }

/**
 * El filtro por rango de fechas de la barra de un listado: «del» y «al», los
 * dos opcionales. Los valores son días `AAAA-MM-DD`, como los recibe la API, y
 * no pasan por `Date`, así que el día no se corre por la zona horaria. Solo se
 * aplica un rango que la API acepta: un «del» posterior al «al» se marca en
 * rojo y no cambia el listado.
 */
export function DataTableDateRangeFilter({
  label,
  from,
  to,
  onChange,
}: DateRange & {
  /** Qué fecha se filtra, para los lectores de pantalla («Fecha»). */
  label: string
  onChange: (range: DateRange) => void
}) {
  const [fromText, setFromText] = useState(from ?? '')
  const [toText, setToText] = useState(to ?? '')

  // Si el rango cambia desde afuera («Limpiar», volver atrás en el
  // navegador), los cuadros lo reflejan.
  useEffect(() => setFromText(from ?? ''), [from])
  useEffect(() => setToText(to ?? ''), [to])

  // Un cuadro vacío es «sin límite» por ese lado.
  const nextFrom = fromText || undefined
  const nextTo = toText || undefined
  const isInverted = Boolean(nextFrom && nextTo && nextFrom > nextTo)
  const isValid =
    (!nextFrom || isDateOnly(nextFrom)) &&
    (!nextTo || isDateOnly(nextTo)) &&
    !isInverted

  useEffect(() => {
    if (!isValid || (nextFrom === from && nextTo === to)) return
    const timer = setTimeout(
      () => onChange({ from: nextFrom, to: nextTo }),
      DATE_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [isValid, nextFrom, nextTo, from, to, onChange])

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>Del</span>
      <Input
        type="date"
        aria-label={`${label} desde`}
        className="h-8 w-auto"
        value={fromText}
        max={toText || undefined}
        onChange={(e) => setFromText(e.target.value)}
      />
      <span>al</span>
      <Input
        type="date"
        aria-label={`${label} hasta`}
        className="h-8 w-auto"
        value={toText}
        min={fromText || undefined}
        onChange={(e) => setToText(e.target.value)}
        aria-invalid={isInverted}
        title={
          isInverted
            ? 'La fecha «al» no puede ser anterior a la fecha «del»'
            : undefined
        }
      />
    </div>
  )
}
