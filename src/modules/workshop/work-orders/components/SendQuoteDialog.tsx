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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatMoney } from '#/lib/money'
import { useSendQuote } from '../work-orders.queries'
import {
  emptySendQuoteForm,
  formatItemQuantity,
  sendQuoteFormSchema,
} from '../work-orders.schemas'
import type { WorkOrderDetail } from '../work-orders.schemas'

/**
 * Confirmar el envío del presupuesto: muestra lo que se va a congelar (los
 * ítems de ahora y su total) y una nota opcional para el cliente, que va con
 * el total en su seguimiento.
 */
export function SendQuoteDialog({
  open,
  onOpenChange,
  workOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder: WorkOrderDetail
}) {
  // La versión que va a salir: la API la numera igual (la última + 1).
  const version = (workOrder.quotes[0]?.version ?? 0) + 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar presupuesto v{version}</DialogTitle>
          <DialogDescription>
            Se congelan los servicios y repuestos de ahora y su total. La orden
            pasa a «Esperando aprobación» y sus ítems no se cambian hasta
            registrar la respuesta del cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrder.items.map((item) => (
                <TableRow key={item.workOrderItemId}>
                  <TableCell className="whitespace-normal">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatItemQuantity(item)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="text-base font-semibold">
                <TableCell colSpan={2} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatMoney(workOrder.totals.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        {/* Se monta al abrir: la nota empieza vacía cada vez. */}
        {open && (
          <SendQuoteForm
            workOrderId={workOrder.workOrderId}
            version={version}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SendQuoteForm({
  workOrderId,
  version,
  onDone,
}: {
  workOrderId: string
  version: number
  onDone: () => void
}) {
  const send = useSendQuote()

  const form = useAppForm({
    defaultValues: emptySendQuoteForm,
    validators: { onChange: sendQuoteFormSchema },
    // Un rechazo de la API (la orden cambió de estado) deja el diálogo
    // abierto con su mensaje y no se relanza.
    onSubmit: ({ value }) =>
      send.mutateAsync({ workOrderId, ...value }).then(onDone, () => undefined),
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
              id="quote-note"
              label="Nota para el cliente (opcional)"
              description="La ve en su seguimiento, junto al total."
              placeholder="Incluye la mano de obra y los repuestos originales…"
              rows={3}
            />
          )}
        </form.AppField>
        {send.error && <FieldError>{send.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Volver
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton
              label={`Enviar presupuesto v${version}`}
              pendingLabel="Enviando…"
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
