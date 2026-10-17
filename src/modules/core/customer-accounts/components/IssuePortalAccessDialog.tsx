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
import { FieldError } from '#/components/ui/field'
import type { Customer } from '#/modules/customer/customers/customers.schemas'
import { useIssuePortalAccess } from '../customer-accounts.queries'
import type { PortalCredentials } from '../customer-accounts.schemas'

/**
 * Da acceso al portal o restablece su contraseña: en los dos casos el sistema
 * genera una temporal, que se muestra después para compartirla. Restablecer
 * deja sin efecto la anterior y cierra su sesión.
 */
export function IssuePortalAccessDialog({
  customer,
  onOpenChange,
  onIssued,
}: {
  /** Sin cliente, el diálogo está cerrado. */
  customer: Customer | undefined
  onOpenChange: (open: boolean) => void
  onIssued: (customer: Customer, credentials: PortalCredentials) => void
}) {
  const issue = useIssuePortalAccess()
  const isReset = Boolean(customer?.portalAccess)

  return (
    <Dialog
      open={Boolean(customer)}
      onOpenChange={(open) => {
        if (!open) issue.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isReset ? 'Restablecer contraseña del portal' : 'Dar acceso al portal'}
          </DialogTitle>
          <DialogDescription>
            {isReset
              ? `Se generará una contraseña temporal nueva para ${customer?.name ?? ''}: la anterior deja de servir y se cierra su sesión.`
              : `${customer?.name ?? ''} podrá seguir sus reparaciones y responder sus presupuestos. Se generará una contraseña temporal para compartirle; al entrar elegirá una propia.`}
          </DialogDescription>
        </DialogHeader>
        {issue.error && <FieldError>{issue.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={issue.isPending}
            onClick={() =>
              customer &&
              issue.mutate(customer.customerId, {
                onSuccess: ({ credentials }) => {
                  onOpenChange(false)
                  onIssued(customer, credentials)
                },
              })
            }
          >
            {issue.isPending ? 'Generando…' : 'Generar contraseña temporal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
