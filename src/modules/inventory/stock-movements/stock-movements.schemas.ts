import { z } from 'zod'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { isDateOnly } from '#/lib/dates'
import { moneySchema } from '#/lib/money'
import { movementQuantitySchema } from '#/lib/quantity'
import { formatStock } from '#/modules/inventory/products/products.schemas'
import type { UnitOfMeasure } from '#/modules/inventory/products/products.schemas'
import type { components } from '#/types/api.gen'

/**
 * Un movimiento de stock: una línea del kardex. `unitCost` solo llega para el
 * administrador: la API no se lo manda al mecánico.
 */
export type StockMovement = components['schemas']['StockMovement']
export type StockMovementType = components['schemas']['StockMovementType']

export const STOCK_MOVEMENT_TYPES = [
  'PURCHASE',
  'WORK_ORDER',
  'ADJUSTMENT',
] as const satisfies readonly StockMovementType[]

/** Cómo se le muestra cada tipo de movimiento al usuario. */
export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  PURCHASE: 'Compra',
  WORK_ORDER: 'Consumo en orden',
  ADJUSTMENT: 'Ajuste',
}

/**
 * La cantidad de un movimiento con su signo y su unidad: «+12 und» entra,
 * «-2.50 L» sale. El signo va siempre, para que una entrada no se lea como
 * un saldo.
 */
export function formatMovementQuantity(
  quantity: string,
  unit: UnitOfMeasure,
): string {
  const text = formatStock(quantity, unit)
  return text === '—' || text.startsWith('-') ? text : `+${text}`
}

/** El largo máximo de la nota, el mismo que acepta la API. */
const NOTE_MAX_LENGTH = 500

const productIdField = z.string().min(1, 'Selecciona el producto')

/**
 * Una compra: entra mercadería y su costo pasa a ser el costo del producto.
 * La cantidad y el costo son texto, como los manejan `QuantityField` y
 * `MoneyField` y como los recibe la API.
 */
export const purchaseFormSchema = z.object({
  productId: productIdField,
  quantity: z
    .string()
    .trim()
    .min(1, 'Ingresa la cantidad')
    .pipe(movementQuantitySchema('La cantidad', { signed: false })),
  unitCost: z
    .string()
    .trim()
    .min(1, 'Ingresa el costo unitario')
    .pipe(moneySchema('El costo unitario')),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, 'La nota tiene como máximo 500 caracteres'),
})

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

/** Lo que se le manda a la API: la nota vacía como null. */
export const purchaseInputSchema = purchaseFormSchema.transform((value) => ({
  ...value,
  note: value.note || null,
}))

export type PurchaseInput = z.input<typeof purchaseInputSchema>

/**
 * Un ajuste: la cantidad lleva su signo (positiva suma, negativa resta) y el
 * motivo es obligatorio, porque un ajuste sin explicación es un número que
 * cambió sin rastro.
 */
export const adjustmentFormSchema = z.object({
  productId: productIdField,
  quantity: z
    .string()
    .trim()
    .min(1, 'Ingresa la cantidad')
    .pipe(movementQuantitySchema('La cantidad', { signed: true })),
  note: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo del ajuste')
    .max(NOTE_MAX_LENGTH, 'El motivo tiene como máximo 500 caracteres'),
})

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>

/** El formulario vacío de una compra, o con el producto ya elegido. */
export function emptyPurchaseForm(productId = ''): PurchaseFormValues {
  return { productId, quantity: '', unitCost: '', note: '' }
}

/** El formulario vacío de un ajuste, o con el producto ya elegido. */
export function emptyAdjustmentForm(productId = ''): AdjustmentFormValues {
  return { productId, quantity: '', note: '' }
}

export const STOCK_MOVEMENT_SORT_FIELDS = ['createdAt', 'quantity'] as const

// Un día AAAA-MM-DD que existe; cualquier otra cosa en la URL se descarta.
const dateOnly = z.string().refine(isDateOnly).optional().catch(undefined)

/**
 * La búsqueda, los filtros, el orden y la página del kardex, tal como viven
 * en la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor
 * por defecto en vez de romper la página. Por defecto, lo más reciente
 * primero.
 */
export const stockMovementsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(STOCK_MOVEMENT_TYPES).optional().catch(undefined),
  productId: z.uuid().optional().catch(undefined),
  from: dateOnly,
  to: dateOnly,
  sortBy: z.enum(STOCK_MOVEMENT_SORT_FIELDS).catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
})

export type StockMovementsSearch = z.infer<typeof stockMovementsSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultStockMovementsSearch: StockMovementsSearch =
  stockMovementsSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const STOCK_MOVEMENT_FILTERS_CLEARED = {
  search: undefined,
  type: undefined,
  productId: undefined,
  from: undefined,
  to: undefined,
  page: 1,
} satisfies Partial<StockMovementsSearch>
