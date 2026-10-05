import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersKeys } from '#/modules/customer/customers/customers.queries'
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicleBrands,
  listVehicles,
  updateVehicle,
} from './vehicles.fn'
import { defaultVehiclesSearch, vehicleOption } from './vehicles.schemas'
import type { VehicleInput, VehiclesSearch } from './vehicles.schemas'

export const vehiclesKeys = {
  all: ['vehicles'] as const,
  list: (search: VehiclesSearch) =>
    [...vehiclesKeys.all, 'list', search] as const,
  brands: () => [...vehiclesKeys.all, 'brands'] as const,
  detail: (vehicleId: string) =>
    [...vehiclesKeys.all, 'detail', vehicleId] as const,
  options: (search: string) =>
    [...vehiclesKeys.all, 'options', search] as const,
}

export const vehiclesQueries = {
  list: (search: VehiclesSearch) =>
    queryOptions({
      queryKey: vehiclesKeys.list(search),
      queryFn: () => listVehicles({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
  brands: () =>
    queryOptions({
      queryKey: vehiclesKeys.brands(),
      queryFn: () => listVehicleBrands(),
    }),
  detail: (vehicleId: string) =>
    queryOptions({
      queryKey: vehiclesKeys.detail(vehicleId),
      queryFn: () => getVehicle({ data: { vehicleId } }),
    }),
  /**
   * Los vehículos para elegir en un combobox (el que ingresa en una orden de
   * trabajo), buscados en la API con el mismo listado: 20 por vez, por placa,
   * marca, modelo o dueño.
   */
  options: (search: string) =>
    queryOptions({
      queryKey: vehiclesKeys.options(search),
      queryFn: async () => {
        const page = await listVehicles({
          data: {
            ...defaultVehiclesSearch,
            pageSize: 20,
            search: search || undefined,
          },
        })
        return page.items.map(vehicleOption)
      },
    }),
}

// Después de cualquier cambio se invalidan los vehículos (listados y marcas) y
// los clientes: su listado muestra cuántos vehículos tiene cada uno.
async function onChanged(queryClient: QueryClient, message: string) {
  toast.success(message)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehiclesKeys.all }),
    queryClient.invalidateQueries({ queryKey: customersKeys.all }),
  ])
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: VehicleInput) => createVehicle({ data: values }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { vehicleId: string; values: VehicleInput }) =>
      updateVehicle({ data: request }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle({ data: { vehicleId } }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}
