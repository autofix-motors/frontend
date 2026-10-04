import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { login, logout } from './auth.fn'
import type { LoginInput } from './auth.schemas'

// La sesión no se lee con una consulta: la trae el beforeLoad del layout en el
// contexto del router (context.session). Aquí solo están las dos mutaciones.

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => login({ data: input }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => logout(),
    // Aunque falle, el BFF ya borró las cookies: se sale igual.
    onSettled: async () => {
      // Lo que quedó en la caché es del usuario que salió: el siguiente que
      // inicie sesión en este navegador no tiene que verlo ni por un instante.
      queryClient.clear()
      await router.navigate({ to: '/login' })
    },
  })
}
