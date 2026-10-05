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
  addItemRequestSchema,
  addNoteRequestSchema,
  changeStatusRequestSchema,
  createWorkOrderInputSchema,
  removeItemRequestSchema,
  updateDiagnosisRequestSchema,
  updateItemRequestSchema,
  updateWorkOrderRequestSchema,
  workOrderIdSchema,
  workOrdersSearchSchema,
} from './work-orders.schemas'
import type { WorkOrder, WorkOrderDetail } from './work-orders.schemas'

// Las órdenes de trabajo, contra /work-orders. Las mutaciones devuelven la
// orden completa (con su línea de tiempo) y el mensaje de la API, para
// mostrarlo tal cual en el aviso.

export const listWorkOrders = createServerFn({ method: 'GET' })
  .validator(workOrdersSearchSchema)
  .handler(({ data }) =>
    // La lista de estados viaja separada por coma («RECEIVED,DIAGNOSIS»):
    // así la recibe la API.
    callApiPage<WorkOrder>(`/work-orders${toQueryString(data)}`),
  )

export const getWorkOrder = createServerFn({ method: 'GET' })
  .validator(workOrderIdSchema)
  .handler(async ({ data }) => {
    try {
      return await callApi<WorkOrderDetail>(`/work-orders/${data.workOrderId}`)
    } catch (error) {
      // Una orden que no existe —o que es de otro mecánico, que para la API
      // es lo mismo— no es una falla: la página muestra «no encontrada» con
      // un 404, en vez de la pantalla de error.
      if (error instanceof ApiError && error.statusCode === 404) {
        throw notFound()
      }
      throw error
    }
  })

/** Un cambio sobre una orden: la orden como quedó y el mensaje de la API. */
async function send(path: string, method: string, body?: unknown) {
  const { data: workOrder, message } = await callApiEnvelope<WorkOrderDetail>(
    path,
    { method, body: body === undefined ? undefined : JSON.stringify(body) },
  )
  return { workOrder, message }
}

export const createWorkOrder = createServerFn({ method: 'POST' })
  .validator(createWorkOrderInputSchema)
  .handler(({ data }) => send('/work-orders', 'POST', data))

export const updateWorkOrder = createServerFn({ method: 'POST' })
  .validator(updateWorkOrderRequestSchema)
  .handler(({ data }) =>
    send(`/work-orders/${data.workOrderId}`, 'PATCH', data.values),
  )

export const updateWorkOrderDiagnosis = createServerFn({ method: 'POST' })
  .validator(updateDiagnosisRequestSchema)
  .handler(({ data }) =>
    send(`/work-orders/${data.workOrderId}/diagnosis`, 'PUT', data.values),
  )

export const changeWorkOrderStatus = createServerFn({ method: 'POST' })
  .validator(changeStatusRequestSchema)
  .handler(({ data: { workOrderId, ...body } }) =>
    send(`/work-orders/${workOrderId}/status`, 'POST', body),
  )

export const addWorkOrderNote = createServerFn({ method: 'POST' })
  .validator(addNoteRequestSchema)
  .handler(({ data }) =>
    send(`/work-orders/${data.workOrderId}/notes`, 'POST', data.values),
  )

export const addWorkOrderItem = createServerFn({ method: 'POST' })
  .validator(addItemRequestSchema)
  .handler(({ data }) =>
    send(`/work-orders/${data.workOrderId}/items`, 'POST', data.values),
  )

export const updateWorkOrderItem = createServerFn({ method: 'POST' })
  .validator(updateItemRequestSchema)
  .handler(({ data }) =>
    send(
      `/work-orders/${data.workOrderId}/items/${data.workOrderItemId}`,
      'PATCH',
      data.values,
    ),
  )

/** Quitar un ítem responde sin la orden (como todo DELETE): solo el mensaje. */
export const removeWorkOrderItem = createServerFn({ method: 'POST' })
  .validator(removeItemRequestSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/work-orders/${data.workOrderId}/items/${data.workOrderItemId}`,
      { method: 'DELETE' },
    )
    return { message }
  })

export const deleteWorkOrder = createServerFn({ method: 'POST' })
  .validator(workOrderIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/work-orders/${data.workOrderId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
