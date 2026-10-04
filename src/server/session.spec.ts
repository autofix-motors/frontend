import { apiCookieHeader, nextSessionStep, readApiTokens } from './session'

// Lo que decide algo: qué tokens se sacan de la respuesta de la API y cuándo se
// renueva la sesión. Poner y borrar cookies es del framework.

vi.mock('@tanstack/react-start/server', () => ({}))

// Así responde NestJS (express res.cookie) a un login o un refresco.
const loginHeaders = () => {
  const headers = new Headers()
  headers.append(
    'set-cookie',
    'afm_access=eyJ.jwt.firma; Max-Age=900; Path=/; Expires=Thu, 25 Sep 2026 17:15:00 GMT; HttpOnly; SameSite=Strict',
  )
  headers.append(
    'set-cookie',
    'afm_refresh=token-opaco; Max-Age=604800; Path=/auth; Expires=Thu, 02 Oct 2026 17:00:00 GMT; HttpOnly; SameSite=Strict',
  )
  return headers
}

describe('readApiTokens', () => {
  it('saca los dos tokens con la duración que decide el backend', () => {
    expect(readApiTokens(loginHeaders())).toEqual({
      access: { value: 'eyJ.jwt.firma', maxAge: 900 },
      refresh: { value: 'token-opaco', maxAge: 604800 },
    })
  })

  it('ignora las cookies que Nest borra (valor vacío)', () => {
    const headers = new Headers()
    headers.append(
      'set-cookie',
      'afm_access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    )
    expect(readApiTokens(headers)).toEqual({})
  })

  it('ignora cookies que no son de sesión', () => {
    const headers = new Headers()
    headers.append('set-cookie', 'otra=valor; Path=/')
    expect(readApiTokens(headers)).toEqual({})
  })
})

describe('nextSessionStep', () => {
  it('usa el acceso cuando lo hay, aunque también haya refresco', () => {
    expect(nextSessionStep(true, true)).toBe('use-access')
  })

  it('renueva cuando el acceso venció y queda el refresco', () => {
    expect(nextSessionStep(false, true)).toBe('refresh')
  })

  it('no hay sesión sin ninguno de los dos', () => {
    expect(nextSessionStep(false, false)).toBe('none')
  })
})

describe('apiCookieHeader', () => {
  it('usa los nombres de cookie que lee NestJS', () => {
    expect(apiCookieHeader({ access: 'a', refresh: 'r' })).toBe(
      'afm_access=a; afm_refresh=r',
    )
  })

  it('no arma cabecera sin tokens', () => {
    expect(apiCookieHeader({})).toBeUndefined()
  })
})
