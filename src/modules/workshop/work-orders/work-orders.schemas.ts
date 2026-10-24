import { z } from 'zod'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { isDateOnly, limaToday } from '#/lib/dates'
import { moneyError } from '#/lib/money'
import { formatQuantity, movementQuantitySchema } from '#/lib/quantity'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import { formatStock } from '#/modules/inventory/products/products.schemas'
import type { components } from '#/types/api.gen'

/** Una orden en el listado: datos de ingreso, vehículo, cliente y mecánico. */
export type WorkOrder = components['schemas']['WorkOrder']
/** Una orden completa: lo del listado más el diagnóstico y la línea de tiempo. */
export type WorkOrderDetail = components['schemas']['WorkOrderDetail']
export type WorkOrderEvent = components['schemas']['WorkOrderEvent']
export type WorkOrderStatus = components['schemas']['WorkOrderStatus']
/** Un servicio o repuesto de la orden. `unitCost` solo llega para ADMIN. */
export type WorkOrderItem = components['schemas']['WorkOrderItem']
/** Los montos de la orden. `partsCost` y `partsMargin` solo para ADMIN. */
export type WorkOrderTotals = components['schemas']['WorkOrderTotals']
export type ItemType = components['schemas']['ItemType']

export const WORK_ORDER_STATUSES = [
  'RECEIVED',
  'DIAGNOSIS',
  'WAITING_APPROVAL',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const satisfies readonly WorkOrderStatus[]

/** Cómo se le muestra cada estado al usuario. */
export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSIS: 'En diagnóstico',
  WAITING_APPROVAL: 'Esperando aprobación',
  IN_PROGRESS: 'En reparación',
  WAITING_PARTS: 'Esperando repuestos',
  READY: 'Listo para recoger',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

/**
 * El color de cada estado. Lo que espera a alguien de afuera (el cliente, el
 * proveedor) en ámbar; lo listo en verde; lo cerrado, apagado.
 */
export const WORK_ORDER_STATUS_COLORS: Record<WorkOrderStatus, string> = {
  RECEIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  DIAGNOSIS: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  WAITING_APPROVAL:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  IN_PROGRESS:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  WAITING_PARTS:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  READY:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DELIVERED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
}

/** Cómo nombra el taller a una orden: «OT-000123». */
export function formatWorkOrderNumber(number: number): string {
  return `OT-${String(number).padStart(6, '0')}`
}

// COPIA de la tabla de la API (backend: work-orders/work-order-status.ts). La
// API es la que decide; esta copia solo sirve para dibujar los botones que la
// API va a aceptar. Si cambia allá, cambia aquí, con su test.

/** A dónde se puede llevar una orden a mano desde cada estado. */
const MANUAL_TRANSITIONS: Record<WorkOrderStatus, readonly WorkOrderStatus[]> =
  {
    RECEIVED: ['DIAGNOSIS', 'IN_PROGRESS', 'CANCELLED'],
    DIAGNOSIS: ['IN_PROGRESS', 'CANCELLED'],
    // Entra y sale con el presupuesto, no a mano: solo se puede cancelar.
    WAITING_APPROVAL: ['CANCELLED'],
    IN_PROGRESS: ['WAITING_PARTS', 'READY', 'CANCELLED'],
    WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
    // Volver a reparación es el retrabajo; cancelar vale antes de entregar.
    READY: ['DELIVERED', 'IN_PROGRESS', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  }

/** Entregar y cancelar son del administrador. */
const MECHANIC_TARGETS: readonly WorkOrderStatus[] = [
  'DIAGNOSIS',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'READY',
]

/** Si `role` puede llevar a mano una orden de `from` a `to` (como la API). */
export function canTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  role: UserRole,
): boolean {
  if (!MANUAL_TRANSITIONS[from].includes(to)) return false
  return role === 'ADMIN' || MECHANIC_TARGETS.includes(to)
}

/** Los estados a los que `role` puede llevar una orden que está en `from`. */
export function allowedTransitions(
  from: WorkOrderStatus,
  role: UserRole,
): WorkOrderStatus[] {
  return MANUAL_TRANSITIONS[from].filter((to) => canTransition(from, to, role))
}

/** Entregada o cancelada: ya no se edita ni cambia de estado. */
export function isClosed(status: WorkOrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED'
}

/** Mientras se trabaja la orden, el diagnóstico se puede escribir (como la API). */
export function canEditDiagnosis(status: WorkOrderStatus): boolean {
  return ['RECEIVED', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS'].includes(
    status,
  )
}

/** El texto del botón que lleva la orden a cada estado. */
export const TRANSITION_LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: 'Recibir',
  DIAGNOSIS: 'Iniciar diagnóstico',
  WAITING_APPROVAL: 'Enviar a aprobación',
  IN_PROGRESS: 'Iniciar reparación',
  WAITING_PARTS: 'Esperar repuestos',
  READY: 'Marcar como listo',
  DELIVERED: 'Entregar al cliente',
  CANCELLED: 'Cancelar orden',
}

