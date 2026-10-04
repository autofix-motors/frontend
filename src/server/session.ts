import '@tanstack/react-start/server-only'
import {
  deleteCookie,
  getCookie,
  getRequest,
  setCookie,
} from '@tanstack/react-start/server'

// Las cookies de sesión entre el navegador y el BFF. El navegador nunca ve las
// de NestJS: el BFF lee los tokens que manda la API y pone las suyas.
//
// No se reenvían tal cual por dos motivos. La de refresco de Nest tiene
// `path: '/auth'`, y el navegador no la mandaría a las server functions, que
// viven en otra ruta. Y en local los puertos 3000 y 3001 comparten cookies: con
// los mismos nombres, un login desde Swagger se colaría en el frontend.

const ACCESS_COOKIE = 'afm_web_access'
const REFRESH_COOKIE = 'afm_web_refresh'

// Los nombres con los que NestJS pone y lee sus cookies (repo backend,
// src/core/auth/cookies.ts).
const API_ACCESS_COOKIE = 'afm_access'
const API_REFRESH_COOKIE = 'afm_refresh'

export type ApiToken = { value: string; maxAge?: number }

/**
 * Los tokens que manda la API en sus `Set-Cookie`, con su duración en segundos.
 * La duración la sigue decidiendo el backend (ACCESS_TOKEN_MINUTES,
 * REFRESH_TOKEN_DAYS); el BFF solo la copia.
 */
export function readApiTokens(headers: Headers): {
  access?: ApiToken
  refresh?: ApiToken
} {
  const tokens: { access?: ApiToken; refresh?: ApiToken } = {}

  for (const cookie of headers.getSetCookie()) {
    const [pair = '', ...attributes] = cookie.split(';')
    const separator = pair.indexOf('=')
    if (separator === -1) continue

    const name = pair.slice(0, separator).trim()
    const value = pair.slice(separator + 1).trim()
    // Nest borra una cookie mandándola vacía: eso no es un token.
    if (!value) continue

    const maxAge = attributes
      .map((attribute) => attribute.trim().split('='))
      .find(([key]) => key?.toLowerCase() === 'max-age')?.[1]
    const token = { value, maxAge: maxAge ? Number(maxAge) : undefined }

    if (name === API_ACCESS_COOKIE) tokens.access = token
    if (name === API_REFRESH_COOKIE) tokens.refresh = token
  }

  return tokens
}

/**
 * Qué hacer con la sesión según las cookies que trae el navegador. La de acceso
 * vence junto con su JWT, así que no tenerla significa que hay que renovar.
 */
export function nextSessionStep(
  hasAccess: boolean,
  hasRefresh: boolean,
): 'use-access' | 'refresh' | 'none' {
  if (hasAccess) return 'use-access'
  if (hasRefresh) return 'refresh'
  return 'none'
}

// Dentro de un mismo render en el servidor, getCookie lee la cabecera de la
// petición que llegó, no lo que se acaba de poner en la respuesta. Si getSession
// renovó el acceso, los loaders que corren después en esa misma petición tienen
// que usar el token nuevo, no el vencido: se guarda aquí, por petición.
const renewedAccess = new WeakMap<object, string>()

/** El token de acceso de esta petición: el recién renovado, o el de la cookie. */
export function accessToken(): string | undefined {
  return renewedAccess.get(getRequest()) ?? getCookie(ACCESS_COOKIE)
}

export function refreshToken(): string | undefined {
  return getCookie(REFRESH_COOKIE)
}

/** La cabecera `Cookie` que espera NestJS, con los tokens que se le pasen. */
export function apiCookieHeader(tokens: {
  access?: string
  refresh?: string
}): string | undefined {
  const cookies = [
    tokens.access && `${API_ACCESS_COOKIE}=${tokens.access}`,
    tokens.refresh && `${API_REFRESH_COOKIE}=${tokens.refresh}`,
  ].filter(Boolean)
  return cookies.length ? cookies.join('; ') : undefined
}

/**
 * - httpOnly: JavaScript del navegador no puede leerlas.
 * - SameSite=Lax y no Strict: con Strict, abrir un enlace de la app desde un correo
 *   llega sin cookie y pide login otra vez. Lax no las manda en un POST desde
 *   otro sitio, y toda mutación es un POST de una server function.
 * - Secure en producción: solo viajan por HTTPS.
 */
function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: import.meta.env.PROD,
    path: '/',
    maxAge,
  }
}

/**
 * Pone en el navegador los tokens que mandó la API en un login o un refresco.
 * Devuelve si llegó un token de acceso.
 */
export function storeSession(headers: Headers): boolean {
  const { access, refresh } = readApiTokens(headers)
  if (access) {
    setCookie(ACCESS_COOKIE, access.value, cookieOptions(access.maxAge))
    renewedAccess.set(getRequest(), access.value)
  }
  if (refresh) {
    setCookie(REFRESH_COOKIE, refresh.value, cookieOptions(refresh.maxAge))
  }
  return Boolean(access)
}

export function clearSession(): void {
  renewedAccess.delete(getRequest())
  deleteCookie(ACCESS_COOKIE, cookieOptions())
  deleteCookie(REFRESH_COOKIE, cookieOptions())
}
