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
import { productsQueries } from '#/modules/inventory/products/products.queries'
import {
  UNIT_OF_MEASURE_SYMBOLS,
  formatStock,
  productOption,
} from '#/modules/inventory/products/products.schemas'
import type { Product } from '#/modules/inventory/products/products.schemas'
import {
  activeProductOptions,
  useCreateAdjustment,
} from '../stock-movements.queries'
import {
  adjustmentFormSchema,
  emptyAdjustmentForm,
} from '../stock-movements.schemas'

type AdjustmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El producto ya elegido (el del filtro del kardex). */
  product?: Product
}

/**
 * Registrar un ajuste: el stock del sistema no cuadra con el almacén. Es
 * también la forma de corregir un movimiento mal registrado, que no se edita
 * ni se borra.
 */
export function AdjustmentDialog({
  open,
  onOpenChange,
  product,
}: AdjustmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar ajuste</DialogTitle>
          <DialogDescription>
            Corrige el stock cuando no cuadra con el almacén. Los movimientos no
            se editan ni se borran: un error también se corrige con un ajuste.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza vacía, no con lo que
            quedó escrito la vez anterior. */}
        {open && (
          <AdjustmentForm
            product={product}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdjustmentForm({
  product,
  onDone,
}: {
  product?: Product
  onDone: () => void
}) {
  const create = useCreateAdjustment()

  const form = useAppForm({
    defaultValues: emptyAdjustmentForm(product?.productId),
    validators: { onChange: adjustmentFormSchema },
    // Si la API lo rechaza (stock insuficiente, producto inactivo), el
    // diálogo sigue abierto con el mensaje de `create.error`. El error no se
    // relanza: handleSubmit lo devolvería como una promesa rechazada que nadie
    // espera, y quedaría como error sin capturar en la consola.
    onSubmit: ({ value }) =>
      create.mutateAsync(value).then(onDone, () => undefined),
  })

  // El producto elegido, con su unidad y su stock actual.
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
        <form.AppField name="quantity">
          {(field) => (
            <field.QuantityField
              label="Cantidad"
              placeholder="-2"
              unit={selected && UNIT_OF_MEASURE_SYMBOLS[selected.unit]}
              description={[
                'Positiva suma al stock; negativa resta (merma, faltante).',
                selected &&
                  `Stock actual: ${formatStock(selected.stock, selected.unit)}.`,
              ]
                .filter(Boolean)
                .join(' ')}
            />
          )}
        </form.AppField>
        <form.AppField name="note">
          {(field) => (
            <field.TextareaField
              label="Motivo"
              placeholder="Inventario físico, merma, envase roto…"
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
            <form.SubmitButton label="Registrar ajuste" />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