// Las mismas reglas que valida la API (los DTO de work-orders), para avisar
// al momento en el formulario. Todo es texto porque así lo maneja el
// formulario; los `*InputSchema` lo convierten en lo que espera la API.
const mileageField = z
  .string()
  .trim()
  .min(1, 'Ingresa el kilometraje')
  // Con pipe, el formato solo se revisa si no está vacío: un mensaje a la vez.
  .pipe(
    z.string().refine(
      // Hasta siete cifras: el tope de la API es 9 999 999.
      (value) => /^\d{1,7}$/.test(value),
      'El kilometraje es un número entero de 0 a 9 999 999',
    ),
  )

const reasonField = z
  .string()
  .trim()
  .min(1, 'Ingresa el motivo del ingreso')
  .max(2000, 'El motivo tiene como máximo 2000 caracteres')

const promisedDateField = z
  .string()
  .refine(
    (value) => !value || isDateOnly(value),
    'La fecha prometida es un día AAAA-MM-DD',
  )

/** Un usuario elegido en un combobox: su id, o vacío si no se eligió. */
const mechanicField = z.union([
  z.literal(''),
  z.uuid({ error: 'Selecciona el mecánico' }),
])

const PAST_PROMISED_DATE = 'La fecha prometida no puede ser anterior a hoy'

/**
 * El alta: el vehículo que ingresa y los datos del ingreso. La fecha
 * prometida no puede haber pasado (en Lima, como la API).
 */
export const createWorkOrderFormSchema = z.object({
  vehicleId: z.string().min(1, 'Selecciona el vehículo'),
  mileageIn: mileageField,
  reason: reasonField,
  promisedDate: promisedDateField.refine(
    (value) => !value || value >= limaToday(),
    PAST_PROMISED_DATE,
  ),
  mechanicId: mechanicField,
})

export type CreateWorkOrderFormValues = z.infer<
  typeof createWorkOrderFormSchema
>

export const emptyCreateWorkOrderForm: CreateWorkOrderFormValues = {
  vehicleId: '',
  mileageIn: '',
  reason: '',
  promisedDate: '',
  mechanicId: '',
}

/** Lo que se le manda a la API: números como número y lo vacío como null. */
export const createWorkOrderInputSchema = createWorkOrderFormSchema.transform(
  (value) => ({
    ...value,
    mileageIn: Number(value.mileageIn),
    promisedDate: value.promisedDate || null,
    mechanicId: value.mechanicId || null,
  }),
)

export type CreateWorkOrderInput = z.input<typeof createWorkOrderInputSchema>

/** La edición: lo mismo sin el vehículo, que no se cambia. */
const updateWorkOrderFieldsSchema = z.object({
  mileageIn: mileageField,
  reason: reasonField,
  promisedDate: promisedDateField,
  mechanicId: mechanicField,
})

export type UpdateWorkOrderFormValues = z.infer<
  typeof updateWorkOrderFieldsSchema
>

/**
 * El formulario de edición. La fecha prometida que ya tenía se puede dejar
 * aunque haya pasado (una orden vencida se sigue editando); solo una fecha
 * nueva no puede ser anterior a hoy.
 */
export function updateWorkOrderFormSchema(currentPromisedDate: string | null) {
  return updateWorkOrderFieldsSchema.refine(
    ({ promisedDate }) =>
      !promisedDate ||
      promisedDate === currentPromisedDate ||
      promisedDate >= limaToday(),
    { message: PAST_PROMISED_DATE, path: ['promisedDate'] },
  )
}

