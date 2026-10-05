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
import { useDeleteProduct } from '../products.queries'
import type { Product } from '../products.schemas'

/**
 * Confirma el borrado de un producto. El borrado es real: si el producto ya
 * tiene movimientos de stock o se usó en órdenes, la API lo impide y aquí se
 * muestra por qué.
 */
export function DeleteProductDialog({
  product,
  onOpenChange,
}: {
  /** El producto a borrar; sin él, el diálogo está cerrado. */
  product: Product | undefined
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteProduct()

  return (
    <Dialog
      open={Boolean(product)}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            Se eliminará{' '}
            <strong>
              {product?.code} · {product?.name}
            </strong>{' '}
            de forma definitiva. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {remove.error && <FieldError>{remove.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!product || remove.isPending}
            onClick={() => {
              if (!product) return
              remove.mutate(product.productId, {
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
