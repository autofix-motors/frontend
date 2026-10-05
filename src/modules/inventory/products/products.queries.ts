import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from './products.fn'
import type { ProductInput, ProductsSearch } from './products.schemas'

export const productsKeys = {
  all: ['products'] as const,
  list: (search: ProductsSearch) =>
    [...productsKeys.all, 'list', search] as const,
}

export const productsQueries = {
  list: (search: ProductsSearch) =>
    queryOptions({
      queryKey: productsKeys.list(search),
      queryFn: () => listProducts({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
}

// Después de cualquier cambio se invalidan todos los listados de productos:
// una alta, un cambio de stock mínimo o un borrado mueve filas entre páginas y
// entre los filtros (el de stock bajo, por ejemplo).

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductInput) => createProduct({ data: values }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { productId: string; values: ProductInput }) =>
      updateProduct({ data: request }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => deleteProduct({ data: { productId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
  })
}
