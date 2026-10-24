import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import type { components } from '#/types/api.gen'

/** Una herramienta, con quién la tiene (`assignedTo`, null en el almacén). */
export type Tool = components['schemas']['Tool']
export type ToolStatus = components['schemas']['ToolStatus']
export type ToolAssignee = components['schemas']['ToolAssignee']

export const TOOL_STATUSES = [
  'AVAILABLE',
  'IN_REPAIR',
  'RETIRED',
] as const satisfies readonly ToolStatus[]

/** Cómo se le muestra cada estado al usuario. */
export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
  AVAILABLE: 'Operativa',
  IN_REPAIR: 'En reparación',
  RETIRED: 'De baja',
}

export const toolStatusOptions = TOOL_STATUSES.map((value) => ({
  value,
  label: TOOL_STATUS_LABELS[value],
}))

/** Dónde está: con quién la tiene, o en el almacén. */
export function toolLocation(tool: Pick<Tool, 'assignedTo'>): string {
  return tool.assignedTo?.name ?? 'En el almacén'
}

/** Quién tiene la herramienta, como opción del combobox de usuarios. */
export function assigneeOption(assignee: ToolAssignee): ComboboxOption {
  return { value: assignee.userId, label: assignee.name }
}

/** Un usuario elegido en un combobox: su id, o vacío si no se eligió. */
const assignee = z.union([
  z.literal(''),
  z.uuid({ error: 'Selecciona a quién se le asigna' }),
])

/**
 * El formulario de una herramienta. `assignedToId` vacío es «en el almacén».
 * Solo una herramienta operativa se asigna: con otro estado, la asignación no
 * viaja (ver `toolInputSchema`), igual que la API, que la devuelve al almacén.
 */
export const toolFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Ingresa el código')
    .max(30, 'El código tiene como máximo 30 caracteres'),
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de la herramienta')
    .max(150, 'El nombre tiene como máximo 150 caracteres'),
  brand: z.string().trim().max(60, 'La marca tiene como máximo 60 caracteres'),
  status: z.enum(TOOL_STATUSES, { error: 'Selecciona el estado' }),
  assignedToId: assignee,
  notes: z
    .string()
    .trim()
    .max(1000, 'Las notas tienen como máximo 1000 caracteres'),
})

export type ToolFormValues = z.infer<typeof toolFormSchema>

export const emptyToolForm: ToolFormValues = {
  code: '',
  name: '',
  brand: '',
  status: 'AVAILABLE',
  assignedToId: '',
  notes: '',
}

/** Los valores del formulario para editar una herramienta existente. */
export function toolToForm(tool: Tool): ToolFormValues {
  return {
    code: tool.code,
    name: tool.name,
    brand: tool.brand ?? '',
    status: tool.status,
    assignedToId: tool.assignedTo?.userId ?? '',
    notes: tool.notes ?? '',
  }
}

/**
 * Lo que se le manda a la API: el código en mayúsculas, como lo guarda ella;
 * la marca y las notas vacías como null para borrarlas, y la asignación como
 * null si queda en el almacén o si la herramienta no está operativa (la API
 * rechaza asignar una en reparación o de baja).
 */
export const toolInputSchema = toolFormSchema.transform((value) => ({
  ...value,
  code: value.code.toUpperCase(),
  brand: value.brand || null,
  notes: value.notes || null,
  assignedToId:
    value.status === 'AVAILABLE' && value.assignedToId
      ? value.assignedToId
      : null,
}))

export type ToolInput = z.input<typeof toolInputSchema>

export const toolIdSchema = z.object({ toolId: z.uuid() })

export const updateToolRequestSchema = z.object({
  toolId: z.uuid(),
  values: toolInputSchema,
})

/** La acción rápida «Asignar»: a quién se le entrega. */
export const assignToolFormSchema = z.object({
  assignedToId: z.uuid({ error: 'Selecciona a quién se le entrega' }),
})

export type AssignToolFormValues = z.infer<typeof assignToolFormSchema>

/** Entregarla (`assignedToId`) o devolverla al almacén (`null`). */
export const assignToolRequestSchema = z.object({
  toolId: z.uuid(),
  assignedToId: z.uuid().nullable(),
})

export type AssignToolRequest = z.infer<typeof assignToolRequestSchema>

export const TOOL_SORT_FIELDS = ['code', 'name', 'status'] as const

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const toolsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(TOOL_STATUSES).optional().catch(undefined),
  assignedToId: z.uuid().optional().catch(undefined),
  isAssigned: z.boolean().optional().catch(undefined),
  sortBy: z.enum(TOOL_SORT_FIELDS).catch('code'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc'),
})

export type ToolsSearch = z.infer<typeof toolsSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultToolsSearch: ToolsSearch = toolsSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const TOOL_FILTERS_CLEARED = {
  search: undefined,
  status: undefined,
  assignedToId: undefined,
  isAssigned: undefined,
  page: 1,
} satisfies Partial<ToolsSearch>
