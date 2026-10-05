import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
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
import { productsQueries } from '#/modules/inventory/products/products.queries'
import {
  UNIT_OF_MEASURE_SYMBOLS,
  formatStock,
  productOption,
} from '#/modules/inventory/products/products.schemas'
import type { Product } from '#/modules/inventory/products/products.schemas'
import {
  activeProductOptions,
  useCreatePurchase,
} from '../stock-movements.queries'
import {
  emptyPurchaseForm,
  purchaseFormSchema,
} from '../stock-movements.schemas'

type PurchaseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El producto ya elegido (desde su fila en Repuestos, o el del filtro). */
  product?: Product
}

/** Registrar una compra: entra mercadería y se actualiza el costo. */
export function PurchaseDialog({
  open,
  onOpenChange,
  product,
}: PurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
          <DialogDescription>
            Suma la cantidad al stock, y el costo de esta compra pasa a ser el
            costo del producto.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza vacía, no con lo que
            quedó escrito la vez anterior. */}
        {open && (
          <PurchaseForm product={product} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PurchaseForm({
  product,
  onDone,
}: {
  product?: Product
  onDone: () => void
}) {
  const create = useCreatePurchase()

  const form = useAppForm({
    defaultValues: emptyPurchaseForm(product?.productId),
    validators: { onChange: purchaseFormSchema },
    // Si la API lo rechaza (stock insuficiente, producto inactivo), el
    // diálogo sigue abierto con el mensaje de `create.error`. El error no se
    // relanza: handleSubmit lo devolvería como una promesa rechazada que nadie
    // espera, y quedaría como error sin capturar en la consola.
    onSubmit: ({ value }) =>
      create.mutateAsync(value).then(onDone, () => undefined),
  })

  // El producto elegido, con su unidad, su stock y su costo actuales.
  const productId = useStore(form.store, (state) => state.values.productId)
  const selected = useQuery({
    ...productsQueries.detail(productId),
    enabled: Boolean(productId),
  }).data

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField name="productId">
          {(field) => (
            <field.ComboboxField
              label="Producto"
              placeholder="Selecciona el producto"
              searchPlaceholder="Buscar por código, nombre o marca"
              emptyMessage="Ningún producto activo coincide"
              optionsQuery={activeProductOptions}
              selectedOption={product && productOption(product)}
            />
          )}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="quantity">
            {(field) => (
              <field.QuantityField
                label="Cantidad"
                unit={selected && UNIT_OF_MEASURE_SYMBOLS[selected.unit]}
                description={
                  selected &&
                  `Stock actual: ${formatStock(selected.stock, selected.unit)}`
                }
              />
            )}
          </form.AppField>
          <form.AppField name="unitCost">
            {(field) => (
              <field.MoneyField
                label="Costo unitario"
                description={
                  selected?.cost &&
                  `Costo actual: ${formatMoney(selected.cost)}`
                }
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label="Nota (opcional)"
              placeholder="Proveedor, número de factura…"
              rows={2}
            />
          )}
        </form.AppField>
        {create.error && <FieldError>{create.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label="Registrar compra" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
