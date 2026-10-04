import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { ApiError, callApi, fetchApi } from '#/server/api'
import {
  accessToken,
  apiCookieHeader,
  clearSession,
  nextSessionStep,
  refreshToken,
  storeSession,
} from '#/server/session'
import { loginSchema } from './auth.schemas'
import type { CurrentSession } from './auth.schemas'

// Iniciar, cerrar y consultar la sesión. Los tokens nunca llegan al navegador:
// la API los manda en Set-Cookie, el BFF los guarda en sus propias cookies
// httpOnly (server/session.ts) y los reenvía en cada llamada.

// El backend registra con qué navegador se abrió cada sesión. Detrás del BFF, el
// que llama es el servidor de Start: se le pasa el User-Agent del navegador.
function browserHeaders(): Record<string, string> {
  const userAgent = getRequestHeader('user-agent')
  return userAgent ? { 'User-Agent': userAgent } : {}
}

export const login = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const response = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: browserHeaders(),
    })
    storeSession(response.headers)
    return (await response.json()) as CurrentSession
  })

/**
 * Renueva el acceso con el token de refresco. Devuelve si lo consiguió; si no,
 * borra las cookies, que ya no sirven.
 */
async function renewSession(refresh: string): Promise<boolean> {
  try {
    const response = await fetchApi('/auth/refresh', {
      method: 'POST',
      headers: {
        ...browserHeaders(),
        Cookie: apiCookieHeader({ refresh }) ?? '',
      },
    })
    return storeSession(response.headers)
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      clearSession()
      return false
    }
    throw error
  }
}

/**
 * La sesión del usuario, o null si no tiene. La llama el beforeLoad del layout
 * de la app antes de cada navegación.
 *
 * **Es el único lugar donde se renueva la sesión.** El backend rota el token de
 * refresco y, si le llega uno ya usado, revoca la sesión entera: dos
 * renovaciones en paralelo con el mismo token la cerrarían. Aquí corre una vez
 * por navegación, antes que cualquier loader, así que la renovación no se
 * cruza con nada. Por eso callApi nunca renueva ante un 401.
 */
export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentSession | null> => {
    const refresh = refreshToken()
    const step = nextSessionStep(Boolean(accessToken()), Boolean(refresh))
    if (step === 'none') return null

    const renewed = step === 'refresh'
    if (renewed && !(refresh && (await renewSession(refresh)))) return null

    try {
      return await callApi<CurrentSession>('/auth/session')
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) throw error
      // El acceso estaba pero la API lo rechazó (lo revocaron, o el reloj del
      // servidor adelantó su vencimiento): se renueva una vez y se reintenta.
      if (!renewed && refresh && (await renewSession(refresh))) {
        return callApi<CurrentSession>('/auth/session')
      }
      clearSession()
      return null
    }
  },
)

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const refresh = refreshToken()
  try {
    // El backend revoca la sesión con el token de refresco.
    if (refresh) {
      await fetchApi('/auth/logout', {
        method: 'POST',
        headers: { Cookie: apiCookieHeader({ refresh }) ?? '' },
      })
    }
  } catch (error) {
    // Si la API no responde, las cookies se borran igual: el usuario pidió
    // salir. El token sigue vivo en el backend hasta que venza.
    console.error('No se pudo revocar la sesión en la API', error)
  } finally {
    clearSession()
  }
})
