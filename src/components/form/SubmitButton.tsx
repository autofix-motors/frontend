import { Button } from '#/components/ui/button'
import { useFormContext } from './context'

/**
 * Botón de envío que se desactiva mientras el formulario no es válido o se está
 * guardando. Se suscribe solo a esos dos datos, así que teclear en un campo no
 * lo vuelve a renderizar. Se usa como `<form.AppForm><form.SubmitButton /></form.AppForm>`.
 */
export function SubmitButton({
  label = 'Guardar',
  pendingLabel = 'Guardando…',
}: {
  label?: string
  pendingLabel?: string
}) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting] as const}
    >
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? pendingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  )
}
