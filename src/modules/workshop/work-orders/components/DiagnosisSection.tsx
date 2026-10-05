import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useAppForm } from '#/components/form/form'
import { Button } from '#/components/ui/button'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { useUpdateWorkOrderDiagnosis } from '../work-orders.queries'
import { diagnosisFormSchema } from '../work-orders.schemas'

/**
 * El diagnóstico: lo que encontró el mecánico. Quien puede (el administrador
 * o el mecánico asignado, mientras la orden se trabaja) lo edita aquí mismo.
 */
export function DiagnosisSection({
  workOrderId,
  diagnosis,
  canEdit,
}: {
  workOrderId: string
  diagnosis: string | null
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)

  if (editing && canEdit) {
    return (
      <DiagnosisForm
        workOrderId={workOrderId}
        diagnosis={diagnosis}
        onDone={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {diagnosis ? (
        <p className="text-sm whitespace-pre-line">{diagnosis}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay diagnóstico.
        </p>
      )}
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setEditing(true)}
        >
          <PencilIcon />
          {diagnosis ? 'Editar diagnóstico' : 'Escribir diagnóstico'}
        </Button>
      )}
    </div>
  )
}

function DiagnosisForm({
  workOrderId,
  diagnosis,
  onDone,
}: {
  workOrderId: string
  diagnosis: string | null
  onDone: () => void
}) {
  const update = useUpdateWorkOrderDiagnosis()

  const form = useAppForm({
    defaultValues: { diagnosis: diagnosis ?? '' },
    validators: { onChange: diagnosisFormSchema },
    // Si la API lo rechaza (la orden cambió de estado), el mensaje queda
    // debajo y no se relanza.
    onSubmit: ({ value }) =>
      update
        .mutateAsync({ workOrderId, values: value })
        .then(onDone, () => undefined),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-3">
        <form.AppField name="diagnosis">
          {(field) => (
            <field.TextareaField
              label="Diagnóstico"
              placeholder="Lo que se encontró al revisar el vehículo"
              rows={5}
              autoFocus
            />
          )}
        </form.AppField>
        {update.error && <FieldError>{update.error.message}</FieldError>}
        <div className="flex gap-2">
          <form.AppForm>
            <form.SubmitButton label="Guardar diagnóstico" />
          </form.AppForm>
          <Button variant="outline" type="button" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
