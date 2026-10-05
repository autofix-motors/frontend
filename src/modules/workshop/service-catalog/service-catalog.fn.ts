import { createServerFn } from '@tanstack/react-start'
import {
  callApi,
  callApiEnvelope,
  callApiPage,
  toQueryString,
} from '#/server/api'
import {
  serviceCatalogItemIdSchema,
  serviceCatalogItemInputSchema,
  serviceCatalogSearchSchema,
  updateServiceCatalogItemRequestSchema,
} from './service-catalog.schemas'
import type { ServiceCatalogItem } from './service-catalog.schemas'

// El catálogo de servicios, contra /service-catalog. Las mutaciones devuelven
// el mensaje de la API para mostrarlo tal cual en el aviso.

export const listServiceCatalog = createServerFn({ method: 'GET' })
  .validator(serviceCatalogSearchSchema)
  .handler(({ data }) =>
    callApiPage<ServiceCatalogItem>(`/service-catalog${toQueryString(data)}`),
  )

export const getServiceCatalogItem = createServerFn({ method: 'GET' })
  .validator(serviceCatalogItemIdSchema)
  .handler(({ data }) =>
    callApi<ServiceCatalogItem>(
      `/service-catalog/${data.serviceCatalogItemId}`,
    ),
  )

export const createServiceCatalogItem = createServerFn({ method: 'POST' })
  .validator(serviceCatalogItemInputSchema)
  .handler(async ({ data }) => {
    const { data: item, message } = await callApiEnvelope<ServiceCatalogItem>(
      '/service-catalog',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { item, message }
  })

export const updateServiceCatalogItem = createServerFn({ method: 'POST' })
  .validator(updateServiceCatalogItemRequestSchema)
  .handler(async ({ data }) => {
    const { data: item, message } = await callApiEnvelope<ServiceCatalogItem>(
      `/service-catalog/${data.serviceCatalogItemId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { item, message }
  })

export const deleteServiceCatalogItem = createServerFn({ method: 'POST' })
  .validator(serviceCatalogItemIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/service-catalog/${data.serviceCatalogItemId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
