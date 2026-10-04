import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useFieldContext } from './context'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  label: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

/**
 * Lista desplegable conectada al formulario, para enums y catálogos. El Select
 * de shadcn es controlado: se conecta igual que un Input, sin envoltorios.
 */
export function SelectField({
  label,
  options,
  placeholder = 'Selecciona una opción',
  disabled,
}: SelectFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={field.name}
          aria-invalid={hasError}
          onBlur={field.handleBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
