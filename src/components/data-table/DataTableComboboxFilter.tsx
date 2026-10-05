import type { QueryKey } from '@tanstack/react-query'
import { AsyncCombobox } from '#/components/combobox/AsyncCombobox'
import type {
  ComboboxOption,
  ComboboxOptionsQuery,
} from '#/components/combobox/AsyncCombobox'

/**
 * Un filtro que busca su opción en la API, para cuando las opciones son
 * registros de otro módulo y no caben en una lista fija (filtrar vehículos
 * por cliente). `value` undefined es «todos»: no se filtra por este campo.
 */
export function DataTableComboboxFilter<TQueryKey extends QueryKey>({
  label,
  allLabel,
  value,
  selectedOption,
  optionsQuery,
  searchPlaceholder,
  onChange,
}: {
  label: string
  /** Lo que se muestra sin filtro, como «Todos los clientes». */
  allLabel: string
  value: string | undefined
  /** La opción del valor de la URL: viene de la API, no de la búsqueda. */
  selectedOption: ComboboxOption | undefined
  optionsQuery: ComboboxOptionsQuery<TQueryKey>
  searchPlaceholder: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <AsyncCombobox
      size="sm"
      aria-label={label}
      value={value}
      selectedOption={selectedOption}
      onChange={(option) => onChange(option?.value)}
      optionsQuery={optionsQuery}
      placeholder={allLabel}
      searchPlaceholder={searchPlaceholder}
      clearLabel={allLabel}
      className="w-auto max-w-64 min-w-44"
    />
  )
}
