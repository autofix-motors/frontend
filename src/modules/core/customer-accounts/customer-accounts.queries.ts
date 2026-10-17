import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersKeys } from '#/modules/customer/customers/customers.queries'
import { issuePortalAccess, removePortalAccess } from './customer-accounts.fn'

// Cada cambio recarga los clientes: el listado muestra quién tiene acceso. La
// contraseña temporal queda solo en el resultado de la mutación, nunca en la
// caché de consultas.

export function useIssuePortalAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (customerId: string) =>
      issuePortalAccess({ data: { customerId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}

export function useRemovePortalAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (customerId: string) =>
      removePortalAccess({ data: { customerId } }),
    onSuccess: async ({ message }) => {
      toast.success(message)
      await queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}
