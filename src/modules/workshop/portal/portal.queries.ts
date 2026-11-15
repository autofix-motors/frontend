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
  vehicle: (vehiculoId: string) =>
    [...portalKeys.all, 'vehicles', 'detail', vehiculoId] as const,
  workOrders: (search: PortalWorkOrdersSearch) =>
    [...portalKeys.all, 'work-orders', 'list', search] as const,
  workOrder: (ordenTrabajoId: string) =>
    [...portalKeys.all, 'work-orders', 'detail', ordenTrabajoId] as const,
}

export const portalQueries = {
  vehicles: (search: PortalVehiclesSearch) =>
    queryOptions({
      queryKey: portalKeys.vehicles(search),
      queryFn: () => listMyVehicles({ data: search }),
      placeholderData: keepPreviousData,
    }),
  vehicle: (vehiculoId: string) =>
    queryOptions({
      queryKey: portalKeys.vehicle(vehiculoId),
      queryFn: () => getMyVehicle({ data: { vehiculoId } }),
    }),
  workOrders: (search: PortalWorkOrdersSearch) =>
    queryOptions({
      queryKey: portalKeys.workOrders(search),
      queryFn: () => listMyWorkOrders({ data: search }),
      // Al cambiar de pestaña o de página, la lista anterior se queda
      // atenuada hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
  workOrder: (ordenTrabajoId: string) =>
    queryOptions({
      queryKey: portalKeys.workOrder(ordenTrabajoId),
      queryFn: () => getMyWorkOrder({ data: { ordenTrabajoId } }),
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
      queryClient.setQueryData(
        portalKeys.workOrder(order.ordenTrabajoId),
        order,
      )
      await queryClient.invalidateQueries({
        queryKey: [...portalKeys.all, 'work-orders', 'list'],
      })
    },
  })
}