/** Los valores del formulario para editar una orden. */
export function workOrderToForm(
  order: Pick<
    WorkOrderDetail,
    'mileageIn' | 'reason' | 'promisedDate' | 'mechanic'
  >,
): UpdateWorkOrderFormValues {
  return {
    mileageIn: String(order.mileageIn),
    reason: order.reason,
    promisedDate: order.promisedDate ?? '',
    mechanicId: order.mechanic?.userId ?? '',
  }
}

export const updateWorkOrderInputSchema = updateWorkOrderFieldsSchema.transform(
  (value) => ({
    ...value,
    mileageIn: Number(value.mileageIn),
    promisedDate: value.promisedDate || null,
    mechanicId: value.mechanicId || null,
  }),
)

export type UpdateWorkOrderInput = z.input<typeof updateWorkOrderInputSchema>

export const workOrderIdSchema = z.object({ workOrderId: z.uuid() })

export const updateWorkOrderRequestSchema = z.object({
  workOrderId: z.uuid(),
  values: updateWorkOrderInputSchema,
})

/** El diagnóstico entero; vacío lo borra. */
export const diagnosisFormSchema = z.object({
  diagnosis: z
    .string()
    .trim()
    .max(4000, 'El diagnóstico tiene como máximo 4000 caracteres'),
})

export type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>

export const updateDiagnosisRequestSchema = z.object({
  workOrderId: z.uuid(),
  values: diagnosisFormSchema.transform((value) => ({
    diagnosis: value.diagnosis || null,
  })),
})

const noteField = z
  .string()
  .trim()
  .max(2000, 'La nota tiene como máximo 2000 caracteres')

/**
 * El cambio de estado: una nota opcional y si la ve el cliente. Cancelar
 * exige la nota, que es el motivo (la API lo guarda como tal).
 */
export function statusChangeFormSchema(status: WorkOrderStatus) {
  return z
    .object({ note: noteField, isPublic: z.boolean() })
    .refine(({ note }) => status !== 'CANCELLED' || note.length > 0, {
      message: 'Indica el motivo de la cancelación',
      path: ['note'],
    })
}

export type StatusChangeFormValues = z.infer<
  ReturnType<typeof statusChangeFormSchema>
>

/**
 * Lo que se manda al cambiar de estado. El motivo de una cancelación es
 * interno por defecto: suele hablar de plata o del cliente.
 */
export function emptyStatusChangeForm(
  status: WorkOrderStatus,
): StatusChangeFormValues {
  return { note: '', isPublic: status !== 'CANCELLED' }
}

export const changeStatusRequestSchema = z.object({
  workOrderId: z.uuid(),
  status: z.enum(WORK_ORDER_STATUSES),
  note: noteField.transform((value) => value || null),
  isPublic: z.boolean(),
})

export type ChangeStatusRequest = z.input<typeof changeStatusRequestSchema>

/**
 * Una nota en la línea de tiempo. Nace interna: que el cliente la vea tiene
 * que ser una decisión, no un descuido.
 */
export const noteFormSchema = z.object({
  note: noteField.min(1, 'Escribe la nota'),
  isPublic: z.boolean(),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

export const emptyNoteForm: NoteFormValues = { note: '', isPublic: false }

export const addNoteRequestSchema = z.object({
  workOrderId: z.uuid(),
  values: noteFormSchema,
})

export const WORK_ORDER_SORT_FIELDS = [
  'receivedAt',
  'promisedDate',
  'number',
] as const

// Un día AAAA-MM-DD que existe; cualquier otra cosa en la URL se descarta.
const dateOnly = z.string().refine(isDateOnly).optional().catch(undefined)

/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven
 * en la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor
 * por defecto en vez de romper la página. Por defecto, lo último que entró
 * primero. `status` es una lista: la API recibe los estados separados por
 * coma.
 */
export const workOrdersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z
    .array(z.enum(WORK_ORDER_STATUSES))
    .min(1)
    .optional()
    .catch(undefined),
  mechanicId: z.uuid().optional().catch(undefined),
  vehicleId: z.uuid().optional().catch(undefined),
  customerId: z.uuid().optional().catch(undefined),
  overdue: z.boolean().optional().catch(undefined),
  from: dateOnly,
  to: dateOnly,
  sortBy: z.enum(WORK_ORDER_SORT_FIELDS).catch('receivedAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
})

export type WorkOrdersSearch = z.infer<typeof workOrdersSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultWorkOrdersSearch: WorkOrdersSearch =
  workOrdersSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const WORK_ORDER_FILTERS_CLEARED = {
  search: undefined,
  status: undefined,
  mechanicId: undefined,
  vehicleId: undefined,
  customerId: undefined,
  overdue: undefined,
  from: undefined,
  to: undefined,
  page: 1,
} satisfies Partial<WorkOrdersSearch>

/** Los estados de una orden que sigue en el taller: el atajo «Abiertas». */
export const OPEN_STATUSES = WORK_ORDER_STATUSES.filter(
  (status) => !isClosed(status),
)

// ── Servicios y repuestos ────────────────────────────────────────────────────

/** Cómo se le muestra cada tipo de ítem al usuario. */
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  SERVICE: 'Servicio',
  PRODUCT: 'Repuesto',
}

