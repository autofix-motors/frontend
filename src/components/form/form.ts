import { createFormHook } from '@tanstack/react-form'
import { ColorField } from './ColorField'
import { DateField } from './DateField'
import { SelectField } from './SelectField'
import { SubmitButton } from './SubmitButton'
import { TextField } from './TextField'
import { TextareaField } from './TextareaField'
import { fieldContext, formContext } from './context'

/**
 * El hook con el que se construye todo formulario de la app. Registra los campos y
 * botones propios una sola vez, para que cada formulario quede corto:
 *
 *   const form = useAppForm({ defaultValues, validators, onSubmit })
 *   <form.AppField name="name">{(f) => <f.TextField label="Nombre" />}</form.AppField>
 *
 * Un campo nuevo (NumberField, ComboboxField…) se crea en esta carpeta y se agrega
 * aquí, cuando lo necesite el primer formulario que lo use.
 */
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    SelectField,
    DateField,
    ColorField,
  },
  formComponents: { SubmitButton },
})
