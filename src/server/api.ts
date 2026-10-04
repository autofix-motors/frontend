import '@tanstack/react-start/server-only'
import { getServerEnv } from './env'
import { accessToken, apiCookieHeader } from './session'

// El único punto que habla con la API de NestJS. Lo usan las server functions
// de cada módulo (modules/<group>/<module>/<module>.fn.ts); el navegador nunca
// llama a la API directamente.

/** Un error que devolvió la API, con el mensaje en español que ya trae. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const GENERIC_MESSAGE = 'No se pudo completar la operación'

/**
 * Convierte una respuesta de error de NestJS en un ApiError.
 *
 * NestJS responde `{ statusCode, message }`, pero `message` es un arreglo
 * cuando falla la validación de un DTO, y puede no venir si el error lo generó
 * algo antes de Nest (un proxy, un timeout). Los tres casos terminan en un
 * mensaje legible.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return new ApiError(response.status, GENERIC_MESSAGE)
  }

  const message =
    body && typeof body === 'object' && 'message' in body
      ? body.message
      : undefined

  if (typeof message === 'string' && message) {
    return new ApiError(response.status, message)
  }
  if (Array.isArray(message) && message.length) {
    return new ApiError(response.status, message.join('. '))
  }
  return new ApiError(response.status, GENERIC_MESSAGE)
}

// Sin límite, una API colgada deja colgado también el renderizado en el
// servidor, y la página nunca responde. Diez segundos sobran para cualquier
// consulta normal; una operación que de verdad tarde más pasa su propio signal.
const TIMEOUT_MS = 10_000

/**
 * Llama a la API y devuelve la respuesta sin leer, o lanza un ApiError si la API
 * respondió con error. Manda la sesión del usuario: la cookie de acceso, salvo
 * que la llamada traiga su propia cabecera `Cookie` (el refresco y el logout
 * mandan la de refresco).
 *
 * Nunca renueva la sesión ante un 401: eso solo lo hace getSession (ver
 * modules/core/auth/auth.fn.ts).
 */
export async function fetchApi(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookie = apiCookieHeader({ access: accessToken() })

  let response: Response
  try {
    response = await fetch(new URL(path, getServerEnv().API_URL), {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Solo si el cuerpo es JSON. Con FormData (un archivo), fetch arma el
        // Content-Type con su boundary; si se fija aquí, el multipart no se
        // puede leer.
        ...(typeof options.body === 'string' && {
          'Content-Type': 'application/json',
        }),
        ...(cookie && { Cookie: cookie }),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(504, 'La API no respondió a tiempo')
    }
    // Sin respuesta: la API está caída o la URL es incorrecta. El detalle queda
    // en el log del servidor; al usuario le llega un mensaje que entiende.
    console.error('No se pudo conectar con la API', error)
    throw new ApiError(503, 'No se pudo conectar con el servidor')
  }

  if (!response.ok) throw await toApiError(response)
  return response
}

/** Llama a la API y devuelve el cuerpo ya parseado, o lanza un ApiError. */
export async function callApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetchApi(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
