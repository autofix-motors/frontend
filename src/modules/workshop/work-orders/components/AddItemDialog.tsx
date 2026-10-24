import { useStore } from '@tanstack/react-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import { productsQueries } from '#/modules/inventory/products/products.queries'
import {
  UNIT_OF_MEASURE_SYMBOLS,
  formatStock,
} from '#/modules/inventory/products/products.schemas'
import { serviceCatalogQueries } from '#/modules/workshop/service-catalog/service-catalog.queries'
import { useAddWorkOrderItem } from '../work-orders.queries'
import {
  addItemFormSchema,
  emptyAddItemForm,
  toAddItemRequest,
} from '../work-orders.schemas'
import type { ItemType } from '../work-orders.schemas'

type AddItemDialogProps = {
  workOrderId: string
  /** Qué se agrega; sin él, el diálogo está cerrado. */
  type: ItemType | undefined
  role: UserRole
  onOpenChange: (open: boolean) => void
}

const COPY: Record<ItemType, { title: string; description: string }> = {
  SERVICE: {
    title: 'Agregar servicio',
    description:
      'Un trabajo del catálogo. Su precio de mano de obra se copia a la orden.',
  },
  PRODUCT: {
    title: 'Agregar repuesto',
    description:
      'Un repuesto o insumo del inventario. Su cantidad se descuenta del stock al agregarlo.',
  },
}

// Solo se ofrece lo activo: la API no deja agregar un servicio o un repuesto
// inactivo (las opciones del catálogo ya son solo las activas).
const activeProductOptions = (search: string) =>
  productsQueries.options({ search, onlyActive: true })

/** Agregar un servicio o un repuesto a la orden. */
export function AddItemDialog({
  workOrderId,
  type,
  role,
  onOpenChange,
}: AddItemDialogProps) {
  return (
    <Dialog open={Boolean(type)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {type && (
          <>
            <DialogHeader>
              <DialogTitle>{COPY[type].title}</DialogTitle>
              <DialogDescription>{COPY[type].description}</DialogDescription>
            </DialogHeader>
            {/* Se monta con cada apertura: empieza vacío. */}
            <AddItemForm
              key={type}
              workOrderId={workOrderId}
              type={type}
              role={role}
              onDone={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddItemForm({
  workOrderId,
  type,
  role,
  onDone,
}: {
  workOrderId: string
  type: ItemType
  role: UserRole
  onDone: () => void
}) {
  const add = useAddWorkOrderItem()
  const queryClient = useQueryClient()
  const isAdmin = role === 'ADMIN'
  const isProduct = type === 'PRODUCT'

  const form = useAppForm({
    defaultValues: emptyAddItemForm,
    validators: { onChange: addItemFormSchema(type) },
    // Si la API lo rechaza (sin stock suficiente, la orden cambió de estado),
    // el diálogo sigue abierto con el mensaje y el error no se relanza.
    onSubmit: ({ value }) =>
      add
        .mutateAsync(toAddItemRequest(workOrderId, type, value))
        .then(onDone, () => undefined),
  })

  // Lo elegido, para la unidad, el stock y el precio sugerido.
  const sourceId = useStore(form.store, (state) => state.values.sourceId)
  const product = useQuery({
    ...productsQueries.detail(sourceId),
    enabled: isProduct && Boolean(sourceId),
  }).data
  const service = useQuery({
    ...serviceCatalogQueries.detail(sourceId),
    enabled: !isProduct && Boolean(sourceId),
  }).data
  const suggestedPrice = isProduct ? product?.price : service?.laborPrice

  /**
   * Al elegir, el administrador ve el precio y la descripción del original ya
   * escritos, para ajustarlos si hace falta. El mecánico no los toca: la API
   * copia los del original.
   */
  async function prefill(id: string) {
    if (!isAdmin || !id) return
    if (isProduct) {
      const chosen = await queryClient.fetchQuery(productsQueries.detail(id))
      form.setFieldValue('unitPrice', chosen.price)
      form.setFieldValue('description', `${chosen.code} · ${chosen.name}`)
    } else {
      const chosen = await queryClient.fetchQuery(
        serviceCatalogQueries.detail(id),
      )
      form.setFieldValue('unitPrice', chosen.laborPrice)
      form.setFieldValue('description', chosen.name)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.AppField
          name="sourceId"
          listeners={{
            onChange: ({ value }) => {
              add.reset()
              void prefill(value).catch(() => undefined)
            },
          }}
        >
          {(field) =>
            isProduct ? (
              <field.ComboboxField
                label="Repuesto"
                placeholder="Selecciona el repuesto"
                searchPlaceholder="Buscar por código, nombre o marca"
                emptyMessage="Ningún repuesto activo coincide"
                optionsQuery={activeProductOptions}
                description={
                  !isAdmin && product
                    ? `Precio: ${formatMoney(product.price)}`
                    : undefined
                }
              />
            ) : (
              <field.ComboboxField
                label="Servicio"
                placeholder="Selecciona el servicio"
                searchPlaceholder="Buscar por nombre"
                emptyMessage="Ningún servicio activo coincide"
                optionsQuery={serviceCatalogQueries.options}
                description={
                  !isAdmin && service
                    ? `Precio: ${formatMoney(service.laborPrice)}`
                    : undefined
                }
              />
            )
          }
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="quantity">
            {(field) => (
              <field.QuantityField
                label={isProduct ? 'Cantidad' : 'Veces'}
                unit={product && UNIT_OF_MEASURE_SYMBOLS[product.unit]}
                description={
                  product &&
                  `Stock disponible: ${formatStock(product.stock, product.unit)}`
                }
              />
            )}
          </form.AppField>
          {isAdmin && (
            <form.AppField name="unitPrice">
              {(field) => (
                <field.MoneyField
                  label="Precio unitario"
                  description={
                    suggestedPrice &&
                    `${isProduct ? 'Precio de venta' : 'Del catálogo'}: ${formatMoney(suggestedPrice)}${
                      product?.cost
                        ? ` · costo ${formatMoney(product.cost)}`
                        : ''
                    }`
                  }
                />
              )}
            </form.AppField>
          )}
        </div>
        {isAdmin && (
          <form.AppField name="description">
            {(field) => (
              <field.TextField
                label="Descripción"
                description="Lo que verá el cliente en el presupuesto y el cobro."
              />
            )}
          </form.AppField>
        )}
        {add.error && <FieldError>{add.error.message}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <form.AppForm>
            <form.SubmitButton label={COPY[type].title} />
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
