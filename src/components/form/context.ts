import { createFormHookContexts } from '@tanstack/react-form'

// Los contextos que conectan cada componente de campo con el formulario que lo
// contiene. Van en un archivo propio porque los importan los campos y el hook,
// y juntos formarían un ciclo de imports.
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
