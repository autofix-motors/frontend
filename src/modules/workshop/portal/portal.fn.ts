import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  ApiError,
  callApi,
  callApiEnvelope,
  callApiPage,
  toQueryString,
} from '#/server/api'
import {
  PORTAL_PAGE_SIZE,
  PORTAL_VEHICLES_PAGE_SIZE,
  portalDecisionRequestSchema,
  portalVehicleIdSchema,
  portalVehiclesSearchSchema,
  portalWorkOrderIdSchema,
  portalWorkOrdersSearchSchema,
} from './portal.schemas'
import type {
  PortalVehicle,
  PortalWorkOrder,
  PortalWorkOrderDetail,
} from './portal.schemas'

// El portal del cliente, contra /portal. La API sabe quién es por su sesión:
// nada de lo que llega aquí elige de qué cliente son los datos.

export const listMyVehicles = createServerFn({ method: 'GET' })
  .validator(portalVehiclesSearchSchema)
  .handler(({ data }) =>
    callApiPage<PortalVehicle>(
      `/portal/vehicles${toQueryString({ ...data, pageSize: PORTAL_VEHICLES_PAGE_SIZE })}`,
    ),
  )

export const getMyVehicle = createServerFn({ method: 'GET' })
  .validator(portalVehicleIdSchema)
  .handler(({ data }) =>
    callApi<PortalVehicle>(`/portal/vehicles/${data.vehicleId}`),
  )

export const listMyWorkOrders = createServerFn({ method: 'GET' })
  .validator(portalWorkOrdersSearchSchema)
  .handler(({ data }) =>
    callApiPage<PortalWorkOrder>(
      `/portal/work-orders${toQueryString({ ...data, pageSize: PORTAL_PAGE_SIZE })}`,
    ),
  )

export const getMyWorkOrder = createServerFn({ method: 'GET' })
  .validator(portalWorkOrderIdSchema)
  .handler(async ({ data }) => {
    try {
      return await callApi<PortalWorkOrderDetail>(
        `/portal/work-orders/${data.workOrderId}`,
      )
    } catch (error) {
      // Una orden que no es suya, para la API, no existe: la página muestra
      // «no encontrada», no la pantalla de error.
      if (error instanceof ApiError && error.statusCode === 404) {
        throw notFound()
      }
      throw error
    }
  })

export const decideMyQuote = createServerFn({ method: 'POST' })
  .validator(portalDecisionRequestSchema)
  .handler(async ({ data: { workOrderId, quoteId, ...body } }) => {
    const { data: order, message } =
      await callApiEnvelope<PortalWorkOrderDetail>(
        `/portal/work-orders/${workOrderId}/quotes/${quoteId}/decision`,
        { method: 'POST', body: JSON.stringify(body) },
      )
    return { order, message }
  })
