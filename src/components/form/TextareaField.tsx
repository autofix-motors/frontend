import type { ComponentProps } from 'react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Textarea } from '#/components/ui/textarea'
import { useFieldContext } from './context'

type TextareaFieldProps = {
  label: string
  description?: string
} & Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'onBlur'>

/** Texto de varias líneas conectado al formulario: notas y descripciones. */
export function TextareaField({
  label,
  description,
  id,
  ...props
}: TextareaFieldProps) {
  const field = useFieldContext<string>()
  // El id es el nombre del campo, salvo que la página tenga dos formularios
  // con un campo del mismo nombre (la nota del detalle de una orden y la del
  // cambio de estado): ahí cada uno pasa el suyo para que su etiqueta no
  // apunte al otro.
  const inputId = id ?? field.name
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea
        {...props}
        id={inputId}
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