/**
 * COPIA de los estados en que la API deja cambiar los ítems
 * (`ITEM_STATUSES` en work-order-status.ts): mientras se diagnostica y se
 * repara. Sirve para mostrar los botones solo cuando la API los va a aceptar.
 */
export function canChangeItems(status: WorkOrderStatus): boolean {
  return ['RECEIVED', 'DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS'].includes(
    status,
  )
}

/**
 * Si `role` puede editar el ítem. De un servicio, el mecánico cambia la
 * cantidad; de un repuesto solo se editan el precio y la descripción (la
 * cantidad ya movió el stock), que son del administrador.
 */
export function canEditItem(
  item: Pick<WorkOrderItem, 'type'>,
  role: UserRole,
): boolean {
  return role === 'ADMIN' || item.type === 'SERVICE'
}

/** «2», «1.50» o, en un repuesto, con su unidad: «4.50 L». */
export function formatItemQuantity(
  item: Pick<WorkOrderItem, 'quantity' | 'unit'>,
): string {
  return item.unit
    ? formatStock(item.quantity, item.unit)
    : formatQuantity(item.quantity)
}

// Las reglas de los DTO de ítems de la API.
const ITEM_DESCRIPTION_MAX_LENGTH = 200

const itemQuantityField = z
  .string()
  .trim()
  .min(1, 'Ingresa la cantidad')
  .pipe(movementQuantitySchema('La cantidad', { signed: false }))

/** El precio del administrador; vacío, se usa el del catálogo o el repuesto. */
const itemPriceField = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const message = value ? moneyError(value, 'El precio unitario') : null
    if (message) ctx.addIssue({ code: 'custom', message })
  })

const itemDescriptionField = z
  .string()
  .trim()
  .max(
    ITEM_DESCRIPTION_MAX_LENGTH,
    `La descripción tiene como máximo ${ITEM_DESCRIPTION_MAX_LENGTH} caracteres`,
  )

/** Un precio que no puede quedar vacío (al editar, el del ítem). */
const requiredItemPriceField = z
  .string()
  .trim()
  .min(1, 'Ingresa el precio unitario')
  .pipe(itemPriceField)

const requiredItemDescriptionField = itemDescriptionField.min(
  1,
  'Escribe la descripción del ítem',
)

/**
 * Agregar un servicio o un repuesto. `sourceId` es el servicio del catálogo
 * o el repuesto, según el tipo. El precio y la descripción solo los ve el
 * administrador, y se llenan con los del original al elegirlo; para el
 * mecánico quedan vacíos y la API copia los del original.
 */
export function addItemFormSchema(type: ItemType) {
  return z.object({
    sourceId: z
      .string()
      .min(
        1,
        type === 'SERVICE'
          ? 'Selecciona el servicio'
          : 'Selecciona el repuesto',
      ),
    quantity: itemQuantityField,
    unitPrice: itemPriceField,
    description: itemDescriptionField,
  })
}

export type AddItemFormValues = z.infer<ReturnType<typeof addItemFormSchema>>

export const emptyAddItemForm: AddItemFormValues = {
  sourceId: '',
  quantity: '1',
  unitPrice: '',
  description: '',
}

// Lo vacío no viaja: la API copia el precio y la descripción del original.
const optionalPrice = itemPriceField.transform((value) => value || undefined)
const optionalDescription = itemDescriptionField.transform(
  (value) => value || undefined,
)

