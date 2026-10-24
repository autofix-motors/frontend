import { useAppForm } from '#/components/form/form'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { formatMoney } from '#/lib/money'
import { useDecideMyQuote } from '../portal.queries'
import {
  PORTAL_DECISION_EFFECTS,
  portalDecisionFormSchema,
} from '../portal.schemas'
import type { PortalDecision, PortalQuote } from '../portal.schemas'

const TITLES: Record<PortalDecision, string> = {
  APPROVED: 'Aprobar el presupuesto',
  REJECTED: 'Rechazar el presupuesto',
}

/**
 * La respuesta del cliente a su presupuesto: aprobarlo o rechazarlo entero,
 * con una nota opcional para el taller. La decisión ya viene elegida por el
 * botón que la abrió; aquí se confirma.
 */
export function DecideMyQuoteDialog({
  workOrderId,
  quote,
  decision,
  onClose,
}: {
  workOrderId: string
  /** Sin presupuesto, el diálogo está cerrado. */
  quote: PortalQuote | undefined
  decision: PortalDecision
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(quote)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[decision]}</DialogTitle>
          <DialogDescription>
            Versión {quote?.version} por{' '}
            <strong>{quote ? formatMoney(quote.total) : ''}</strong>.{' '}
            {PORTAL_DECISION_EFFECTS[decision]}
          </DialogDescription>
        </DialogHeader>
        {quote && (
          <DecisionForm
            workOrderId={workOrderId}
            quote={quote}
            decision={decision}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DecisionForm({
  workOrderId,
  quote,
  decision,
  onDone,
}: {
  workOrderId: string
  quote: PortalQuote
  decision: PortalDecision
  onDone: () => void
}) {
  const decide = useDecideMyQuote()

  const form = useAppForm({
    defaultValues: { note: '' },
    validators: { onChange: portalDecisionFormSchema },
    // Un rechazo de la API (el taller ya registró la respuesta) queda en el
    // diálogo con su mensaje y no se relanza.
    onSubmit: ({ value }) =>
      decide
        .mutateAsync({
          workOrderId,
          quoteId: quote.quoteId,
          decision,
          note: value.note,
        })
        .then(onDone, () => undefined),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label="Nota para el taller (opcional)"
              rows={3}
              placeholder={
                decision === 'APPROVED'
                  ? 'Por ejemplo: llámenme antes de entregar'
                  : 'Por ejemplo: solo quiero el cambio de pastillas'
              }
            />
          )}
        </form.AppField>
        {decide.error && <FieldError>{decide.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton
              label={decision === 'APPROVED' ? 'Aprobar' : 'Rechazar'}
              pendingLabel="Enviando…"
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
