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

type MoneyFieldProps = {
  label: string
  description?: string
} & Omit<
  ComponentProps<typeof InputGroupInput>,
  'value' | 'onChange' | 'onBlur' | 'type' | 'inputMode'
>

/**
 * Un monto en soles, con el prefijo «S/». El valor es texto («120.50»), como
 * lo recibe la API: un `number` perdería el cero de «120.50» al volver a
 * mostrarse y redondearía en silencio. Es `type="text"` con teclado numérico, y
 * no `type="number"`, porque este último deja el valor vacío mientras se
 * escribe algo a medias («12.») y el navegador valida a su manera, en su
 * idioma. La coma se cambia por punto: es la que ponen muchos teclados en
 * español.
 */
export function MoneyField({ label, description, ...props }: MoneyFieldProps) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupAddon>S/</InputGroupAddon>
        <InputGroupInput
          placeholder="0.00"
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
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {hasError && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
