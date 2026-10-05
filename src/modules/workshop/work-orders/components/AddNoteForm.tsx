import { useAppForm } from '#/components/form/form'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useAddWorkOrderNote } from '../work-orders.queries'
import { emptyNoteForm, noteFormSchema } from '../work-orders.schemas'

/**
 * Una nota en la línea de tiempo, sin cambiar el estado. Nace interna: que la
 * vea el cliente se elige a propósito. Sus campos llevan id propio: el diálogo
 * de cambio de estado, que se abre encima, tiene campos con el mismo nombre.
 */
export function AddNoteForm({ workOrderId }: { workOrderId: string }) {
  const add = useAddWorkOrderNote()

  const form = useAppForm({
    defaultValues: emptyNoteForm,
    validators: { onChange: noteFormSchema },
    // Si la API la rechaza, el mensaje queda debajo y no se relanza.
    onSubmit: ({ value, formApi }) =>
      add.mutateAsync({ workOrderId, values: value }).then(
        () => formApi.reset(),
        () => undefined,
      ),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-3">
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              id="timeline-note"
              label="Agregar una nota"
              placeholder="Se pidió el repuesto, el cliente llamó…"
              rows={2}
            />
          )}
        </form.AppField>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form.AppField name="isPublic">
            {(field) => (
              <field.SwitchField
                id="timeline-note-public"
                label="Lo ve el cliente"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton label="Agregar nota" pendingLabel="Agregando…" />
          </form.AppForm>
        </div>
        {add.error && <FieldError>{add.error.message}</FieldError>}
      </FieldGroup>
    </form>
  )
}
