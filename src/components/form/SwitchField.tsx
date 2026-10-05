import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'
import { useFieldContext } from './context'

/**
 * Interruptor de sí o no conectado al formulario, para un booleano como
 * «Activo». La etiqueta va a la izquierda y el interruptor a la derecha.
 */
export function SwitchField({
  label,
  description,
  disabled,
  id,
}: {
  label: string
  description?: string
  disabled?: boolean
  /** Si la página tiene otro campo con el mismo nombre (ver TextareaField). */
  id?: string
}) {
  const field = useFieldContext<boolean>()
  const inputId = id ?? field.name

  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={inputId}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        disabled={disabled}
      />
    </Field>
  )
}
