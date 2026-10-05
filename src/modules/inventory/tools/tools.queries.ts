import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  assignTool,
  createTool,
  deleteTool,
  listTools,
  updateTool,
} from './tools.fn'
import type { AssignToolRequest, ToolInput, ToolsSearch } from './tools.schemas'

export const toolsKeys = {
  all: ['tools'] as const,
  list: (search: ToolsSearch) => [...toolsKeys.all, 'list', search] as const,
}

export const toolsQueries = {
  list: (search: ToolsSearch) =>
    queryOptions({
      queryKey: toolsKeys.list(search),
      queryFn: () => listTools({ data: search }),
      // Al cambiar de página o de filtro, la tabla sigue mostrando la página
      // anterior (atenuada) hasta que llega la nueva, en vez de vaciarse.
      placeholderData: keepPreviousData,
    }),
}

// Después de cualquier cambio se invalidan todos los listados de herramientas:
// una entrega o un cambio de estado mueve filas entre los filtros (las de un
// mecánico, las del almacén).
async function onChanged(queryClient: QueryClient, message: string) {
  toast.success(message)
  await queryClient.invalidateQueries({ queryKey: toolsKeys.all })
}

export function useCreateTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ToolInput) => createTool({ data: values }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useUpdateTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: { toolId: string; values: ToolInput }) =>
      updateTool({ data: request }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

/** Entregar una herramienta o devolverla al almacén. */
export function useAssignTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: AssignToolRequest) => assignTool({ data: request }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}

export function useDeleteTool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => deleteTool({ data: { toolId } }),
    onSuccess: ({ message }) => onChanged(queryClient, message),
  })
}
