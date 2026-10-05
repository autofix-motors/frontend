import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { vehiclesKeys } from '#/modules/customer/vehicles/vehicles.queries'
import { productsKeys } from '#/modules/inventory/products/products.queries'
import { stockMovementsKeys } from '#/modules/inventory/stock-movements/stock-movements.queries'
import {
  addWorkOrderItem,
  addWorkOrderNote,
  changeWorkOrderStatus,
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrder,
  listWorkOrders,
  removeWorkOrderItem,
  updateWorkOrder,
  updateWorkOrderDiagnosis,
  updateWorkOrderItem,
} from './work-orders.fn'
import type {
  AddItemRequest,
  ChangeStatusRequest,
  CreateWorkOrderInput,
  DiagnosisFormValues,
  ItemType,
  NoteFormValues,
  UpdateItemRequest,
  UpdateWorkOrderInput,
  WorkOrderDetail,
  WorkOrdersSearch,
} from './work-orders.schemas'

export const workOrdersKeys = {
  all: ['work-orders'] as const,
  list: (search: WorkOrdersSearch) =>
    [...workOrdersKeys.all, 'list', search] as const,
  detail: (workOrderId: string) =>
    [...workOrdersKeys.all, 'detail', workOrderId] as const,
}

export const workOrdersQueries = {
  list: (search: WorkOrdersSearch) =>
    queryOptions({
      queryKey: workOrdersKeys.list(search),
      queryFn: () => listWorkOrders({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
  detail: (workOrderId: string) =>
    queryOptions({
      queryKey: workOrdersKeys.detail(workOrderId),
      queryFn: () => getWorkOrder({ data: { workOrderId } }),
    }),
}

/**
 * Después de un cambio: la orden que devolvió la API pasa directo a la caché
 * del detalle (la pantalla no vuelve a pedirla) y se invalidan los listados,
 * donde un cambio de estado mueve la fila entre filtros.
 */
async function onChanged(
  queryClient: QueryClient,
  { workOrder, message }: { workOrder: WorkOrderDetail; message: string },
) {
  toast.success(message)
  queryClient.setQueryData(
    workOrdersKeys.detail(workOrder.workOrderId),
    workOrder,
  )
  await queryClient.invalidateQueries({
    queryKey: [...workOrdersKeys.all, 'list'],
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateWorkOrderInput) =>
      createWorkOrder({ data: values }),
    onSuccess: async (result) => {
      await onChanged(queryClient, result)
      // El listado de vehículos muestra cuántas órdenes tiene cada uno.
      await queryClient.invalidateQueries({ queryKey: vehiclesKeys.all })
    },
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: {
      workOrderId: string
      values: UpdateWorkOrderInput
    }) => updateWorkOrder({ data: request }),
    onSuccess: (result) => onChanged(queryClient, result),
  })
}

export function useUpdateWorkOrderDiagnosis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: {
      workOrderId: string
      values: DiagnosisFormValues
    }) => updateWorkOrderDiagnosis({ data: request }),
    onSuccess: (result) => onChanged(queryClient, result),
  })
}

export function useChangeWorkOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ChangeStatusRequest) =>
      changeWorkOrderStatus({ data: request }),
    onSuccess: (result) => onChanged(queryClient, result),
  })
}

export function useAddWorkOrderNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { workOrderId: string; values: NoteFormValues }) =>
      addWorkOrderNote({ data: request }),
    onSuccess: (result) => onChanged(queryClient, result),
  })
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workOrderId: string) =>
      deleteWorkOrder({ data: { workOrderId } }),
    // El detalle no se toca: la pantalla que borró sigue montada hasta que
    // navega al listado, y volver a pedirlo daría un 404 de paso.
    onSuccess: async ({ message }) => {
      toast.success(message)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...workOrdersKeys.all, 'list'],
        }),
        queryClient.invalidateQueries({ queryKey: vehiclesKeys.all }),
      ])
    },
  })
}

/**
 * Un repuesto que entra o sale de una orden mueve el stock: se invalidan los
 * repuestos (su stock) y el kardex (el movimiento nuevo).
 */
async function onStockMoved(queryClient: QueryClient, type: ItemType) {
  if (type !== 'PRODUCT') return
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: productsKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockMovementsKeys.all }),
  ])
}

export function useAddWorkOrderItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AddItemRequest) =>
      addWorkOrderItem({ data: request }),
    onSuccess: async (result, request) => {
      await onChanged(queryClient, result)
      await onStockMoved(queryClient, request.values.type)
    },
  })
}

export function useUpdateWorkOrderItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateItemRequest) =>
      updateWorkOrderItem({ data: request }),
    onSuccess: (result) => onChanged(queryClient, result),
  })
}

/**
 * Quitar responde solo el mensaje: el detalle se vuelve a pedir (para ver el
 * ítem fuera y el evento en la línea de tiempo), junto con los listados.
 */
export function useRemoveWorkOrderItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: {
      workOrderId: string
      workOrderItemId: string
      type: ItemType
    }) =>
      removeWorkOrderItem({
        data: {
          workOrderId: request.workOrderId,
          workOrderItemId: request.workOrderItemId,
        },
      }),
    onSuccess: async ({ message }, request) => {
      toast.success(message)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workOrdersKeys.detail(request.workOrderId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...workOrdersKeys.all, 'list'],
        }),
        onStockMoved(queryClient, request.type),
      ])
    },
  })
}
