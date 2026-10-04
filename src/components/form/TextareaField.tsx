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
  ...props
}: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        {...props}
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
