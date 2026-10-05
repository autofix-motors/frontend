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
import { usersQueries } from '#/modules/core/users/users.queries'
import { useAssignTool } from '../tools.queries'
import { assignToolFormSchema, assigneeOption } from '../tools.schemas'
import type { Tool } from '../tools.schemas'

const activeUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: true })

/**
 * La acción rápida del listado: entregar una herramienta a alguien (o
 * pasársela a otro) sin abrir el formulario completo.
 */
export function AssignToolDialog({
  tool,
  onOpenChange,
}: {
  /** La herramienta a entregar; sin ella, el diálogo está cerrado. */
  tool: Tool | undefined
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(tool)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tool?.assignedTo ? 'Reasignar herramienta' : 'Asignar herramienta'}
          </DialogTitle>
          <DialogDescription>
            <strong>
              {tool?.code} · {tool?.name}
            </strong>
            {tool?.assignedTo
              ? `, que ahora tiene ${tool.assignedTo.name}.`
              : ', que está en el almacén.'}
          </DialogDescription>
        </DialogHeader>
        {tool && <AssignForm tool={tool} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function AssignForm({ tool, onDone }: { tool: Tool; onDone: () => void }) {
  const assign = useAssignTool()

  const form = useAppForm({
    defaultValues: { assignedToId: tool.assignedTo?.userId ?? '' },
    validators: { onChange: assignToolFormSchema },
    // El rechazo de la API (usuario inactivo) se muestra en el diálogo y no se
    // relanza.
    onSubmit: ({ value }) =>
      assign
        .mutateAsync({ toolId: tool.toolId, assignedToId: value.assignedToId })
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
        <form.AppField name="assignedToId">
          {(field) => (
            <field.ComboboxField
              label="Entregar a"
              placeholder="Selecciona a quién"
              searchPlaceholder="Buscar por nombre o correo"
              emptyMessage="Nadie activo coincide"
              optionsQuery={activeUserOptions}
              selectedOption={
                tool.assignedTo ? assigneeOption(tool.assignedTo) : undefined
              }
            />
          )}
        </form.AppField>
        {assign.error && <FieldError>{assign.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Asignar" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
