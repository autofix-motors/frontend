import type { ComponentProps } from 'react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { useFieldContext } from './context'

type DateFieldProps = {
  label: string
  description?: string
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'type'>

/**
 * Un día, sin hora. El valor es la cadena `AAAA-MM-DD` que pide la API, o vacío
 * si no hay fecha: es lo mismo que entrega el selector del navegador, así que
 * no pasa por `Date` y el día no se corre por la zona horaria.
 */
export function DateField({ label, description, ...props }: DateFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        type="date"
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={hasError}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
