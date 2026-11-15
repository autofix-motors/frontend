import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import type { components } from '#/types/api.gen'

export type Customer = components['schemas']['Customer']
export type DocumentType = components['schemas']['TipoDocumento']

export const DOCUMENT_TYPES = [
  'DNI',
  'RUC',
  'CE',
  'PASAPORTE',
] as const satisfies readonly DocumentType[]

/** Cómo se le muestra cada tipo de documento al usuario. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'Carné de extranjería',
  PASAPORTE: 'Pasaporte',
}

export const documentTypeOptions = DOCUMENT_TYPES.map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value],
}))

/**
 * Un cliente como opción de un combobox: el nombre y, debajo, el documento,
 * que distingue a dos clientes con el mismo nombre. Sirve también para el
 * cliente resumido que trae un vehículo.
 */
export function customerOption(
  customer: Pick<
    Customer,
    'clienteId' | 'nombre' | 'tipoDocumento' | 'numeroDocumento'
  >,
): ComboboxOption {
  return {
    value: customer.clienteId,
    label: customer.nombre,
    description: `${DOCUMENT_TYPE_LABELS[customer.tipoDocumento]} ${customer.numeroDocumento}`,
  }
}

/** Igual que en el backend: mayúsculas y sin espacios, guiones ni puntos. */
export function normalizeDocumentNumber(value: string): string {
  return value.replace(/[\s.-]/g, '').toUpperCase()
}

// Las mismas reglas que valida la API (document-number.ts del backend), para
// avisar al momento en el formulario.
const DOCUMENT_RULES: Record<
  DocumentType,
  { pattern: RegExp; message: string }
> = {
  DNI: { pattern: /^\d{8}$/, message: 'El DNI tiene 8 dígitos' },
  RUC: {
    pattern: /^(10|15|16|17|20)\d{9}$/,
    message: 'El RUC tiene 11 dígitos y empieza en 10, 15, 16, 17 o 20',
  },
  CE: {
    pattern: /^[A-Z0-9]{6,12}$/,
    message: 'El carné de extranjería tiene de 6 a 12 letras o dígitos',
  },
  PASAPORTE: {
    pattern: /^[A-Z0-9]{6,12}$/,
    message: 'El pasaporte tiene de 6 a 12 letras o dígitos',
  },
}

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message)

/**
 * El formulario de un cliente. Todo es texto porque así lo maneja el
 * formulario; `toCustomerInput` lo convierte en lo que espera la API.
 */
export const customerFormSchema = z
  .object({
    tipoDocumento: z.enum(DOCUMENT_TYPES, {
      error: 'Selecciona el tipo de documento',
    }),
    numeroDocumento: z.string().trim().min(1, 'Ingresa el número de documento'),
    nombre: z
      .string()
      .trim()
      .min(1, 'Ingresa el nombre o la razón social')
      .max(150, 'El nombre tiene como máximo 150 caracteres'),
    telefono: z
      .string()
      .trim()
      .min(1, 'Ingresa el teléfono')
      .refine(
        (value) => /^\+?\d{6,15}$/.test(value.replace(/[\s()-]/g, '')),
        'El teléfono tiene de 6 a 15 dígitos y puede empezar con +',
      ),
    correo: z
      .string()
      .trim()
      .max(254, 'El correo es demasiado largo')
      .refine(
        (value) => !value || z.email().safeParse(value).success,
        'Ingresa un correo válido',
      ),
    direccion: optionalText(
      250,
      'La dirección tiene como máximo 250 caracteres',
    ),
    notas: optionalText(1000, 'Las notas tienen como máximo 1000 caracteres'),
    activo: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const rule = DOCUMENT_RULES[value.tipoDocumento]
    const number = normalizeDocumentNumber(value.numeroDocumento)
    if (number && !rule.pattern.test(number)) {
      ctx.addIssue({
        code: 'custom',
        path: ['numeroDocumento'],
        message: rule.message,
      })
    }
  })

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const emptyCustomerForm: CustomerFormValues = {
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  notas: '',
  activo: true,
}

/** Los valores del formulario para editar un cliente existente. */
export function customerToForm(customer: Customer): CustomerFormValues {
  return {
    tipoDocumento: customer.tipoDocumento,
    numeroDocumento: customer.numeroDocumento,
    nombre: customer.nombre,
    telefono: customer.telefono,
    correo: customer.correo ?? '',
    direccion: customer.direccion ?? '',
    notas: customer.notas ?? '',
    activo: customer.activo,
  }
}

/** Lo que se le manda a la API: lo vacío viaja como null para borrar el dato. */
export const customerInputSchema = customerFormSchema.transform((value) => ({
  ...value,
  numeroDocumento: normalizeDocumentNumber(value.numeroDocumento),
  correo: value.correo || null,
  direccion: value.direccion || null,
  notas: value.notas || null,
}))

export type CustomerInput = z.input<typeof customerInputSchema>

export const customerIdSchema = z.object({ clienteId: z.uuid() })

export const updateCustomerRequestSchema = z.object({
  clienteId: z.uuid(),
  values: customerInputSchema,
})

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const customersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  tipoDocumento: z.enum(DOCUMENT_TYPES).optional().catch(undefined),
  activo: z.boolean().optional().catch(undefined),
  ordenarPor: z.enum(['nombre', 'creadoEn']).catch('nombre'),
  sentido: z.enum(['asc', 'desc']).catch('asc'),
})

export type CustomersSearch = z.infer<typeof customersSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Ojo: Zod 4 omite las
 * claves opcionales que quedan `undefined`, así que aquí no aparecen `search`
 * ni los filtros.
 */
export const defaultCustomersSearch: CustomersSearch =
  customersSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual:
 * una clave que falta la dejaría como estaba.
 */
export const CUSTOMER_FILTERS_CLEARED = {
  search: undefined,
  tipoDocumento: undefined,
  activo: undefined,
  page: 1,
} satisfies Partial<CustomersSearch>