/** Lo que se le manda a la API al agregar, con el id en su campo según el tipo. */
export const addItemRequestSchema = z.object({
  workOrderId: z.uuid(),
  values: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('SERVICE'),
      serviceCatalogItemId: z.uuid({ error: 'Selecciona el servicio' }),
      quantity: itemQuantityField,
      unitPrice: optionalPrice,
      description: optionalDescription,
    }),
    z.object({
      type: z.literal('PRODUCT'),
      productId: z.uuid({ error: 'Selecciona el repuesto' }),
      quantity: itemQuantityField,
      unitPrice: optionalPrice,
      description: optionalDescription,
    }),
  ]),
})

export type AddItemRequest = z.input<typeof addItemRequestSchema>

/** Del formulario de alta a lo que espera la API. */
export function toAddItemRequest(
  workOrderId: string,
  type: ItemType,
  { sourceId, ...values }: AddItemFormValues,
): AddItemRequest {
  return {
    workOrderId,
    values:
      type === 'SERVICE'
        ? { type, serviceCatalogItemId: sourceId, ...values }
        : { type, productId: sourceId, ...values },
  }
}

/**
 * Editar un ítem. Cada campo se valida solo si quien edita lo puede cambiar:
 * la cantidad, en un servicio; el precio y la descripción, el administrador.
 */
export function editItemFormSchema({
  canEditQuantity,
  canEditPrice,
}: {
  canEditQuantity: boolean
  canEditPrice: boolean
}) {
  return z.object({
    quantity: canEditQuantity ? itemQuantityField : z.string(),
    unitPrice: canEditPrice ? requiredItemPriceField : z.string(),
    description: canEditPrice ? requiredItemDescriptionField : z.string(),
  })
}

export type EditItemFormValues = z.infer<ReturnType<typeof editItemFormSchema>>

/** Los valores actuales del ítem; «1» en vez de «1.00», como se escribiría. */
export function itemToEditForm(
  item: Pick<WorkOrderItem, 'quantity' | 'unitPrice' | 'description'>,
): EditItemFormValues {
  return {
    quantity: item.quantity.replace(/\.00$/, ''),
    unitPrice: item.unitPrice,
    description: item.description,
  }
}

export const updateItemRequestSchema = z.object({
  workOrderId: z.uuid(),
  workOrderItemId: z.uuid(),
  values: z.object({
    quantity: itemQuantityField.optional(),
    unitPrice: requiredItemPriceField.optional(),
    description: requiredItemDescriptionField.optional(),
  }),
})

export type UpdateItemRequest = z.input<typeof updateItemRequestSchema>

/** Lo que se manda al editar: solo lo que quien edita puede cambiar. */
export function toUpdateItemRequest(
  workOrderId: string,
  item: Pick<WorkOrderItem, 'workOrderItemId' | 'type'>,
  values: EditItemFormValues,
  role: UserRole,
): UpdateItemRequest {
  return {
    workOrderId,
    workOrderItemId: item.workOrderItemId,
    values: {
      ...(item.type === 'SERVICE' && { quantity: values.quantity }),
      ...(role === 'ADMIN' && {
        unitPrice: values.unitPrice,
        description: values.description,
      }),
    },
  }
}

export const removeItemRequestSchema = z.object({
  workOrderId: z.uuid(),
  workOrderItemId: z.uuid(),
})

// ── Presupuestos ─────────────────────────────────────────────────────────────

/** Una versión del presupuesto, con sus ítems congelados al enviarla. */
export type Quote = components['schemas']['Quote']
export type QuoteItem = components['schemas']['QuoteItem']
export type QuoteStatus = components['schemas']['QuoteStatus']
export type DecisionChannel = components['schemas']['DecisionChannel']
export type QuoteDecision = components['schemas']['QuoteDecision']

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  SUPERSEDED: 'Reemplazado',
}

/** Lo que espera al cliente en ámbar, como la orden que espera aprobación. */
export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  APPROVED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  REJECTED: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  SUPERSEDED: 'bg-muted text-muted-foreground',
}

/**
 * Los canales que registra el administrador. Sin PORTAL: ese lo registra el
 * propio cliente desde su cuenta (la API lo rechaza aquí).
 */
const DECISION_CHANNELS = [
  'PHONE',
  'WHATSAPP',
  'IN_PERSON',
] as const satisfies readonly DecisionChannel[]

