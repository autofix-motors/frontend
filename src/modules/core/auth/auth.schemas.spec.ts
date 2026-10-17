import {
  afterLogin,
  changePasswordFormSchema,
  changePasswordRequestSchema,
  hasRole,
  homeFor,
  loginSchema,
  safeRedirect,
} from './auth.schemas'
import type { CurrentSession } from './auth.schemas'

function session(overrides: Partial<CurrentSession> = {}): CurrentSession {
  return {
    role: 'MECHANIC',
    name: 'Ana',
    email: 'ana@taller.local',
    mustChangePassword: false,
    userId: 'u1',
    customerId: null,
    ...overrides,
  }
}

const customer = (overrides: Partial<CurrentSession> = {}) =>
  session({ role: 'CUSTOMER', userId: null, customerId: 'c1', ...overrides })

describe('hasRole', () => {
  it('es verdadero si el usuario tiene alguno de los roles', () => {
    expect(hasRole({ role: 'MECHANIC' }, 'ADMIN', 'MECHANIC')).toBe(true)
    expect(hasRole({ role: 'MECHANIC' }, 'ADMIN')).toBe(false)
    expect(hasRole({ role: 'CUSTOMER' }, 'ADMIN', 'MECHANIC')).toBe(false)
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

describe('homeFor', () => {
  it('con la contraseña temporal, siempre a cambiarla', () => {
    expect(homeFor(session({ mustChangePassword: true }))).toBe(
      '/change-password',
    )
    expect(homeFor(customer({ mustChangePassword: true }))).toBe(
      '/change-password',
    )
  })

  it('el cliente a su portal y el personal a la app', () => {
    expect(homeFor(customer())).toBe('/portal')
    expect(homeFor(session())).toBe('/')
  })
})

describe('afterLogin', () => {
  it('vuelve a la página que se quería abrir si corresponde a quien entró', () => {
    expect(afterLogin(session(), '/workshop/work-orders')).toBe(
      '/workshop/work-orders',
    )
    expect(afterLogin(customer(), '/portal/work-orders')).toBe(
      '/portal/work-orders',
    )
  })

  it('un cliente no vuelve a una página del personal, ni al revés', () => {
    expect(afterLogin(customer(), '/core/users')).toBe('/portal')
    expect(afterLogin(session(), '/portal')).toBe('/')
  })

  it('con la contraseña temporal, primero a cambiarla', () => {
    expect(
      afterLogin(session({ mustChangePassword: true }), '/core/users'),
    ).toBe('/change-password')
  })

  it('no sigue un redirect a otro sitio', () => {
    expect(afterLogin(session(), '//otro.com')).toBe('/')
  })
})

describe('loginSchema', () => {
  it('acepta un documento o un correo, sin espacios alrededor', () => {
    expect(
      loginSchema.parse({ identifier: '  45678912 ', password: 'x' }).identifier,
    ).toBe('45678912')
    expect(
      loginSchema.safeParse({ identifier: 'ana@taller.local', password: 'x' })
        .success,
    ).toBe(true)
  })

  it('si parece un correo, tiene que serlo', () => {
    expect(
      loginSchema.safeParse({ identifier: 'ana@', password: 'x' }).error
        ?.issues[0]?.message,
    ).toBe('Ingresa un correo válido')
  })

  it('pide el documento o correo y la contraseña', () => {
    expect(
      loginSchema
        .safeParse({ identifier: ' ', password: '' })
        .error?.issues.map((issue) => issue.message),
    ).toEqual(['Ingresa tu documento o correo', 'Ingresa la contraseña'])
  })
})

describe('changePasswordFormSchema', () => {
  const valid = {
    currentPassword: 'Temporal123',
    newPassword: 'Mi-clave-nueva',
    confirmation: 'Mi-clave-nueva',
  }

  it('acepta una nueva de 8 o más, confirmada y distinta de la actual', () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true)
  })

  it('marca la confirmación distinta y la nueva igual a la actual', () => {
    expect(
      changePasswordFormSchema.safeParse({ ...valid, confirmation: 'otra' })
        .error?.issues,
    ).toMatchObject([
      { path: ['confirmation'], message: 'Las contraseñas no coinciden' },
    ])
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: 'Igual-1234',
        newPassword: 'Igual-1234',
        confirmation: 'Igual-1234',
      }).error?.issues,
    ).toMatchObject([{ path: ['newPassword'] }])
  })

  it('a la API no viaja la confirmación', () => {
    expect(changePasswordRequestSchema.parse(valid)).toStrictEqual({
      currentPassword: 'Temporal123',
      newPassword: 'Mi-clave-nueva',
    })
  })
})
