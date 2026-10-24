import { initials } from './initials'

describe('initials', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(initials('Eduardo Huarcaya Quispe')).toBe('EH')
  })

  it('ignora los espacios de sobra y usa mayúsculas', () => {
    expect(initials('  ana   maría ')).toBe('AM')
  })

  it('con una sola palabra, una inicial', () => {
    expect(initials('Taller')).toBe('T')
  })
})
