import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { changeOwnPassword, getMyProfile, login, logout } from './auth.fn'
import { sessionOwnerId } from './auth.schemas'
import type {
  ChangePasswordFormValues,
  CurrentSession,
  LoginRequest,
} from './auth.schemas'

// La sesión no se lee con una consulta: la trae el beforeLoad del layout en el
// contexto del router (context.session). El perfil sí: son datos que la
// sesión no trae (documento, teléfono, último ingreso) y solo los pide su
// pantalla.

export const authKeys = {
  all: ['auth'] as const,
  // Con el dueño de la sesión en la clave: si otro entra en el mismo
  // navegador sin pasar por «Cerrar sesión» (que vacía la caché), no ve el
  // perfil del anterior.
  profile: (ownerId: string) => [...authKeys.all, 'profile', ownerId] as const,
}

export const authQueries = {
  profile: (session: CurrentSession) =>
    queryOptions({
      queryKey: authKeys.profile(sessionOwnerId(session)),
      queryFn: () => getMyProfile(),
    }),
}

export function useLogin() {
  return useMutation({
    mutationFn: (request: LoginRequest) => login({ data: request }),
  })
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      changeOwnPassword({ data: values }),
    // Sin `router.invalidate()`: volvería a correr el `beforeLoad` de la
    // página actual, y `/change-password`, ya sin la contraseña temporal,
    // redirigiría al perfil antes de llegar al inicio. Con la temporal, el
    // formulario navega al inicio y esa navegación ya pide la sesión nueva; en
    // «Mi perfil» se queda: la sesión del contexto no cambia (ya no tenía la
    // marca) y la siguiente navegación pide la nueva.
    onSuccess: ({ message }) => {
      toast.success(message)
    },
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
