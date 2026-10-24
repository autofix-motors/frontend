import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  productsKeys,
  productsQueries,
} from '#/modules/inventory/products/products.queries'
import {
  createAdjustment,
  createPurchase,
  listStockMovements,
} from './stock-movements.fn'
import type {
  AdjustmentFormValues,
  PurchaseInput,
  StockMovementsSearch,
} from './stock-movements.schemas'

export const stockMovementsKeys = {
  all: ['stock-movements'] as const,
  list: (search: StockMovementsSearch) =>
    [...stockMovementsKeys.all, 'list', search] as const,
}

export const stockMovementsQueries = {
  list: (search: StockMovementsSearch) =>
    queryOptions({
      queryKey: stockMovementsKeys.list(search),
      queryFn: () => listStockMovements({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
}

/**
 * Los productos que se ofrecen al registrar una compra o un ajuste: solo los
 * activos, porque la API rechaza los inactivos.
 */
export const activeProductOptions = (search: string) =>
  productsQueries.options({ search, onlyActive: true })

/**
 * Un movimiento cambia el kardex y también el producto (su stock y, en una
 * compra, su costo): se invalidan los dos módulos, para que los repuestos y
 * las opciones de los combobox muestren el stock nuevo.
 */
async function invalidateAfterMovement(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stockMovementsKeys.all }),
    queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  ])
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PurchaseInput) => createPurchase({ data: values }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await invalidateAfterMovement(queryClient)
    },
  })
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AdjustmentFormValues) =>
      createAdjustment({ data: values }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await invalidateAfterMovement(queryClient)
    },
  })
}
