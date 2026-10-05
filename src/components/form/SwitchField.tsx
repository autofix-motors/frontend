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
}: {
  label: string
  description?: string
  disabled?: boolean
}) {
  const field = useFieldContext<boolean>()

  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        disabled={disabled}
      />
    </Field>
  )
}
