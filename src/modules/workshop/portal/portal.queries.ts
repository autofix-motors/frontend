import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  decideMyQuote,
  getMyVehicle,
  getMyWorkOrder,
  listMyVehicles,
  listMyWorkOrders,
} from './portal.fn'
import type {
  PortalDecisionRequest,
  PortalVehiclesSearch,
  PortalWorkOrdersSearch,
} from './portal.schemas'

export const portalKeys = {
  all: ['portal'] as const,
  vehicles: (search: PortalVehiclesSearch) =>
    [...portalKeys.all, 'vehicles', 'list', search] as const,
  vehicle: (vehicleId: string) =>
    [...portalKeys.all, 'vehicles', 'detail', vehicleId] as const,
  workOrders: (search: PortalWorkOrdersSearch) =>
    [...portalKeys.all, 'work-orders', 'list', search] as const,
  workOrder: (workOrderId: string) =>
    [...portalKeys.all, 'work-orders', 'detail', workOrderId] as const,
}

export const portalQueries = {
  vehicles: (search: PortalVehiclesSearch) =>
    queryOptions({
      queryKey: portalKeys.vehicles(search),
      queryFn: () => listMyVehicles({ data: search }),
      placeholderData: keepPreviousData,
    }),
  vehicle: (vehicleId: string) =>
    queryOptions({
      queryKey: portalKeys.vehicle(vehicleId),
      queryFn: () => getMyVehicle({ data: { vehicleId } }),
    }),
  workOrders: (search: PortalWorkOrdersSearch) =>
    queryOptions({
      queryKey: portalKeys.workOrders(search),
      queryFn: () => listMyWorkOrders({ data: search }),
      // Al cambiar de pestaña o de página, la lista anterior se queda
      // atenuada hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
  workOrder: (workOrderId: string) =>
    queryOptions({
      queryKey: portalKeys.workOrder(workOrderId),
      queryFn: () => getMyWorkOrder({ data: { workOrderId } }),
    }),
}

/**
 * La respuesta del cliente a su presupuesto. La API devuelve la orden
 * actualizada: va directo a la caché del detalle, y se refrescan las listas
 * (cambió su estado y ya no tiene presupuesto pendiente).
 */
export function useDecideMyQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: PortalDecisionRequest) =>
      decideMyQuote({ data: request }),
    onSuccess: async ({ order, message }) => {
      toast.success(message)
      queryClient.setQueryData(portalKeys.workOrder(order.workOrderId), order)
      await queryClient.invalidateQueries({
        queryKey: [...portalKeys.all, 'work-orders', 'list'],
      })
    },
  })
}
