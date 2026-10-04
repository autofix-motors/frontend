import { hasRole, loginSchema, safeRedirect } from './auth.schemas'

describe('hasRole', () => {
  it('es verdadero si el usuario tiene alguno de los roles', () => {
    expect(hasRole({ role: 'MECHANIC' }, 'ADMIN', 'MECHANIC')).toBe(true)
    expect(hasRole({ role: 'MECHANIC' }, 'ADMIN')).toBe(false)
  })
})
describe('safeRedirect', () => {
  it('acepta una ruta de la app', () => {
    expect(safeRedirect('/orders?page=2')).toBe('/orders?page=2')
  })

  it.each([
    ['otro sitio con esquema', 'https://otro.com'],
    ['otro sitio sin esquema', '//otro.com'],
    ['barra invertida, que el navegador trata como //', '/\\otro.com'],
    ['una ruta relativa', 'orders'],
    ['algo que no es texto', 42],
    ['nada', undefined],
  ])('manda al inicio ante %s', (_caso, value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})

describe('loginSchema', () => {
  it('normaliza el correo como el backend', () => {
    expect(
      loginSchema.parse({ email: '  Admin@Taller.local ', password: 'x' })
        .email,
    ).toBe('admin@taller.local')
  })
})
