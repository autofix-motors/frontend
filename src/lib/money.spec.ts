import { formatMoney, moneyError } from './money'

describe('formatMoney', () => {
  it('muestra el monto en soles con dos decimales', () => {
    expect(formatMoney('120.00')).toBe('S/ 120.00')
    expect(formatMoney('0.5')).toBe('S/ 0.50')
    expect(formatMoney(80)).toBe('S/ 80.00')
  })

  it('agrupa los miles con coma', () => {
    expect(formatMoney('1250.00')).toBe('S/ 1,250.00')
    expect(formatMoney('99999999.99')).toBe('S/ 99,999,999.99')
    expect(formatMoney('999.99')).toBe('S/ 999.99')
  })

  it('redondea un número a dos decimales, pero no inventa un texto', () => {
    expect(formatMoney(0.1 + 0.2)).toBe('S/ 0.30')
    expect(formatMoney('12.345')).toBe('—')
  })

  it('muestra una raya cuando no hay monto o no se entiende', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney('')).toBe('—')
    expect(formatMoney('S/ 20')).toBe('—')
    expect(formatMoney(Number.NaN)).toBe('—')
  })
})

describe('moneyError', () => {
  const label = 'El precio'

  it('acepta montos con hasta 2 decimales, desde 0 hasta el tope', () => {
    for (const value of ['0', '60', '180.5', '99999999.99']) {
      expect(moneyError(value, label)).toBeNull()
    }
  })

  it('dice qué está mal, igual que la API', () => {
    expect(moneyError('12.345', label)).toBe(
      'El precio tiene como máximo 2 decimales',
    )
    expect(moneyError('-5', label)).toBe('El precio no puede ser negativo')
    expect(moneyError('100000000', label)).toBe(
      'El precio es como máximo 99999999.99',
    )
    expect(moneyError('12,50', label)).toBe(
      'El precio es un monto en soles con hasta 2 decimales, por ejemplo 120.50',
    )
  })
})
