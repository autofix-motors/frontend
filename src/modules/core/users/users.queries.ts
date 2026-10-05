import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  changeUserPassword,
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from './users.fn'
import { defaultUsersSearch, userOption } from './users.schemas'
import type {
  CreateUserInput,
  PasswordFormValues,
  UpdateUserInput,
  UsersSearch,
} from './users.schemas'

/** Qué usuarios ofrece un combobox: los que coinciden con el texto. */
type UserOptionsParams = { search: string; onlyActive: boolean }

export const usersKeys = {
  all: ['users'] as const,
  list: (search: UsersSearch) => [...usersKeys.all, 'list', search] as const,
  detail: (userId: string) => [...usersKeys.all, 'detail', userId] as const,
  options: (params: UserOptionsParams) =>
    [...usersKeys.all, 'options', params] as const,
}

export const usersQueries = {
  list: (search: UsersSearch) =>
    queryOptions({
      queryKey: usersKeys.list(search),
      queryFn: () => listUsers({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
  detail: (userId: string) =>
    queryOptions({
      queryKey: usersKeys.detail(userId),
      queryFn: () => getUser({ data: { userId } }),
    }),
  /**
   * El personal para elegir en un combobox, buscado en la API con el mismo
   * listado (20 por vez, por nombre o correo). Al asignar una herramienta
   * solo se ofrecen los activos; un filtro los ofrece todos. Como `/users`,
   * solo para el administrador.
   */
  options: (params: UserOptionsParams) =>
    queryOptions({
      queryKey: usersKeys.options(params),
      queryFn: async () => {
        const page = await listUsers({
          data: {
            ...defaultUsersSearch,
            pageSize: 20,
            search: params.search || undefined,
            isActive: params.onlyActive || undefined,
          },
        })
        return page.items.map(userOption)
      },
    }),
}

// Después de cualquier cambio se invalidan todos los listados del personal: una
// alta o un borrado mueve filas entre páginas, y averiguar cuáles cambian no
// vale la complejidad.
async function onChanged(queryClient: QueryClient, message: string) {
  toast.success(message)
  await queryClient.invalidateQueries({ queryKey: usersKeys.all })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateUserInput) => createUser({ data: values }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { userId: string; values: UpdateUserInput }) =>
      updateUser({ data: request }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useChangeUserPassword() {
  return useMutation({
    mutationFn: (request: { userId: string; values: PasswordFormValues }) =>
      changeUserPassword({ data: request }),
    // El listado no muestra nada que cambie con la contraseña: no se recarga.
    onSuccess: ({ message }) => toast.success(message),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}
