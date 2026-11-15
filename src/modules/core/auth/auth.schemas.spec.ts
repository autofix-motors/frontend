import {
  afterLogin,
  changePasswordFormSchema,
  changePasswordRequestSchema,
  hasRole,
  homeFor,
  documentLabel,
  loginSchema,
  profilePageFor,
  safeRedirect,
  sessionOwnerId,
} from './auth.schemas'
import type { CurrentSession } from './auth.schemas'

function session(overrides: Partial<CurrentSession> = {}): CurrentSession {
  return {
    rol: 'MECANICO',
    nombre: 'Ana',
    correo: 'ana@taller.local',
    debeCambiarContrasena: false,
    usuarioId: 'u1',
    clienteId: null,
    ...overrides,
  }
}

const customer = (overrides: Partial<CurrentSession> = {}) =>
  session({ rol: 'CLIENTE', usuarioId: null, clienteId: 'c1', ...overrides })

describe('hasRole', () => {
  it('es verdadero si el usuario tiene alguno de los roles', () => {
    expect(hasRole({ rol: 'MECANICO' }, 'ADMINISTRADOR', 'MECANICO')).toBe(true)
    expect(hasRole({ rol: 'MECANICO' }, 'ADMINISTRADOR')).toBe(false)
    expect(hasRole({ rol: 'CLIENTE' }, 'ADMINISTRADOR', 'MECANICO')).toBe(false)
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
    expect(homeFor(session({ debeCambiarContrasena: true }))).toBe(
      '/change-password',
    )
    expect(homeFor(customer({ debeCambiarContrasena: true }))).toBe(
      '/change-password',
    )
  })

  it('el cliente a su portal y el personal a la app', () => {
    expect(homeFor(customer())).toBe('/portal')
    expect(homeFor(session())).toBe('/')
  })
})

describe('profilePageFor', () => {
  it('cada uno tiene su perfil dentro de su layout', () => {
    expect(profilePageFor(customer())).toBe('/portal/profile')
    expect(profilePageFor(session())).toBe('/account/profile')
  })
})

describe('sessionOwnerId', () => {
  it('es el usuario del personal o el cliente', () => {
    expect(sessionOwnerId(session())).toBe('u1')
    expect(sessionOwnerId(customer())).toBe('c1')
  })
})

describe('documentLabel', () => {
  it('une el tipo, con su nombre largo, y el número', () => {
    expect(
      documentLabel({ tipoDocumento: 'DNI', numeroDocumento: '45678912' }),
    ).toBe('DNI 45678912')
    expect(
      documentLabel({ tipoDocumento: 'CE', numeroDocumento: '001234567' }),
    ).toBe('Carné de extranjería 001234567')
  })

  it('es null si no tiene documento registrado', () => {
    expect(
      documentLabel({ tipoDocumento: null, numeroDocumento: null }),
    ).toBeNull()
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
      afterLogin(session({ debeCambiarContrasena: true }), '/core/users'),
    ).toBe('/change-password')
  })

  it('no sigue un redirect a otro sitio', () => {
    expect(afterLogin(session(), '//otro.com')).toBe('/')
  })
})

describe('loginSchema', () => {
  it('acepta un documento o un correo, sin espacios alrededor', () => {
    expect(
      loginSchema.parse({ identificador: '  45678912 ', contrasena: 'x' })
        .identificador,
    ).toBe('45678912')
    expect(
      loginSchema.safeParse({
        identificador: 'ana@taller.local',
        contrasena: 'x',
      }).success,
    ).toBe(true)
  })

  it('si parece un correo, tiene que serlo', () => {
    expect(
      loginSchema.safeParse({ identificador: 'ana@', contrasena: 'x' }).error
        ?.issues[0]?.message,
    ).toBe('Ingresa un correo válido')
  })

  it('pide el documento o correo y la contraseña', () => {
    expect(
      loginSchema
        .safeParse({ identificador: ' ', contrasena: '' })
        .error?.issues.map((issue) => issue.message),
    ).toEqual(['Ingresa tu documento o correo', 'Ingresa la contraseña'])
  })
})

describe('changePasswordFormSchema', () => {
  const valid = {
    contrasenaActual: 'Temporal123',
    contrasenaNueva: 'Mi-clave-nueva',
    confirmacion: 'Mi-clave-nueva',
  }

  it('acepta una nueva de 8 o más, confirmada y distinta de la actual', () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true)
  })

  it('marca la confirmación distinta y la nueva igual a la actual', () => {
    expect(
      changePasswordFormSchema.safeParse({ ...valid, confirmacion: 'otra' })
        .error?.issues,
    ).toMatchObject([
      { path: ['confirmacion'], message: 'Las contraseñas no coinciden' },
    ])
    expect(
      changePasswordFormSchema.safeParse({
        contrasenaActual: 'Igual-1234',
        contrasenaNueva: 'Igual-1234',
        confirmacion: 'Igual-1234',
      }).error?.issues,
    ).toMatchObject([{ path: ['contrasenaNueva'] }])
  })

  it('a la API no viaja la confirmación', () => {
    expect(changePasswordRequestSchema.parse(valid)).toStrictEqual({
      contrasenaActual: 'Temporal123',
      contrasenaNueva: 'Mi-clave-nueva',
    })
  })
})
