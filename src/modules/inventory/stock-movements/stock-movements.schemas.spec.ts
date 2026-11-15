import {
  STOCK_MOVEMENT_FILTERS_CLEARED,
  adjustmentFormSchema,
  emptyAdjustmentForm,
  emptyPurchaseForm,
  formatMovementQuantity,
  purchaseFormSchema,
  purchaseInputSchema,
  stockMovementsSearchSchema,
} from './stock-movements.schemas'

const PRODUCT_ID = '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70'

const messagesOf = (
  schema: typeof purchaseFormSchema | typeof adjustmentFormSchema,
  values: unknown,
) => {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('formatMovementQuantity', () => {
  it('pone el signo siempre: + entra y - sale, con la unidad', () => {
    expect(formatMovementQuantity('12.00', 'UNIDAD')).toBe('+12 und')
    expect(formatMovementQuantity('-2.50', 'LITRO')).toBe('-2.50 L')
    expect(formatMovementQuantity('-1.00', 'GALON')).toBe('-1 gal')
  })

  it('no le pone signo a una cantidad que no se entiende', () => {
    expect(formatMovementQuantity('', 'UNIDAD')).toBe('—')
  })
})

describe('purchaseFormSchema', () => {
  const valid = {
    ...emptyPurchaseForm(PRODUCT_ID),
    cantidad: '12',
    costoUnitario: '18.50',
  }

  it('acepta una compra con la nota vacía', () => {
    expect(messagesOf(purchaseFormSchema, valid)).toEqual([])
  })

  it('pide el producto, la cantidad y el costo una sola vez cuando faltan', () => {
    expect(messagesOf(purchaseFormSchema, emptyPurchaseForm())).toEqual([
      'Selecciona el producto',
      'Ingresa la cantidad',
      'Ingresa el costo unitario',
    ])
  })

  it('la cantidad tiene que ser mayor que 0, como en la API', () => {
    for (const cantidad of ['0', '0.00', '-3']) {
      expect(messagesOf(purchaseFormSchema, { ...valid, cantidad })).toEqual([
        'La cantidad tiene que ser mayor que 0',
      ])
    }
    expect(
      messagesOf(purchaseFormSchema, {
        ...valid,
        cantidad: '1.255',
        costoUnitario: '-1',
      }),
    ).toEqual([
      'La cantidad tiene como máximo 2 decimales',
      'El costo unitario no puede ser negativo',
    ])
  })

  it('manda la nota vacía como null y la recorta', () => {
    expect(purchaseInputSchema.parse({ ...valid, nota: '  ' })).toStrictEqual({
      productoId: PRODUCT_ID,
      cantidad: '12',
      costoUnitario: '18.50',
      nota: null,
    })
    expect(
      purchaseInputSchema.parse({ ...valid, nota: ' Factura F001-4512 ' }).nota,
    ).toBe('Factura F001-4512')
  })

  it('limita la nota a 500 caracteres', () => {
    expect(
      messagesOf(purchaseFormSchema, { ...valid, nota: 'x'.repeat(501) }),
    ).toEqual(['La nota tiene como máximo 500 caracteres'])
  })
})

describe('adjustmentFormSchema', () => {
  const valid = {
    ...emptyAdjustmentForm(PRODUCT_ID),
    cantidad: '-2',
    nota: 'Merma: envase roto',
  }

  it('acepta una cantidad con signo, que suma o resta', () => {
    expect(messagesOf(adjustmentFormSchema, valid)).toEqual([])
    expect(
      messagesOf(adjustmentFormSchema, { ...valid, cantidad: '3.5' }),
    ).toEqual([])
  })

  it('la cantidad no puede ser 0', () => {
    expect(
      messagesOf(adjustmentFormSchema, { ...valid, cantidad: '0' }),
    ).toEqual([
      'La cantidad no puede ser 0: positiva suma al stock y negativa resta',
    ])
  })

  it('el motivo es obligatorio', () => {
    expect(messagesOf(adjustmentFormSchema, { ...valid, nota: '   ' })).toEqual(
      ['Ingresa el motivo del ajuste'],
    )
    expect(
      messagesOf(adjustmentFormSchema, emptyAdjustmentForm(PRODUCT_ID)),
    ).toEqual(['Ingresa la cantidad', 'Ingresa el motivo del ajuste'])
  })
})

describe('stockMovementsSearchSchema', () => {
  it('completa los valores por defecto: lo más reciente primero, sin las claves opcionales', () => {
    // toStrictEqual distingue una clave ausente de una en undefined: es lo que
    // rompió «Limpiar» en clientes cuando se armaba con estos valores.
    expect(stockMovementsSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      ordenarPor: 'creadoEn',
      sentido: 'desc',
    })
  })

  it('acepta el tipo, el producto y el rango de fechas', () => {
    expect(
      stockMovementsSearchSchema.parse({
        tipo: 'AJUSTE',
        productoId: PRODUCT_ID,
        desde: '2026-10-01',
        hasta: '2026-10-31',
      }),
    ).toMatchObject({
      tipo: 'AJUSTE',
      productoId: PRODUCT_ID,
      desde: '2026-10-01',
      hasta: '2026-10-31',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = stockMovementsSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'aceite',
      tipo: 'COMPRA',
      productoId: PRODUCT_ID,
      desde: '2026-10-01',
      hasta: '2026-10-04',
      ordenarPor: 'cantidad',
      sentido: 'asc',
    })
    // Así lo combina la ruta al navegar: el cambio sobre la búsqueda actual.
    // JSON hace lo que la URL: las claves en undefined no viajan.
    const next = stockMovementsSearchSchema.parse({
      ...current,
      ...STOCK_MOVEMENT_FILTERS_CLEARED,
    })
    expect(JSON.parse(JSON.stringify(next))).toStrictEqual({
      page: 1,
      pageSize: 20,
      ordenarPor: 'cantidad',
      sentido: 'asc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      stockMovementsSearchSchema.parse({
        page: 0,
        tipo: 'SALE',
        productoId: '123',
        desde: '2026-02-30',
        hasta: '04/10/2026',
        ordenarPor: 'costoUnitario',
        sentido: 'up',
      }),
    ).toMatchObject({
      page: 1,
      tipo: undefined,
      productoId: undefined,
      desde: undefined,
      hasta: undefined,
      ordenarPor: 'creadoEn',
      sentido: 'desc',
    })
  })
})
