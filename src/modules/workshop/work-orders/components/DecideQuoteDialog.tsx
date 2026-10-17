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
import { FieldDescription, FieldError, FieldGroup } from '#/components/ui/field'
import { formatMoney } from '#/lib/money'
import { useDecideQuote } from '../work-orders.queries'
import {
  CHANNEL_OPTIONS,
  DECISION_OPTIONS,
  QUOTE_DECISION_EFFECTS,
  decideQuoteFormSchema,
  emptyDecideQuoteForm,
} from '../work-orders.schemas'
import type { Quote } from '../work-orders.schemas'

/**
 * Registrar lo que respondió el cliente al presupuesto pendiente: aprobado o
 * rechazado, por dónde y una nota. El cliente no responde desde la página
 * pública: lo registra el administrador.
 */
export function DecideQuoteDialog({
  workOrderId,
  quote,
  onOpenChange,
}: {
  workOrderId: string
  /** La versión pendiente; sin ella, el diálogo está cerrado. */
  quote: Quote | undefined
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(quote)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {quote && (
          <>
            <DialogHeader>
              <DialogTitle>Respuesta del cliente</DialogTitle>
              <DialogDescription>
                Al presupuesto v{quote.version} por{' '}
                <strong className="text-foreground">
                  {formatMoney(quote.total)}
                </strong>
                . Se aprueba o se rechaza completo.
              </DialogDescription>
            </DialogHeader>
            {/* Se monta con cada versión: el formulario empieza vacío. */}
            <DecideQuoteForm
              key={quote.quoteId}
              workOrderId={workOrderId}
              quote={quote}
              onDone={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DecideQuoteForm({
  workOrderId,
  quote,
  onDone,
}: {
  workOrderId: string
  quote: Quote
  onDone: () => void
}) {
  const decide = useDecideQuote()

  const form = useAppForm({
    defaultValues: emptyDecideQuoteForm,
    validators: { onChange: decideQuoteFormSchema },
    // Un rechazo de la API (otro ya registró la respuesta) deja el diálogo
    // abierto con su mensaje y no se relanza.
    onSubmit: ({ value }) =>
      decide
        .mutateAsync({ workOrderId, quoteId: quote.quoteId, values: value })
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
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="decision">
            {(field) => (
              <field.SelectField
                label="El cliente"
                placeholder="Aprobó o rechazó"
                options={DECISION_OPTIONS}
              />
            )}
          </form.AppField>
          <form.AppField name="channel">
            {(field) => (
              <field.SelectField
                label="Respondió por"
                placeholder="Llamada, WhatsApp…"
                options={CHANNEL_OPTIONS}
              />
            )}
          </form.AppField>
        </div>
        <form.Subscribe selector={(state) => state.values.decision}>
          {(decision) =>
            decision && (
              <FieldDescription>
                {QUOTE_DECISION_EFFECTS[decision]}
              </FieldDescription>
            )
          }
        </form.Subscribe>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              id="decision-note"
              label="Nota (opcional)"
              description="Queda registrada con la respuesta, en el presupuesto."
              placeholder="Pidió que lo llamen antes de entregar…"
              rows={3}
            />
          )}
        </form.AppField>
        {decide.error && <FieldError>{decide.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Volver
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton
              label="Registrar respuesta"
              pendingLabel="Registrando…"
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
