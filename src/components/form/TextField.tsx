import type { ComponentProps } from 'react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { useFieldContext } from './context'

type TextFieldProps = {
  label: string
  description?: string
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>

/**
 * Campo de texto conectado al formulario. Se usa dentro de
 * `<form.AppField name="...">{(field) => <field.TextField label="..." />}`.
 * Muestra la etiqueta, el estado de validación asíncrona y los errores, para
 * que ningún formulario los tenga que repetir.
 */
export function TextField({ label, description, ...props }: TextFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={hasError}
      />
      {field.state.meta.isValidating ? (
        <FieldDescription>Verificando…</FieldDescription>
      ) : (
        description && <FieldDescription>{description}</FieldDescription>
      )}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
