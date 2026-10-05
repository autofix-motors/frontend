import type { QueryKey } from '@tanstack/react-query'
import { AsyncCombobox } from '#/components/combobox/AsyncCombobox'
import type {
  ComboboxOption,
  ComboboxOptionsQuery,
} from '#/components/combobox/AsyncCombobox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldContext } from './context'

type ComboboxFieldProps<TQueryKey extends QueryKey> = {
  label: string
  description?: string
  /** La consulta de opciones para un texto de búsqueda (ver `AsyncCombobox`). */
  optionsQuery: ComboboxOptionsQuery<TQueryKey>
  /** La opción del valor guardado, para mostrarla al editar. */
  selectedOption?: ComboboxOption
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  /**
   * Si el campo es opcional: ofrece quitar la elección con este texto (que
   * la herramienta quede en el almacén). El valor vuelve a ser vacío.
   */
  clearLabel?: string
  disabled?: boolean
}

/**
 * Elegir un registro de otro módulo buscándolo en la API (el cliente de un
 * vehículo). El valor del campo es el id, o vacío si no se eligió; la lista
 * pide a la API mientras se escribe, para no traer todos los registros.
 */
export function ComboboxField<TQueryKey extends QueryKey>({
  label,
  description,
  optionsQuery,
  selectedOption,
  placeholder = 'Selecciona una opción',
  searchPlaceholder = 'Buscar…',
  emptyMessage,
  clearLabel,
  disabled,
}: ComboboxFieldProps<TQueryKey>) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <AsyncCombobox
        id={field.name}
        value={field.state.value || undefined}
        selectedOption={selectedOption}
        onChange={(option) => field.handleChange(option?.value ?? '')}
        onClose={field.handleBlur}
        optionsQuery={optionsQuery}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        clearLabel={clearLabel}
        disabled={disabled}
        aria-invalid={hasError}
        className="w-full"
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