export const DECISION_CHANNEL_LABELS: Record<DecisionChannel, string> = {
  PHONE: 'Llamada',
  WHATSAPP: 'WhatsApp',
  IN_PERSON: 'En el taller',
  PORTAL: 'Portal del cliente',
}

/** Quién hizo algo en la orden: el personal por su nombre, o el cliente. */
export function authorName(author: { name: string } | null): string {
  return author?.name ?? 'El cliente (portal)'
}

const QUOTE_DECISIONS = [
  'APPROVED',
  'REJECTED',
] as const satisfies readonly QuoteDecision[]

/** Qué le pasa a la orden con cada respuesta (como la API). */
export const QUOTE_DECISION_EFFECTS: Record<QuoteDecision, string> = {
  APPROVED: 'La orden pasa a «En reparación».',
  REJECTED: 'La orden vuelve a «En diagnóstico» para ajustar el presupuesto.',
}

/**
 * COPIA de los estados desde los que la API deja enviar un presupuesto
 * (`SYSTEM_TRANSITIONS.QUOTE_SENT` en work-order-status.ts): al diagnosticar
 * o, si aparece otro problema, a mitad de la reparación. Sirve para mostrar el
 * botón solo cuando la API lo va a aceptar; que la orden tenga ítems lo mira
 * la pantalla aparte.
 */
export function canSendQuote(status: WorkOrderStatus): boolean {
  return ['DIAGNOSIS', 'IN_PROGRESS', 'WAITING_PARTS'].includes(status)
}

/**
 * La versión que espera respuesta, si la hay. Solo cuenta mientras la orden
 * espera aprobación: una que quedó pendiente en una orden cancelada ya no se
 * responde.
 */
export function pendingQuote(
  workOrder: Pick<WorkOrderDetail, 'status' | 'quotes'>,
): Quote | undefined {
  if (workOrder.status !== 'WAITING_APPROVAL') return undefined
  return workOrder.quotes.find((quote) => quote.status === 'PENDING')
}

/** La nota para el cliente que acompaña al presupuesto; vacía no viaja. */
export const sendQuoteFormSchema = z.object({ note: noteField })

export type SendQuoteFormValues = z.infer<typeof sendQuoteFormSchema>

export const emptySendQuoteForm: SendQuoteFormValues = { note: '' }

export const sendQuoteRequestSchema = z.object({
  workOrderId: z.uuid(),
  note: noteField.transform((value) => value || null),
})

export type SendQuoteRequest = z.input<typeof sendQuoteRequestSchema>

/**
 * La respuesta del cliente. Las dos opciones empiezan vacías (`''`, y el
 * Select muestra su texto de ayuda): quien registra tiene que elegir qué
 * respondió y por dónde, no aceptar un valor por omisión. El `pipe` deja
 * entrar el vacío al formulario y lo rechaza con su mensaje.
 */
export const decideQuoteFormSchema = z.object({
  decision: z.union([z.literal(''), z.enum(QUOTE_DECISIONS)]).pipe(
    z.enum(QUOTE_DECISIONS, {
      error: 'Indica si el cliente aprobó o rechazó el presupuesto',
    }),
  ),
  channel: z.union([z.literal(''), z.enum(DECISION_CHANNELS)]).pipe(
    z.enum(DECISION_CHANNELS, {
      error: 'Indica por dónde respondió el cliente',
    }),
  ),
  note: noteField,
})

export type DecideQuoteFormValues = z.input<typeof decideQuoteFormSchema>

export const emptyDecideQuoteForm: DecideQuoteFormValues = {
  decision: '',
  channel: '',
  note: '',
}

/** Lo que se le manda a la API: la nota vacía como null. */
export const decideQuoteRequestSchema = z.object({
  workOrderId: z.uuid(),
  quoteId: z.uuid(),
  values: decideQuoteFormSchema.transform((value) => ({
    ...value,
    note: value.note || null,
  })),
})

export type DecideQuoteRequest = z.input<typeof decideQuoteRequestSchema>

export const DECISION_OPTIONS = QUOTE_DECISIONS.map((value) => ({
  value,
  label: QUOTE_STATUS_LABELS[value],
}))

export const CHANNEL_OPTIONS = DECISION_CHANNELS.map((value) => ({
  value,
  label: DECISION_CHANNEL_LABELS[value],
}))
