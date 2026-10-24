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
import { useDeleteTool } from '../tools.queries'
import type { Tool } from '../tools.schemas'

/**
 * Confirma el borrado de una herramienta. El borrado es real; si alguien la
 * tiene, la API lo impide (primero se devuelve al almacén) y aquí se muestra
 * por qué.
 */
export function DeleteToolDialog({
  tool,
  onOpenChange,
}: {
  /** La herramienta a borrar; sin ella, el diálogo está cerrado. */
  tool: Tool | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteTool()

  return (
    <Dialog
      open={Boolean(tool)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar herramienta</DialogTitle>
          <DialogDescription>
            Se eliminará{' '}
            <strong>
              {tool?.code} · {tool?.name}
            </strong>{' '}
            de forma definitiva. Esta acción no se puede deshacer. Si solo dejó
            de usarse, puedes marcarla «De baja».
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!tool || remove.isPending}
            onClick={() => {
              if (!tool) return
              remove.mutate(tool.toolId, {
                onSuccess: () => onOpenChange(false),
              })
            }}
          >
            {remove.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
