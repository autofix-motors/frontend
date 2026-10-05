import { formatDateOnly, formatDateTime, isDateOnly } from './dates'

describe('formatDateOnly', () => {
  it('muestra el mismo día que llega, sin correrlo por la zona horaria', () => {
    expect(formatDateOnly('2026-10-01')).toBe('01/10/2026')
    expect(formatDateOnly('2026-12-31')).toBe('31/12/2026')
  })

  it('muestra una raya cuando no hay fecha o no tiene la forma', () => {
    expect(formatDateOnly(null)).toBe('—')
    expect(formatDateOnly(undefined)).toBe('—')
    expect(formatDateOnly('01/10/2026')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('muestra la marca de tiempo en la hora de Lima', () => {
    // 03:30 UTC del 2 de octubre son las 22:30 del 1 en Lima.
    expect(formatDateTime('2026-10-02T03:30:00.000Z')).toBe('01/10/2026, 22:30')
  })

  it('muestra una raya cuando no hay fecha o no se entiende', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('ayer')).toBe('—')
  })
})

describe('isDateOnly', () => {
  it('acepta un día AAAA-MM-DD que existe', () => {
    expect(isDateOnly('2026-10-04')).toBe(true)
    expect(isDateOnly('2028-02-29')).toBe(true)
  })

  it('rechaza otra forma o un día que no existe, como la API', () => {
    for (const value of [
      '',
      '04/10/2026',
      '2026-10-04T00:00',
      '2026-02-30',
      '2026-13-01',
    ]) {
      expect(isDateOnly(value)).toBe(false)
    }
  })
})
