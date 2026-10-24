import { z } from 'zod'
import type { components } from '#/types/api.gen'

// El portal del cliente. Los tipos vienen del OpenAPI de la API: son las
// entidades propias del portal, sin costos ni datos del personal.
export type PortalVehicle = components['schemas']['PortalVehicle']
export type PortalWorkOrder = components['schemas']['PortalWorkOrder']
export type PortalWorkOrderDetail =
  components['schemas']['PortalWorkOrderDetail']
export type PortalQuote = components['schemas']['PortalQuote']
export type PortalLine = components['schemas']['PortalLine']
export type PortalEvent = components['schemas']['PortalEvent']
export type PortalWorkOrderState = components['schemas']['PortalWorkOrderState']

/** Órdenes por página en el portal: un cliente tiene pocas. */
export const PORTAL_PAGE_SIZE = 10

export const PORTAL_TABS: { value: PortalWorkOrderState; label: string }[] = [
  { value: 'OPEN', label: 'En curso' },
  { value: 'CLOSED', label: 'Anteriores' },
]

/**
 * La pestaña, el vehículo y la página, como viven en la URL. Un valor inválido
 * (alguien editó la URL a mano) cae a su valor por defecto.
 */
export const portalWorkOrdersSearchSchema = z.object({
  state: z.enum(['OPEN', 'CLOSED']).catch('OPEN'),
  vehicleId: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})

export type PortalWorkOrdersSearch = z.infer<
  typeof portalWorkOrdersSearchSchema
>

export const defaultPortalWorkOrdersSearch: PortalWorkOrdersSearch =
  portalWorkOrdersSearchSchema.parse({})

export const portalWorkOrderIdSchema = z.object({ workOrderId: z.uuid() })

/** Vehículos por página: tres filas de tres en la pantalla ancha. */
export const PORTAL_VEHICLES_PAGE_SIZE = 9

/** La búsqueda y la página de «Mis vehículos», como viven en la URL. */
export const portalVehiclesSearchSchema = z.object({
  search: z.string().trim().max(100).catch(''),
  page: z.coerce.number().int().min(1).catch(1),
})

export type PortalVehiclesSearch = z.infer<typeof portalVehiclesSearchSchema>

export const defaultPortalVehiclesSearch: PortalVehiclesSearch =
  portalVehiclesSearchSchema.parse({})

export const portalVehicleIdSchema = z.object({ vehicleId: z.uuid() })

/**
 * La versión que espera la respuesta del cliente, si la hay. Solo cuenta
 * mientras la orden espera aprobación (como en la API).
 */
export function pendingQuote(
  order: Pick<PortalWorkOrderDetail, 'status' | 'quotes'>,
): PortalQuote | undefined {
  if (order.status !== 'WAITING_APPROVAL') return undefined
  return order.quotes.find((quote) => quote.status === 'PENDING')
}

export const PORTAL_DECISIONS = ['APPROVED', 'REJECTED'] as const
export type PortalDecision = (typeof PORTAL_DECISIONS)[number]

/** Qué le pasa a su orden con cada respuesta, dicho para el cliente. */
export const PORTAL_DECISION_EFFECTS: Record<PortalDecision, string> = {
  APPROVED: 'El taller continúa con la reparación según este presupuesto.',
  REJECTED: 'El taller revisará el presupuesto y se comunicará contigo.',
}

/** La nota opcional que acompaña la respuesta. */
export const portalDecisionFormSchema = z.object({
  note: z
    .string()
    .trim()
    .max(2000, 'La nota tiene como máximo 2000 caracteres'),
})

export type PortalDecisionFormValues = z.infer<typeof portalDecisionFormSchema>

/** Lo que se le manda a la API: la nota vacía como null. */
export const portalDecisionRequestSchema = z.object({
  workOrderId: z.uuid(),
  quoteId: z.uuid(),
  decision: z.enum(PORTAL_DECISIONS),
  note: portalDecisionFormSchema.shape.note.transform((value) => value || null),
})

export type PortalDecisionRequest = z.input<typeof portalDecisionRequestSchema>
