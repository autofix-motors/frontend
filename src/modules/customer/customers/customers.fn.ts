import { createServerFn } from '@tanstack/react-start'
import { callApiEnvelope, callApiPage, toQueryString } from '#/server/api'
import {
  customerIdSchema,
  customerInputSchema,
  customersSearchSchema,
  updateCustomerRequestSchema,
} from './customers.schemas'
import type { Customer } from './customers.schemas'

// Los clientes del taller, contra /customers. Las mutaciones devuelven el
// mensaje de la API para mostrarlo tal cual en el aviso.

export const listCustomers = createServerFn({ method: 'GET' })
  .validator(customersSearchSchema)
  .handler(({ data }) =>
    callApiPage<Customer>(`/customers${toQueryString(data)}`),
  )

export const createCustomer = createServerFn({ method: 'POST' })
  .validator(customerInputSchema)
  .handler(async ({ data }) => {
    const { data: customer, message } = await callApiEnvelope<Customer>(
      '/customers',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { customer, message }
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .validator(updateCustomerRequestSchema)
  .handler(async ({ data }) => {
    const { data: customer, message } = await callApiEnvelope<Customer>(
      `/customers/${data.customerId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { customer, message }
  })

export const deleteCustomer = createServerFn({ method: 'POST' })
  .validator(customerIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/customers/${data.customerId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
