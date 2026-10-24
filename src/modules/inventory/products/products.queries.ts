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
  getProduct,
  listProducts,
  updateProduct,
} from './products.fn'
import { defaultProductsSearch, productOption } from './products.schemas'
import type { ProductInput, ProductsSearch } from './products.schemas'

/** Qué productos ofrece un combobox: los que coinciden con el texto. */
type ProductOptionsParams = { search: string; onlyActive: boolean }

export const productsKeys = {
  all: ['products'] as const,
  list: (search: ProductsSearch) =>
    [...productsKeys.all, 'list', search] as const,
  detail: (productId: string) =>
    [...productsKeys.all, 'detail', productId] as const,
  options: (params: ProductOptionsParams) =>
    [...productsKeys.all, 'options', params] as const,
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
  detail: (productId: string) =>
    queryOptions({
      queryKey: productsKeys.detail(productId),
      queryFn: () => getProduct({ data: { productId } }),
    }),
  /**
   * Los productos para elegir en un combobox, buscados en la API con el mismo
   * listado (20 por vez, por código, nombre o marca). Al registrar una compra
   * o un ajuste solo se ofrecen los activos; un filtro los ofrece todos.
   */
  options: (params: ProductOptionsParams) =>
    queryOptions({
      queryKey: productsKeys.options(params),
      queryFn: async () => {
        const page = await listProducts({
          data: {
            ...defaultProductsSearch,
            pageSize: 20,
            search: params.search || undefined,
            isActive: params.onlyActive || undefined,
          },
        })
        return page.items.map(productOption)
      },
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
