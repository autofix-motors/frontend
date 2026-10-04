import { callApi, toApiError } from './api'

// Fuera del servidor de Start no hay petición de la que leer cookies: se simulan
// las que traería el navegador.
const browserCookies = vi.hoisted(() => new Map<string, string>())
vi.mock('@tanstack/react-start/server', () => ({
  getCookie: (name: string) => browserCookies.get(name),
  getRequest: () => ({}),
}))

// Lo que se prueba es lo que decide algo: cómo se traduce cada forma de error de
// la API a un mensaje que la pantalla pueda mostrar.

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status })

describe('toApiError', () => {
  it('usa el mensaje de NestJS cuando es texto', async () => {
    const error = await toApiError(
      jsonResponse(404, { statusCode: 404, message: 'El registro no existe' }),
    )
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('El registro no existe')
  })

  it('une los mensajes cuando la validación devuelve varios', async () => {
    const error = await toApiError(
      jsonResponse(400, {
        statusCode: 400,
        message: ['El nombre es obligatorio', 'El precio no es válido'],
      }),
    )
    expect(error.message).toBe(
      'El nombre es obligatorio. El precio no es válido',
    )
  })

  it('usa un mensaje genérico cuando la respuesta no es JSON', async () => {
    const error = await toApiError(
      new Response('<html>Bad Gateway</html>', { status: 502 }),
    )
    expect(error.statusCode).toBe(502)
    expect(error.message).toBe('No se pudo completar la operación')
  })

  it('usa un mensaje genérico cuando el JSON no trae mensaje', async () => {
    const error = await toApiError(jsonResponse(500, { statusCode: 500 }))
    expect(error.message).toBe('No se pudo completar la operación')
  })
})

describe('callApi', () => {
  beforeEach(() => {
    vi.stubEnv('API_URL', 'http://api.prueba')
  })

  afterEach(() => {
    browserCookies.clear()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  // Las cabeceras con las que se llamó a fetch la primera vez.
  const sentHeaders = (fetchMock: ReturnType<typeof vi.fn>) => {
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    return init.headers as Record<string, string>
  }

  it('manda a la API la sesión del navegador, con el nombre de cookie de Nest', async () => {
    browserCookies.set('afm_web_access', 'jwt-del-usuario')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await callApi('/roles')

    expect(sentHeaders(fetchMock).Cookie).toBe('afm_access=jwt-del-usuario')
  })

  it('no manda cookie cuando el navegador no tiene sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await callApi('/users')

    expect(sentHeaders(fetchMock)).not.toHaveProperty('Cookie')
  })

  it('declara JSON solo cuando el cuerpo es JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await callApi('/users/u1', { method: 'PATCH', body: '{}' })

    expect(sentHeaders(fetchMock)['Content-Type']).toBe('application/json')
  })

  it('no fija el Content-Type de un archivo: fetch pone el del multipart', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await callApi('/users/u1/photo', { method: 'PUT', body: new FormData() })

    expect(sentHeaders(fetchMock)).not.toHaveProperty('Content-Type')
  })

  it('respeta la cookie que manda la llamada (el refresco y el logout)', async () => {
    browserCookies.set('afm_web_access', 'jwt-del-usuario')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await callApi('/auth/refresh', { headers: { Cookie: 'afm_refresh=r1' } })

    expect(sentHeaders(fetchMock).Cookie).toBe('afm_refresh=r1')
  })

  it('devuelve el cuerpo de una respuesta correcta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, [{ id: '1' }])),
    )
    await expect(callApi('/users')).resolves.toEqual([{ id: '1' }])
  })

  it('traduce el vencimiento del tiempo máximo a un 504', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(new DOMException('tiempo agotado', 'TimeoutError')),
    )
    await expect(callApi('/users')).rejects.toMatchObject({
      statusCode: 504,
      message: 'La API no respondió a tiempo',
    })
  })

  it('traduce una API caída a un 503 con un mensaje legible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    )
    await expect(callApi('/users')).rejects.toMatchObject({
      statusCode: 503,
      message: 'No se pudo conectar con el servidor',
    })
  })
})
