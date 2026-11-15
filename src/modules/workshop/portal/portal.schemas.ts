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
export type PortalWorkOrderState = components['schemas']['EstadoListaPortal']

/** Órdenes por página en el portal: un cliente tiene pocas. */
export const PORTAL_PAGE_SIZE = 10

export const PORTAL_TABS: { value: PortalWorkOrderState; label: string }[] = [
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'ANTERIORES', label: 'Anteriores' },
]

/**
 * La pestaña, el vehículo y la página, como viven en la URL. Un valor inválido
 * (alguien editó la URL a mano) cae a su valor por defecto.
 */
export const portalWorkOrdersSearchSchema = z.object({
  estado: z.enum(['EN_CURSO', 'ANTERIORES']).catch('EN_CURSO'),
  vehiculoId: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})

export type PortalWorkOrdersSearch = z.infer<
  typeof portalWorkOrdersSearchSchema
>

export const defaultPortalWorkOrdersSearch: PortalWorkOrdersSearch =
  portalWorkOrdersSearchSchema.parse({})

export const portalWorkOrderIdSchema = z.object({ ordenTrabajoId: z.uuid() })

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

export const portalVehicleIdSchema = z.object({ vehiculoId: z.uuid() })

/**
 * La versión que espera la respuesta del cliente, si la hay. Solo cuenta
 * mientras la orden espera aprobación (como en la API).
 */
export function pendingQuote(
  order: Pick<PortalWorkOrderDetail, 'estado' | 'presupuestos'>,
): PortalQuote | undefined {
  if (order.estado !== 'ESPERANDO_APROBACION') return undefined
  return order.presupuestos.find((quote) => quote.estado === 'PENDIENTE')
}

export const PORTAL_DECISIONS = [
  'APROBADO',
  'RECHAZADO',
] as const satisfies readonly components['schemas']['DecisionPresupuesto'][]
export type PortalDecision = (typeof PORTAL_DECISIONS)[number]

/** Qué le pasa a su orden con cada respuesta, dicho para el cliente. */
export const PORTAL_DECISION_EFFECTS: Record<PortalDecision, string> = {
  APROBADO: 'El taller continúa con la reparación según este presupuesto.',
  RECHAZADO: 'El taller revisará el presupuesto y se comunicará contigo.',
}

/** La nota opcional que acompaña la respuesta. */
export const portalDecisionFormSchema = z.object({
  nota: z
    .string()
    .trim()
    .max(2000, 'La nota tiene como máximo 2000 caracteres'),
})

export type PortalDecisionFormValues = z.infer<typeof portalDecisionFormSchema>

/** Lo que se le manda a la API: la nota vacía como null. */
export const portalDecisionRequestSchema = z.object({
  ordenTrabajoId: z.uuid(),
  presupuestoId: z.uuid(),
  decision: z.enum(PORTAL_DECISIONS),
  nota: portalDecisionFormSchema.shape.nota.transform((value) => value || null),
})

export type PortalDecisionRequest = z.input<typeof portalDecisionRequestSchema>
