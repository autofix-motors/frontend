import { temporaryPasswordMessage, whatsappUrl } from './whatsapp'

describe('whatsappUrl', () => {
  it('a un celular peruano le pone el 51', () => {
    expect(whatsappUrl('987 654 321', 'Hola')).toBe(
      'https://wa.me/51987654321?text=Hola',
    )
    expect(whatsappUrl('51987654321', 'Hola')).toBe(
      'https://wa.me/51987654321?text=Hola',
    )
  })

  it('respeta un número con + y su código de país', () => {
    expect(whatsappUrl('+1 (305) 555-0100', 'Hi')).toBe(
      'https://wa.me/13055550100?text=Hi',
    )
  })

  it('codifica el texto, saltos de línea incluidos', () => {
    expect(whatsappUrl('987654321', 'a b\nc')).toBe(
      'https://wa.me/51987654321?text=a%20b%0Ac',
    )
  })

  it('un fijo o algo que no se reconoce no tiene enlace', () => {
    expect(whatsappUrl('014567890', 'Hola')).toBeNull()
    expect(whatsappUrl('123', 'Hola')).toBeNull()
  })
})

describe('temporaryPasswordMessage', () => {
  it('lleva el usuario, la contraseña, dónde entrar y que debe cambiarla', () => {
    const text = temporaryPasswordMessage({
      name: 'Juan Pérez Rojas',
      loginIdentifier: '45678912',
      temporaryPassword: 'Hk7mQ4pZr2Tx',
      loginUrl: 'https://taller.pe/login',
      isStaff: false,
    })
    expect(text).toContain('Hola, Juan.')
    expect(text).toContain('Usuario: 45678912')
    expect(text).toContain('Contraseña temporal: Hk7mQ4pZr2Tx')
    expect(text).toContain('https://taller.pe/login')
    expect(text).toContain('cambiarla')
    expect(text).not.toContain('Soy interno')
  })

  it('al personal le dice que entre con «Soy interno»', () => {
    expect(
      temporaryPasswordMessage({
        name: 'Ana',
        loginIdentifier: '45678912',
        temporaryPassword: 'x',
        loginUrl: 'https://taller.pe/login',
        isStaff: true,
      }),
    ).toContain('Soy interno')
  })
})
