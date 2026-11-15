import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import type { components } from '#/types/api.gen'

export type Vehicle = components['schemas']['Vehicle']
export type VehicleBrand = components['schemas']['VehicleBrand']

/**
 * Un vehículo como opción de un combobox: la placa con la marca y el modelo, y
 * abajo el dueño, que es con quien se habla al recibirlo.
 */
export function vehicleOption(
  vehicle: Pick<
    Vehicle,
    'vehiculoId' | 'placa' | 'marca' | 'modelo' | 'cliente'
  >,
): ComboboxOption {
  return {
    value: vehicle.vehiculoId,
    label: `${vehicle.placa} · ${vehicle.marca} ${vehicle.modelo}`,
    description: vehicle.cliente.nombre,
  }
}

/** Igual que en el backend: mayúsculas y sin espacios ni guiones. */
export function normalizeIdentifier(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

// Las mismas reglas que valida la API (vehicle-identifiers.ts del backend),
// para avisar al momento en el formulario.
const PLATE_PATTERN = /^[A-Z0-9]{5,7}$/
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/
const MIN_YEAR = 1950

/** El año más alto que acepta la API: el siguiente al actual. */
export function maxVehicleYear(now = new Date()): number {
  return now.getFullYear() + 1
}

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message)

/**
 * El formulario de un vehículo. Todo es texto porque así lo maneja el
 * formulario (el año también: vacío es «sin año»); `vehicleInputSchema` lo
 * convierte en lo que espera la API.
 */
export const vehicleFormSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona el cliente'),
  placa: z
    .string()
    .trim()
    .min(1, 'Ingresa la placa')
    .refine(
      (value) => PLATE_PATTERN.test(normalizeIdentifier(value)),
      'La placa tiene de 5 a 7 letras o dígitos',
    ),
  marca: z
    .string()
    .trim()
    .min(1, 'Ingresa la marca')
    .max(60, 'La marca tiene como máximo 60 caracteres'),
  modelo: z
    .string()
    .trim()
    .min(1, 'Ingresa el modelo')
    .max(60, 'El modelo tiene como máximo 60 caracteres'),
  anio: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true
      const anio = Number(value)
      return (
        Number.isInteger(anio) && anio >= MIN_YEAR && anio <= maxVehicleYear()
      )
    }, `El año va de ${MIN_YEAR} a ${maxVehicleYear()}`),
  color: optionalText(40, 'El color tiene como máximo 40 caracteres'),
  vin: z.string().refine((value) => {
    const vin = normalizeIdentifier(value)
    return !vin || VIN_PATTERN.test(vin)
  }, 'El VIN tiene 17 letras o dígitos, sin I, O ni Q'),
  notas: optionalText(1000, 'Las notas tienen como máximo 1000 caracteres'),
})

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const emptyVehicleForm: VehicleFormValues = {
  clienteId: '',
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  color: '',
  vin: '',
  notas: '',
}

/** Los valores del formulario para editar un vehículo existente. */
export function vehicleToForm(vehicle: Vehicle): VehicleFormValues {
  return {
    clienteId: vehicle.clienteId,
    placa: vehicle.placa,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    anio: vehicle.anio === null ? '' : String(vehicle.anio),
    color: vehicle.color ?? '',
    vin: vehicle.vin ?? '',
    notas: vehicle.notas ?? '',
  }
}

/** Lo que se le manda a la API: lo vacío viaja como null para borrar el dato. */
export const vehicleInputSchema = vehicleFormSchema.transform((value) => ({
  ...value,
  placa: normalizeIdentifier(value.placa),
  anio: value.anio ? Number(value.anio) : null,
  color: value.color || null,
  vin: normalizeIdentifier(value.vin) || null,
  notas: value.notas || null,
}))

export type VehicleInput = z.input<typeof vehicleInputSchema>

export const vehicleIdSchema = z.object({ vehiculoId: z.uuid() })

export const updateVehicleRequestSchema = z.object({
  vehiculoId: z.uuid(),
  values: vehicleInputSchema,
})

export const VEHICLE_SORT_FIELDS = ['placa', 'marca', 'creadoEn'] as const

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const vehiclesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  clienteId: z.uuid().optional().catch(undefined),
  marca: z.string().trim().min(1).max(60).optional().catch(undefined),
  ordenarPor: z.enum(VEHICLE_SORT_FIELDS).catch('placa'),
  sentido: z.enum(['asc', 'desc']).catch('asc'),
})

export type VehiclesSearch = z.infer<typeof vehiclesSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultVehiclesSearch: VehiclesSearch = vehiclesSearchSchema.parse(
  {},
)

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const VEHICLE_FILTERS_CLEARED = {
  search: undefined,
  clienteId: undefined,
  marca: undefined,
  page: 1,
} satisfies Partial<VehiclesSearch>
