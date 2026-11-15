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
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customers.fn'
import { customerOption, defaultCustomersSearch } from './customers.schemas'
import type { CustomerInput, CustomersSearch } from './customers.schemas'

/** Qué clientes ofrece un combobox: los que coinciden con el texto. */
type CustomerOptionsParams = { search: string; onlyActive: boolean }

export const customersKeys = {
  all: ['customers'] as const,
  list: (search: CustomersSearch) =>
    [...customersKeys.all, 'list', search] as const,
  detail: (clienteId: string) =>
    [...customersKeys.all, 'detail', clienteId] as const,
  options: (params: CustomerOptionsParams) =>
    [...customersKeys.all, 'options', params] as const,
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
  detail: (clienteId: string) =>
    queryOptions({
      queryKey: customersKeys.detail(clienteId),
      queryFn: () => getCustomer({ data: { clienteId } }),
    }),
  /**
   * Los clientes para elegir en un combobox, buscados en la API con el mismo
   * listado (20 por vez, por nombre). Al asignar un vehículo solo se ofrecen
   * los activos; un filtro los ofrece todos.
   */
  options: (params: CustomerOptionsParams) =>
    queryOptions({
      queryKey: customersKeys.options(params),
      queryFn: async () => {
        const page = await listCustomers({
          data: {
            ...defaultCustomersSearch,
            pageSize: 20,
            search: params.search || undefined,
            activo: params.onlyActive || undefined,
          },
        })
        return page.items.map(customerOption)
      },
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
    mutationFn: (request: { clienteId: string; values: CustomerInput }) =>
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
    mutationFn: (clienteId: string) => deleteCustomer({ data: { clienteId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}
