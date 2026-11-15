import { z } from 'zod'
import { DOCUMENT_TYPE_LABELS } from '#/modules/customer/customers/customers.schemas'
import type { components } from '#/types/api.gen'

// La sesión que devuelve la API en los logins, /auth/refresh, /auth/session y
// /auth/password: quién es, con qué rol y si tiene que cambiar la contraseña.
export type CurrentSession = components['schemas']['CurrentSession']
/** Los roles del personal (lo que se elige en Personal). */
export type UserRole = components['schemas']['RolUsuario']
/** Quién puede tener una sesión: el personal o un cliente. */
export type SessionRole = components['schemas']['RolSesion']

/** Una sesión del personal: la que hay dentro de la app (`_app`). */
export type StaffSession = CurrentSession & {
  rol: UserRole
  usuarioId: string
  correo: string
}

/** Una sesión de cliente: la que hay dentro de su portal. */
export type CustomerSession = CurrentSession & {
  rol: 'CLIENTE'
  clienteId: string
}

/**
 * Los datos de quien tiene la sesión, para «Mi perfil» (GET /auth/profile).
 * Solo lectura; las fechas llegan como marca de tiempo ISO.
 */
export type Profile = components['schemas']['Profile']

/** Cómo se le muestra cada rol al usuario. */
export const ROLE_LABELS: Record<SessionRole, string> = {
  ADMINISTRADOR: 'Administrador',
  MECANICO: 'Mecánico',
  CLIENTE: 'Cliente',
}

export function isStaffSession(
  session: CurrentSession,
): session is StaffSession {
  return session.rol !== 'CLIENTE'
}

export function isCustomerSession(
  session: CurrentSession,
): session is CustomerSession {
  return session.rol === 'CLIENTE'
}

/**
 * Si el usuario tiene uno de los roles indicados. Decide qué se le muestra: un
 * botón que la API va a rechazar con 403 no se dibuja. La API vuelve a
 * comprobarlo; esto es para la experiencia, no para la seguridad.
 */
export function hasRole(
  session: Pick<CurrentSession, 'rol'>,
  ...roles: SessionRole[]
): boolean {
  return roles.includes(session.rol)
}

/**
 * A qué login se entra: el del cliente (por omisión) o el del personal («Soy
 * interno»). Son dos endpoints: un mismo DNI puede ser de un mecánico y de un
 * cliente.
 */
export type LoginAudience = 'customer' | 'staff'

// Las mismas reglas del LoginDto del backend, para dar el error al momento. El
// documento o correo lo interpreta la API; aquí solo se exige que esté y, si
// parece un correo, que lo sea.
export const loginSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(1, 'Ingresa tu documento o correo')
    .max(254, 'El documento o correo es demasiado largo')
    .refine(
      (value) => !value.includes('@') || z.email().safeParse(value).success,
      'Ingresa un correo válido',
    ),
  contrasena: z
    .string()
    .min(1, 'Ingresa la contraseña')
    .max(200, 'La contraseña es demasiado larga'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const loginRequestSchema = loginSchema.extend({
  audience: z.enum(['customer', 'staff']),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>

/**
 * Cambiar la propia contraseña: las reglas del ChangeOwnPasswordDto, más la
 * confirmación, que no viaja.
 */
export const changePasswordFormSchema = z
  .object({
    contrasenaActual: z
      .string()
      .min(1, 'Ingresa tu contraseña actual')
      .max(200, 'La contraseña es demasiado larga'),
    contrasenaNueva: z
      .string()
      .min(8, 'La contraseña nueva tiene al menos 8 caracteres')
      .max(200, 'La contraseña es demasiado larga'),
    confirmacion: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.contrasenaNueva !== value.confirmacion) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmacion'],
        message: 'Las contraseñas no coinciden',
      })
    }
    if (
      value.contrasenaNueva &&
      value.contrasenaNueva === value.contrasenaActual
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['contrasenaNueva'],
        message: 'La contraseña nueva tiene que ser distinta de la actual',
      })
    }
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

export const emptyChangePasswordForm: ChangePasswordFormValues = {
  contrasenaActual: '',
  contrasenaNueva: '',
  confirmacion: '',
}

/** Lo que se le manda a la API: sin la confirmación. */
export const changePasswordRequestSchema = changePasswordFormSchema.transform(
  ({ contrasenaActual, contrasenaNueva }) => ({
    contrasenaActual,
    contrasenaNueva,
  }),
)

/**
 * La página de inicio de cada sesión: cambiar la contraseña si es temporal; si
 * no, el portal para el cliente y la app para el personal.
 */
export function homeFor(session: CurrentSession): string {
  if (session.debeCambiarContrasena) return '/change-password'
  return isCustomerSession(session) ? '/portal' : '/'
}

/**
 * «Mi perfil», dentro del layout de cada uno: el portal para el cliente y la
 * app para el personal. Ahí también se cambia la contraseña por gusto;
 * `/change-password` queda solo para la temporal.
 */
export function profilePageFor(
  session: CurrentSession,
): '/portal/profile' | '/account/profile' {
  return isCustomerSession(session) ? '/portal/profile' : '/account/profile'
}

/** De quién es la sesión: el usuario del personal o el cliente. */
export function sessionOwnerId(session: CurrentSession): string {
  return session.usuarioId ?? session.clienteId ?? ''
}

/**
 * «DNI 45678912», «Carné de extranjería 001234567»; null si no tiene
 * documento registrado.
 */
export function documentLabel(
  profile: Pick<Profile, 'tipoDocumento' | 'numeroDocumento'>,
): string | null {
  if (!profile.numeroDocumento) return null
  return profile.tipoDocumento
    ? `${DOCUMENT_TYPE_LABELS[profile.tipoDocumento]} ${profile.numeroDocumento}`
    : profile.numeroDocumento
}

/**
 * A dónde ir después de entrar: la página que se quería abrir, si es de la
 * propia app y corresponde a quien entró (un cliente no vuelve a una página
 * del personal ni al revés); si no, su inicio.
 */
export function afterLogin(session: CurrentSession, redirect?: string): string {
  const home = homeFor(session)
  if (session.debeCambiarContrasena || !redirect) return home
  const target = safeRedirect(redirect)
  const isPortal = target === '/portal' || target.startsWith('/portal/')
  return isPortal === isCustomerSession(session) ? target : home
}

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
