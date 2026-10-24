import '@tanstack/react-start/server-only'
import type { components } from '#/types/api.gen'
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
 * Convierte una respuesta de error de la API en un ApiError.
 *
 * La API responde `BaseResponseDto` también en los errores, con el texto para
 * el usuario en `message`. Por si acaso se aceptan un `message` en arreglo y la
 * falta de cuerpo JSON (un error de un proxy o un timeout antes de Nest): los
 * casos terminan en un mensaje legible.
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

/** La paginación de un listado, en el `meta` de la respuesta. */
export type PaginationMeta = components['schemas']['PaginationMeta']

/**
 * Lo que responde la API en todos los endpoints (`BaseResponseDto` del
 * backend): el resultado en `data`, el texto para el usuario en `message` y,
 * en un listado, la paginación en `meta`.
 */
export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  statusCode: number
  meta?: PaginationMeta
}

/** Llama a la API y devuelve la respuesta completa, o lanza un ApiError. */
export async function callApiEnvelope<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const response = await fetchApi(path, options)
  return (await response.json()) as ApiEnvelope<T>
}

/** Llama a la API y devuelve solo `data`, o lanza un ApiError. */
export async function callApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (await callApiEnvelope<T>(path, options)).data
}

/** Una página de un listado, lista para la tabla. */
export type Page<T> = { items: T[]; meta: PaginationMeta }

/** Llama a un listado y devuelve sus filas con la paginación. */
export async function callApiPage<T>(
  path: string,
  options: RequestInit = {},
): Promise<Page<T>> {
  const envelope = await callApiEnvelope<T[]>(path, options)
  if (!envelope.meta) {
    throw new ApiError(500, 'La API no devolvió la paginación del listado')
  }
  return { items: envelope.data, meta: envelope.meta }
}

/**
 * Arma la query de un listado sin los filtros vacíos: `undefined`, `null` y el
 * texto vacío no viajan, para que la API aplique sus valores por defecto.
 */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
