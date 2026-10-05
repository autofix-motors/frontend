import {
  formatQuantity,
  movementQuantityError,
  quantityError,
} from './quantity'

describe('formatQuantity', () => {
  it('muestra la fracción solo cuando la hay', () => {
    expect(formatQuantity('12.00')).toBe('12')
    expect(formatQuantity('4.50')).toBe('4.50')
    expect(formatQuantity('0.5')).toBe('0.50')
    expect(formatQuantity('0.00')).toBe('0')
    expect(formatQuantity(2.25)).toBe('2.25')
    expect(formatQuantity('-2.50')).toBe('-2.50')
  })

  it('agrupa los miles con coma', () => {
    expect(formatQuantity('1200.00')).toBe('1,200')
    expect(formatQuantity('99999999.99')).toBe('99,999,999.99')
  })

  it('muestra una raya cuando no hay cantidad o no se entiende', () => {
    expect(formatQuantity(null)).toBe('—')
    expect(formatQuantity('')).toBe('—')
    expect(formatQuantity('4.555')).toBe('—')
    expect(formatQuantity('cuatro')).toBe('—')
  })
})

describe('quantityError', () => {
  const label = 'El stock mínimo'

  it('acepta cantidades con hasta 2 decimales, desde 0 hasta el tope', () => {
    for (const value of ['0', '4', '4.5', '99999999.99']) {
      expect(quantityError(value, label)).toBeNull()
    }
  })

  it('dice qué está mal, igual que la API', () => {
    expect(quantityError('-1', label)).toBe(
      'El stock mínimo no puede ser negativo',
    )
    expect(quantityError('1.255', label)).toBe(
      'El stock mínimo tiene como máximo 2 decimales',
    )
    expect(quantityError('100000000', label)).toBe(
      'El stock mínimo es como máximo 99999999.99',
    )
    expect(quantityError('4,5', label)).toBe(
      'El stock mínimo es una cantidad con hasta 2 decimales, por ejemplo 4.50',
    )
  })
})

describe('movementQuantityError', () => {
  const label = 'La cantidad'

  it('una compra: mayor que 0', () => {
    const purchase = { signed: false }
    expect(movementQuantityError('12', label, purchase)).toBeNull()
    expect(movementQuantityError('0.5', label, purchase)).toBeNull()
    for (const value of ['0', '0.00', '-3']) {
      expect(movementQuantityError(value, label, purchase)).toBe(
        'La cantidad tiene que ser mayor que 0',
      )
    }
  })

  it('un ajuste: con signo y nunca 0', () => {
    const adjustment = { signed: true }
    expect(movementQuantityError('-2.5', label, adjustment)).toBeNull()
    expect(movementQuantityError('3', label, adjustment)).toBeNull()
    expect(movementQuantityError('-0', label, adjustment)).toBe(
      'La cantidad no puede ser 0: positiva suma al stock y negativa resta',
    )
    expect(movementQuantityError('-100000000', label, adjustment)).toBe(
      'La cantidad va de -99999999.99 a 99999999.99',
    )
    expect(movementQuantityError('-1.255', label, adjustment)).toBe(
      'La cantidad tiene como máximo 2 decimales',
    )
  })
})
