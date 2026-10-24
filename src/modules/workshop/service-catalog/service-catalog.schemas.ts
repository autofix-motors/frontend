import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { formatMoney, moneyError, moneySchema } from '#/lib/money'
import type { components } from '#/types/api.gen'

export type ServiceCatalogItem = components['schemas']['ServiceCatalogItem']

/**
 * El formulario de un servicio. El precio es texto, como lo maneja
 * `MoneyField` y como lo recibe la API: así no se pierden decimales.
 */
export const serviceCatalogItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre del servicio')
    .max(120, 'El nombre tiene como máximo 120 caracteres'),
  laborPrice: z
    .string()
    .trim()
    .min(1, 'Ingresa el precio de mano de obra')
    .pipe(moneySchema('El precio de mano de obra')),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción tiene como máximo 1000 caracteres'),
  isActive: z.boolean(),
})

export type ServiceCatalogItemFormValues = z.infer<
  typeof serviceCatalogItemFormSchema
>

export const emptyServiceCatalogItemForm: ServiceCatalogItemFormValues = {
  name: '',
  laborPrice: '',
  description: '',
  isActive: true,
}

/** Los valores del formulario para editar un servicio existente. */
export function serviceCatalogItemToForm(
  item: ServiceCatalogItem,
): ServiceCatalogItemFormValues {
  return {
    name: item.name,
    laborPrice: item.laborPrice,
    description: item.description ?? '',
    isActive: item.isActive,
  }
}

/** Lo que se le manda a la API: la descripción vacía viaja como null. */
export const serviceCatalogItemInputSchema =
  serviceCatalogItemFormSchema.transform((value) => ({
    ...value,
    description: value.description || null,
  }))

export type ServiceCatalogItemInput = z.input<
  typeof serviceCatalogItemInputSchema
>

/**
 * Un servicio como opción de un combobox: su nombre, y debajo el precio de
 * mano de obra, que es el que se sugiere al agregarlo a una orden.
 */
export function serviceCatalogItemOption(
  item: Pick<
    ServiceCatalogItem,
    'serviceCatalogItemId' | 'name' | 'laborPrice'
  >,
): ComboboxOption {
  return {
    value: item.serviceCatalogItemId,
    label: item.name,
    description: `Mano de obra: ${formatMoney(item.laborPrice)}`,
  }
}

export const serviceCatalogItemIdSchema = z.object({
  serviceCatalogItemId: z.uuid(),
})

export const updateServiceCatalogItemRequestSchema = z.object({
  serviceCatalogItemId: z.uuid(),
  values: serviceCatalogItemInputSchema,
})

export const SERVICE_CATALOG_SORT_FIELDS = [
  'name',
  'laborPrice',
  'createdAt',
] as const

// Un precio del filtro en la URL. El router guarda los números como números
// (`?minPrice=50`), así que se valida el número y se le exigen las mismas
// reglas que a un monto: un valor que la API rechazaría cae a «sin filtro».
const priceParam = z
  .number()
  .refine((price) => moneyError(String(price), 'El precio') === null)
  .optional()
  .catch(undefined)

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const serviceCatalogSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  isActive: z.boolean().optional().catch(undefined),
  minPrice: priceParam,
  maxPrice: priceParam,
  sortBy: z.enum(SERVICE_CATALOG_SORT_FIELDS).catch('name'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc'),
})

export type ServiceCatalogSearch = z.infer<typeof serviceCatalogSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultServiceCatalogSearch: ServiceCatalogSearch =
  serviceCatalogSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const SERVICE_CATALOG_FILTERS_CLEARED = {
  search: undefined,
  isActive: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  page: 1,
} satisfies Partial<ServiceCatalogSearch>
