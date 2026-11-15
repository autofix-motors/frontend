import {
  barWidth,
  dueLabel,
  formatMonthShort,
  formatTodayInLima,
  isTrendEmpty,
} from './dashboard.schemas'

describe('formatMonthShort', () => {
  it.each([
    ['2026-11', 'nov 26'],
    ['2026-01', 'ene 26'],
    ['2025-09', 'sep 25'],
    ['2030-12', 'dic 30'],
  ])('%s → %s', (month, label) => {
    expect(formatMonthShort(month)).toBe(label)
  })

  it('devuelve tal cual lo que no es un mes', () => {
    expect(formatMonthShort('2026-13')).toBe('2026-13')
    expect(formatMonthShort('noviembre')).toBe('noviembre')
  })
})

describe('formatTodayInLima', () => {
  it('escribe el día de Lima, con mayúscula inicial', () => {
    // 03:00 UTC del 16 es todavía el 15 en Lima (UTC-5).
    expect(formatTodayInLima(new Date('2026-11-16T03:00:00Z'))).toBe(
      'Domingo, 15 de noviembre de 2026',
    )
  })
})

describe('dueLabel', () => {
  const today = '2026-11-15'

  it.each([
    ['2026-11-10', 'Venció hace 5 días'],
    ['2026-11-14', 'Venció ayer'],
    ['2026-11-15', 'Vence hoy'],
    ['2026-11-16', 'Vence mañana'],
    ['2026-11-17', 'Vence en 2 días'],
    // Cruza el cambio de mes y de año sin correrse un día.
    ['2026-12-01', 'Vence en 16 días'],
  ])('%s → %s', (fecha, label) => {
    expect(dueLabel(fecha, today)).toBe(label)
  })

  it('cuenta bien a través del fin de año', () => {
    expect(dueLabel('2026-12-30', '2027-01-02')).toBe('Venció hace 3 días')
  })
})

describe('isTrendEmpty', () => {
  it('solo está vacío si todos los meses están en cero', () => {
    const empty = [
      { mes: '2026-10', recibidas: 0, entregadas: 0 },
      { mes: '2026-11', recibidas: 0, entregadas: 0 },
    ]
    expect(isTrendEmpty(empty)).toBe(true)
    expect(
      isTrendEmpty([...empty, { mes: '2026-12', recibidas: 0, entregadas: 1 }]),
    ).toBe(false)
  })
})

describe('barWidth', () => {
  it('es el porcentaje del mayor', () => {
    expect(barWidth(10, 10)).toBe(100)
    expect(barWidth(5, 10)).toBe(50)
  })

  it('una cantidad positiva nunca queda invisible', () => {
    expect(barWidth(1, 1000)).toBe(4)
  })

  it('cero, o sin máximo, es una barra vacía', () => {
    expect(barWidth(0, 10)).toBe(0)
    expect(barWidth(3, 0)).toBe(0)
  })
})
