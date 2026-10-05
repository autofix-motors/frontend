import { useEffect, useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { moneyError } from '#/lib/money'

// Como la búsqueda de la barra: se espera a que el usuario deje de escribir
// para no pedirle a la API una consulta por tecla.
const PRICE_DEBOUNCE_MS = 400

type PriceRange = { minPrice?: number; maxPrice?: number }

/** `undefined` si está vacío (sin filtro), `null` si no es un monto válido. */
function parsePrice(text: string): number | undefined | null {
  const value = text.trim()
  if (!value) return undefined
  return moneyError(value, 'El precio') ? null : Number(value)
}

const toText = (price: number | undefined) =>
  price === undefined ? '' : String(price)

/**
 * El filtro por rango de precio de la barra del catálogo: «desde» y «hasta»,
 * en soles, los dos opcionales. Solo se aplica un rango que la API acepta: un
 * monto mal escrito o un «desde» mayor que el «hasta» se marcan en rojo y no
 * cambian el listado.
 */
export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onChange,
}: PriceRange & { onChange: (range: PriceRange) => void }) {
  const [minText, setMinText] = useState(toText(minPrice))
  const [maxText, setMaxText] = useState(toText(maxPrice))

  // Si el rango cambia desde afuera («Limpiar», volver atrás en el
  // navegador), los cuadros lo reflejan.
  useEffect(() => setMinText(toText(minPrice)), [minPrice])
  useEffect(() => setMaxText(toText(maxPrice)), [maxPrice])

  const min = parsePrice(minText)
  const max = parsePrice(maxText)
  const isInverted =
    typeof min === 'number' && typeof max === 'number' && min > max
  const isValid = min !== null && max !== null && !isInverted

  useEffect(() => {
    if (!isValid || (min === minPrice && max === maxPrice)) return
    const timer = setTimeout(
      () => onChange({ minPrice: min, maxPrice: max }),
      PRICE_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [isValid, min, max, minPrice, maxPrice, onChange])

  return (
    <div className="flex items-center gap-1">
      <PriceInput
        label="Precio desde"
        placeholder="Desde"
        value={minText}
        onChange={setMinText}
        isInvalid={min === null}
      />
      <span className="text-muted-foreground">–</span>
      <PriceInput
        label="Precio hasta"
        placeholder="Hasta"
        value={maxText}
        onChange={setMaxText}
        isInvalid={max === null || isInverted}
        title={
          isInverted
            ? 'El «hasta» no puede ser menor que el «desde»'
            : undefined
        }
      />
    </div>
  )
}

function PriceInput({
  label,
  placeholder,
  value,
  onChange,
  isInvalid,
  title,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  isInvalid: boolean
  title?: string
}) {
  return (
    <InputGroup className="h-8 w-28">
      <InputGroupAddon>S/</InputGroupAddon>
      <InputGroupInput
        type="text"
        inputMode="decimal"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        // La coma se toma como punto decimal, igual que en MoneyField.
        onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        aria-invalid={isInvalid}
        title={title}
      />
    </InputGroup>
  )
}
