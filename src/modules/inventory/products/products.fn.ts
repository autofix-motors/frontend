import { createServerFn } from '@tanstack/react-start'
import { callApiEnvelope, callApiPage, toQueryString } from '#/server/api'
import {
  productIdSchema,
  productInputSchema,
  productsSearchSchema,
  updateProductRequestSchema,
} from './products.schemas'
import type { Product } from './products.schemas'

// Los repuestos e insumos, contra /products. Las mutaciones devuelven el
// mensaje de la API para mostrarlo tal cual en el aviso.

export const listProducts = createServerFn({ method: 'GET' })
  .validator(productsSearchSchema)
  .handler(({ data }) =>
    callApiPage<Product>(`/products${toQueryString(data)}`),
  )

export const createProduct = createServerFn({ method: 'POST' })
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    const { data: product, message } = await callApiEnvelope<Product>(
      '/products',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { product, message }
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .validator(updateProductRequestSchema)
  .handler(async ({ data }) => {
    const { data: product, message } = await callApiEnvelope<Product>(
      `/products/${data.productId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { product, message }
  })

export const deleteProduct = createServerFn({ method: 'POST' })
  .validator(productIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/products/${data.productId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
