import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { moneySchema } from '#/lib/money'
import { formatQuantity, quantitySchema } from '#/lib/quantity'
import type { components } from '#/types/api.gen'

/**
 * Un repuesto o insumo. `cost` y `margin` solo llegan para el administrador:
 * la API no se los manda al mecánico.
 */
export type Product = components['schemas']['Product']
export type ProductKind = components['schemas']['ProductKind']
export type UnitOfMeasure = components['schemas']['UnitOfMeasure']

export const PRODUCT_KINDS = [
  'PART',
  'SUPPLY',
] as const satisfies readonly ProductKind[]

/** Cómo se le muestra cada tipo de producto al usuario. */
export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  PART: 'Repuesto',
  SUPPLY: 'Insumo',
}

export const productKindOptions = PRODUCT_KINDS.map((value) => ({
  value,
  label: PRODUCT_KIND_LABELS[value],
}))

export const UNITS_OF_MEASURE = [
  'UNIT',
  'LITER',
  'GALLON',
  'KIT',
  'METER',
] as const satisfies readonly UnitOfMeasure[]

/** El nombre de cada unidad, para elegirla en el formulario. */
export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  UNIT: 'Unidad',
  LITER: 'Litro',
  GALLON: 'Galón',
  KIT: 'Kit',
  METER: 'Metro',
}

/** La abreviatura de cada unidad, detrás de una cantidad («4.50 L»). */
export const UNIT_OF_MEASURE_SYMBOLS: Record<UnitOfMeasure, string> = {
  UNIT: 'und',
  LITER: 'L',
  GALLON: 'gal',
  KIT: 'kit',
  METER: 'm',
}

export const unitOfMeasureOptions = UNITS_OF_MEASURE.map((value) => ({
  value,
  label: UNIT_OF_MEASURE_LABELS[value],
}))

/**
 * Una cantidad con su unidad: «12 und», «4.50 L», «2 gal». Sin decimales si es
 * entera, como la escribiría alguien en el almacén.
 */
export function formatStock(value: string, unit: UnitOfMeasure): string {
  const quantity = formatQuantity(value)
  return quantity === '—'
    ? quantity
    : `${quantity} ${UNIT_OF_MEASURE_SYMBOLS[unit]}`
}

/**
 * Un producto como opción de un combobox: el código y el nombre, y debajo el
 * stock actual con su unidad, que es lo que se mira antes de registrar una
 * compra o un ajuste.
 */
export function productOption(
  product: Pick<Product, 'productId' | 'code' | 'name' | 'stock' | 'unit'>,
): ComboboxOption {
  return {
    value: product.productId,
    label: `${product.code} · ${product.name}`,
    description: `Stock: ${formatStock(product.stock, product.unit)}`,
  }
}

/**
 * El formulario de un producto. No hay stock: nace en 0 y solo lo cambian los
 * movimientos (compras, consumos y ajustes). Las cantidades y los montos son
 * texto, como los manejan `QuantityField` y `MoneyField` y como los recibe la
 * API: así no se pierden decimales.
 */
export const productFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Ingresa el código')
    .max(30, 'El código tiene como máximo 30 caracteres'),
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre del producto')
    .max(150, 'El nombre tiene como máximo 150 caracteres'),
  kind: z.enum(PRODUCT_KINDS, { error: 'Selecciona el tipo' }),
  unit: z.enum(UNITS_OF_MEASURE, { error: 'Selecciona la unidad' }),
  brand: z.string().trim().max(60, 'La marca tiene como máximo 60 caracteres'),
  minStock: z
    .string()
    .trim()
    .min(1, 'Ingresa el stock mínimo')
    .pipe(quantitySchema('El stock mínimo')),
  cost: z
    .string()
    .trim()
    .min(1, 'Ingresa el costo')
    .pipe(moneySchema('El costo')),
  price: z
    .string()
    .trim()
    .min(1, 'Ingresa el precio de venta')
    .pipe(moneySchema('El precio de venta')),
  isActive: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const emptyProductForm: ProductFormValues = {
  code: '',
  name: '',
  kind: 'PART',
  unit: 'UNIT',
  brand: '',
  minStock: '0',
  cost: '',
  price: '',
  isActive: true,
}

/**
 * Los valores del formulario para editar un producto existente. Solo edita el
 * administrador, que siempre recibe el costo.
 */
export function productToForm(product: Product): ProductFormValues {
  return {
    code: product.code,
    name: product.name,
    kind: product.kind,
    unit: product.unit,
    brand: product.brand ?? '',
    minStock: product.minStock,
    cost: product.cost ?? '',
    price: product.price,
    isActive: product.isActive,
  }
}

/**
 * Lo que se le manda a la API: el código en mayúsculas, como lo guarda ella, y
 * la marca vacía como null para borrarla.
 */
export const productInputSchema = productFormSchema.transform((value) => ({
  ...value,
  code: value.code.toUpperCase(),
  brand: value.brand || null,
}))

export type ProductInput = z.input<typeof productInputSchema>

export const productIdSchema = z.object({ productId: z.uuid() })

export const updateProductRequestSchema = z.object({
  productId: z.uuid(),
  values: productInputSchema,
})

export const PRODUCT_SORT_FIELDS = ['name', 'code', 'stock', 'price'] as const

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const productsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  kind: z.enum(PRODUCT_KINDS).optional().catch(undefined),
  isActive: z.boolean().optional().catch(undefined),
  lowStock: z.boolean().optional().catch(undefined),
  sortBy: z.enum(PRODUCT_SORT_FIELDS).catch('name'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc'),
})

export type ProductsSearch = z.infer<typeof productsSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultProductsSearch: ProductsSearch = productsSearchSchema.parse(
  {},
)

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const PRODUCT_FILTERS_CLEARED = {
  search: undefined,
  kind: undefined,
  isActive: undefined,
  lowStock: undefined,
  page: 1,
} satisfies Partial<ProductsSearch>
