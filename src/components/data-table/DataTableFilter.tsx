import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

// El Select de Radix no admite un valor vacío: «todos» se representa con este
// valor y sale del filtro como `undefined`.
const ALL = '__all__'

export type FilterOption = { value: string; label: string }

/**
 * Un filtro de lista desplegable para la barra de un listado. `value`
 * undefined es «todos»: no se filtra por este campo.
 */
export function DataTableFilter({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string
  /** Lo que se muestra sin filtro, como «Todos los tipos». */
  allLabel: string
  options: FilterOption[]
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger size="sm" className="w-auto min-w-36" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
