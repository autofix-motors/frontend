import { z } from 'zod'
import type { components } from '#/types/api.gen'

// La sesión que devuelve la API en /auth/login, /auth/refresh y /auth/session:
// quién es y con qué rol.
export type CurrentSession = components['schemas']['CurrentSession']
export type UserRole = components['schemas']['UserRole']

/** Cómo se le muestra cada rol al usuario. */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MECHANIC: 'Mecánico',
}

/**
 * Si el usuario tiene uno de los roles indicados. Decide qué se le muestra: un
 * botón que la API va a rechazar con 403 no se dibuja. La API vuelve a
 * comprobarlo; esto es para la experiencia, no para la seguridad.
 */
export function hasRole(
  session: Pick<CurrentSession, 'role'>,
  ...roles: UserRole[]
): boolean {
  return roles.includes(session.role)
}

// Las mismas reglas del LoginDto del backend, para dar el error al momento. El
// correo se normaliza igual que allá: «Admin@Taller.local» es el mismo usuario.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Ingresa un correo válido' })),
  password: z
    .string()
    .min(1, 'Ingresa la contraseña')
    .max(200, 'La contraseña es demasiado larga'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * A dónde volver después del login. Solo se acepta una ruta de la propia app
 * (`/orders?page=2`): un `redirect` a otro sitio (`//otro.com`, `https://…`)
 * convertiría el login en un trampolín para mandar al usuario a una página
 * falsa con la URL de la app en el enlace.
 */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
    ? value
    : '/'
}
