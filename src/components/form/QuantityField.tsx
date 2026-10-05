import type { ComponentProps } from 'react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { useFieldContext } from './context'

type QuantityFieldProps = {
  label: string
  description?: string
  /** La unidad que se muestra a la derecha («L», «und»), si se conoce. */
  unit?: string
} & Omit<
  ComponentProps<typeof InputGroupInput>,
  'value' | 'onChange' | 'onBlur' | 'type' | 'inputMode'
>

/**
 * Una cantidad en la unidad de un producto (4.50 litros, 12 unidades). Como
 * `MoneyField`: el valor es texto («4.50»), como lo recibe la API, con
 * teclado numérico y la coma tomada como punto, para no perder decimales ni
 * dejar el valor vacío mientras se escribe «4.».
 */
export function QuantityField({
  label,
  description,
  unit,
  ...props
}: QuantityFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          placeholder="0"
          {...props}
          type="text"
          inputMode="decimal"
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value.replace(',', '.'))}
          aria-invalid={hasError}
        />
        {unit && <InputGroupAddon align="inline-end">{unit}</InputGroupAddon>}
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
