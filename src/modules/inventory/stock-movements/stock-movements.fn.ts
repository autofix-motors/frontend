import { createServerFn } from '@tanstack/react-start'
import { callApiEnvelope, callApiPage, toQueryString } from '#/server/api'
import {
  adjustmentFormSchema,
  purchaseInputSchema,
  stockMovementsSearchSchema,
} from './stock-movements.schemas'
import type { StockMovement } from './stock-movements.schemas'

// El kardex, contra /stock-movements. No hay edición ni borrado: un movimiento
// es historial y se corrige con un ajuste. Los registros devuelven el mensaje
// de la API para mostrarlo tal cual en el aviso.

export const listStockMovements = createServerFn({ method: 'GET' })
  .validator(stockMovementsSearchSchema)
  .handler(({ data }) =>
    callApiPage<StockMovement>(`/stock-movements${toQueryString(data)}`),
  )

export const createPurchase = createServerFn({ method: 'POST' })
  .validator(purchaseInputSchema)
  .handler(async ({ data }) => {
    const { data: movement, message } = await callApiEnvelope<StockMovement>(
      '/stock-movements/purchases',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { movement, message }
  })

export const createAdjustment = createServerFn({ method: 'POST' })
  .validator(adjustmentFormSchema)
  .handler(async ({ data }) => {
    const { data: movement, message } = await callApiEnvelope<StockMovement>(
      '/stock-movements/adjustments',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { movement, message }
  })
