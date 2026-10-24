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
import { useDeleteServiceCatalogItem } from '../service-catalog.queries'
import type { ServiceCatalogItem } from '../service-catalog.schemas'

/**
 * Confirma el borrado de un servicio. El borrado es real: si el servicio ya se
 * usó en órdenes, la API lo impide y aquí se muestra por qué.
 */
export function DeleteServiceCatalogItemDialog({
  item,
  onOpenChange,
}: {
  /** El servicio a borrar; sin él, el diálogo está cerrado. */
  item: ServiceCatalogItem | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteServiceCatalogItem()

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar servicio</DialogTitle>
          <DialogDescription>
            Se eliminará <strong>{item?.name}</strong> del catálogo de forma
            definitiva. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!item || remove.isPending}
            onClick={() => {
              if (!item) return
              remove.mutate(item.serviceCatalogItemId, {
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
