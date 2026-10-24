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
import { useCreateTool, useUpdateTool } from '../tools.queries'
import {
  assigneeOption,
  emptyToolForm,
  toolFormSchema,
  toolStatusOptions,
  toolToForm,
} from '../tools.schemas'
import type { Tool } from '../tools.schemas'

// Solo se le entrega una herramienta a alguien activo.
const activeUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: true })

type ToolFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** La herramienta a editar; sin ella, el diálogo registra una nueva. */
  tool?: Tool
}

/** Alta y edición de una herramienta, en un diálogo sobre el listado. */
export function ToolFormDialog({
  open,
  onOpenChange,
  tool,
}: ToolFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tool ? 'Editar herramienta' : 'Nueva herramienta'}
          </DialogTitle>
          <DialogDescription>
            Sin asignar, la herramienta queda en el almacén.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores de la
            herramienta elegida, no con lo que quedó escrito la vez anterior. */}
        {open && <ToolForm tool={tool} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ToolForm({ tool, onDone }: { tool?: Tool; onDone: () => void }) {
  const create = useCreateTool()
  const update = useUpdateTool()
  const mutation = tool ? update : create

  const form = useAppForm({
    defaultValues: tool ? toolToForm(tool) : emptyToolForm,
    validators: { onChange: toolFormSchema },
    // Un rechazo de la API (código repetido, usuario inactivo) deja el diálogo
    // abierto con su mensaje y no se relanza: quedaría como error sin capturar
    // en la consola.
    onSubmit: ({ value }) =>
      (tool
        ? update.mutateAsync({ toolId: tool.toolId, values: value })
        : create.mutateAsync(value)
      ).then(onDone, () => undefined),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <form.AppField name="code">
            {(field) => (
              <field.TextField
                label="Código"
                autoFocus
                placeholder="HER-TORQ-01"
                className="uppercase"
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => <field.TextField label="Nombre" />}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="brand">
            {(field) => <field.TextField label="Marca (opcional)" />}
          </form.AppField>
          <form.AppField
            name="status"
            // Solo una herramienta operativa está asignada: al mandarla a
            // reparar o darla de baja, vuelve al almacén (como hace la API).
            listeners={{
              onChange: ({ value }) => {
                if (value !== 'AVAILABLE') {
                  form.setFieldValue('assignedToId', '')
                }
              },
            }}
          >
            {(field) => (
              <field.SelectField label="Estado" options={toolStatusOptions} />
            )}
          </form.AppField>
        </div>
        <form.Subscribe selector={(state) => state.values.status}>
          {(status) => (
            <form.AppField name="assignedToId">
              {(field) => (
                <field.ComboboxField
                  label="Asignada a"
                  placeholder="En el almacén"
                  searchPlaceholder="Buscar por nombre o correo"
                  emptyMessage="Nadie activo coincide"
                  clearLabel="Dejarla en el almacén"
                  optionsQuery={activeUserOptions}
                  selectedOption={
                    tool?.assignedTo
                      ? assigneeOption(tool.assignedTo)
                      : undefined
                  }
                  disabled={status !== 'AVAILABLE'}
                  description={
                    status === 'AVAILABLE'
                      ? 'Quién la tiene ahora. Vacío: en el almacén.'
                      : 'Solo una herramienta operativa se asigna: queda en el almacén.'
                  }
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>
        <form.AppField name="notes">
          {(field) => <field.TextareaField label="Notas (opcional)" rows={3} />}
        </form.AppField>
        {mutation.error && <FieldError>{mutation.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label={tool ? 'Guardar cambios' : 'Registrar'} />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
