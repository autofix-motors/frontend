import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from './customers.fn'
import type { CustomerInput, CustomersSearch } from './customers.schemas'

export const customersKeys = {
  all: ['customers'] as const,
  list: (search: CustomersSearch) =>
    [...customersKeys.all, 'list', search] as const,
}

export const customersQueries = {
  list: (search: CustomersSearch) =>
    queryOptions({
      queryKey: customersKeys.list(search),
      queryFn: () => listCustomers({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
}

// Después de cualquier cambio se invalidan todos los listados de clientes: una
// alta o un borrado mueve filas entre páginas, y averiguar cuáles cambian no
// vale la complejidad.

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CustomerInput) => createCustomer({ data: values }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { customerId: string; values: CustomerInput }) =>
      updateCustomer({ data: request }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (customerId: string) =>
      deleteCustomer({ data: { customerId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}
