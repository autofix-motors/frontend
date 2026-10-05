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
import { useCreateProduct, useUpdateProduct } from '../products.queries'
import {
  UNIT_OF_MEASURE_SYMBOLS,
  emptyProductForm,
  productFormSchema,
  productKindOptions,
  productToForm,
  unitOfMeasureOptions,
} from '../products.schemas'
import type { Product } from '../products.schemas'

type ProductFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** El producto a editar; sin él, el diálogo registra uno nuevo. */
  product?: Product
}

/** Alta y edición de un repuesto o insumo, en un diálogo sobre el listado. */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          {/* El stock no está en el formulario: solo lo mueven las compras,
              los consumos en órdenes y los ajustes, que lo explican en el
              kardex. */}
          <DialogDescription>
            {product
              ? 'El stock no se edita aquí: cambia con los movimientos (compras, consumos y ajustes).'
              : 'El producto empieza con stock 0. El stock entra registrando una compra en «Movimientos».'}
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir: cada apertura empieza con los valores del
            producto elegido, no con lo que quedó escrito la vez anterior. */}
        {open && (
          <ProductForm product={product} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProductForm({
  product,
  onDone,
}: {
  product?: Product
  onDone: () => void
}) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const mutation = product ? update : create

  const form = useAppForm({
    defaultValues: product ? productToForm(product) : emptyProductForm,
    validators: { onChange: productFormSchema },
    onSubmit: async ({ value }) => {
      if (product) {
        await update.mutateAsync({
          productId: product.productId,
          values: value,
        })
      } else {
        await create.mutateAsync(value)
      }
      onDone()
    },
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
                placeholder="FA-TOY-90915"
                className="uppercase"
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => <field.TextField label="Nombre" />}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <form.AppField name="kind">
            {(field) => (
              <field.SelectField label="Tipo" options={productKindOptions} />
            )}
          </form.AppField>
          <form.AppField name="unit">
            {(field) => (
              <field.SelectField
                label="Unidad"
                options={unitOfMeasureOptions}
              />
            )}
          </form.AppField>
          <form.AppField name="brand">
            {(field) => <field.TextField label="Marca (opcional)" />}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <form.Subscribe selector={(state) => state.values.unit}>
            {(unit) => (
              <form.AppField name="minStock">
                {(field) => (
                  <field.QuantityField
                    label="Stock mínimo"
                    unit={UNIT_OF_MEASURE_SYMBOLS[unit]}
                    description="Con el stock aquí o debajo, sale como stock bajo."
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
          <form.AppField name="cost">
            {(field) => (
              <field.MoneyField
                label="Costo"
                description="El de la última compra."
              />
            )}
          </form.AppField>
          <form.AppField name="price">
            {(field) => <field.MoneyField label="Precio de venta" />}
          </form.AppField>
        </div>
        <form.AppField name="isActive">
          {(field) => (
            <field.SwitchField
              label="Activo"
              description="Un producto inactivo deja de ofrecerse al armar órdenes."
            />
          )}
        </form.AppField>
        {mutation.error && <FieldError>{mutation.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton
              label={product ? 'Guardar cambios' : 'Registrar'}
            />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
