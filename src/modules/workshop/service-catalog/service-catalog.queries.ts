import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createServiceCatalogItem,
  deleteServiceCatalogItem,
  listServiceCatalog,
  updateServiceCatalogItem,
} from './service-catalog.fn'
import type {
  ServiceCatalogItemInput,
  ServiceCatalogSearch,
} from './service-catalog.schemas'

export const serviceCatalogKeys = {
  all: ['service-catalog'] as const,
  list: (search: ServiceCatalogSearch) =>
    [...serviceCatalogKeys.all, 'list', search] as const,
}

export const serviceCatalogQueries = {
  list: (search: ServiceCatalogSearch) =>
    queryOptions({
      queryKey: serviceCatalogKeys.list(search),
      queryFn: () => listServiceCatalog({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
}

// Después de cualquier cambio se invalidan todos los listados del catálogo:
// una alta, un cambio de precio o un borrado mueve filas entre páginas.

export function useCreateServiceCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ServiceCatalogItemInput) =>
      createServiceCatalogItem({ data: values }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all })
    },
  })
}

export function useUpdateServiceCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: {
      serviceCatalogItemId: string
      values: ServiceCatalogItemInput
    }) => updateServiceCatalogItem({ data: request }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all })
    },
  })
}

export function useDeleteServiceCatalogItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (serviceCatalogItemId: string) =>
      deleteServiceCatalogItem({ data: { serviceCatalogItemId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: serviceCatalogKeys.all })
    },
  })
}
