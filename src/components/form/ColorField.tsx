import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { useFieldContext } from './context'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

/**
 * Un color `#RRGGBB`: el selector del navegador y el código al lado, para
 * pegarlo desde el manual de marca. El valor vacío significa «sin color».
 */
export function ColorField({
  label,
  description,
  disabled,
}: {
  label: string
  description?: string
  disabled?: boolean
}) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid
  const value = field.state.value

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: elegir`}
          // El selector nativo no acepta vacío: muestra negro hasta que se elige.
          value={HEX_COLOR.test(value) ? value : '#000000'}
          onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
          disabled={disabled}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          id={field.name}
          name={field.name}
          value={value}
          placeholder="#1F6FEB"
          maxLength={7}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={hasError}
          disabled={disabled}
          className="font-mono"
        />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
