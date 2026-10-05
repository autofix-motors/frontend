import {
  PRODUCT_FILTERS_CLEARED,
  emptyProductForm,
  formatStock,
  productFormSchema,
  productInputSchema,
  productToForm,
  productsSearchSchema,
} from './products.schemas'
import type { Product } from './products.schemas'

const valid = {
  ...emptyProductForm,
  code: 'FA-001',
  name: 'Filtro de aceite',
  minStock: '4',
  cost: '12.50',
  price: '25',
}

const messagesOf = (values: unknown) => {
  const result = productFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

const product: Product = {
  productId: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
  code: 'ACE-2050-GL',
  name: 'Aceite de motor 20W-50',
  kind: 'SUPPLY',
  unit: 'GALLON',
  brand: null,
  stock: '0.00',
  minStock: '3.00',
  isLowStock: true,
  cost: '68.00',
  price: '95.00',
  margin: '27.00',
  isActive: true,
  createdAt: '2026-10-04T12:00:00.000Z',
  updatedAt: '2026-10-04T12:00:00.000Z',
}

describe('formatStock', () => {
  it('muestra la cantidad con su unidad, sin decimales si es entera', () => {
    expect(formatStock('12.00', 'UNIT')).toBe('12 und')
    expect(formatStock('4.50', 'LITER')).toBe('4.50 L')
    expect(formatStock('2.00', 'GALLON')).toBe('2 gal')
    expect(formatStock('1.00', 'KIT')).toBe('1 kit')
    expect(formatStock('15.25', 'METER')).toBe('15.25 m')
    expect(formatStock('1200.00', 'UNIT')).toBe('1,200 und')
  })

  it('no le pone unidad a una cantidad que no se entiende', () => {
    expect(formatStock('', 'UNIT')).toBe('—')
  })
})

describe('productFormSchema', () => {
  it('acepta un producto válido, sin stock', () => {
    expect(messagesOf(valid)).toEqual([])
    expect(messagesOf({ ...valid, minStock: ' 2.5 ', brand: 'Bosch' })).toEqual(
      [],
    )
  })

  it('pide cada dato obligatorio una sola vez cuando está vacío', () => {
    expect(
      messagesOf({ ...valid, code: ' ', minStock: '', cost: ' ', price: '' }),
    ).toEqual([
      'Ingresa el código',
      'Ingresa el stock mínimo',
      'Ingresa el costo',
      'Ingresa el precio de venta',
    ])
  })

  it('valida el stock mínimo, el costo y el precio igual que la API', () => {
    expect(
      messagesOf({ ...valid, minStock: '1.255', cost: '-1', price: '12,50' }),
    ).toEqual([
      'El stock mínimo tiene como máximo 2 decimales',
      'El costo no puede ser negativo',
      'El precio de venta es un monto en soles con hasta 2 decimales, por ejemplo 120.50',
    ])
    expect(messagesOf({ ...valid, minStock: '-1' })).toEqual([
      'El stock mínimo no puede ser negativo',
    ])
  })

  it('limita el código, el nombre y la marca al largo de la API', () => {
    expect(
      messagesOf({
        ...valid,
        code: 'x'.repeat(31),
        name: 'x'.repeat(151),
        brand: 'x'.repeat(61),
      }),
    ).toEqual([
      'El código tiene como máximo 30 caracteres',
      'El nombre tiene como máximo 150 caracteres',
      'La marca tiene como máximo 60 caracteres',
    ])
  })

  it('no exige que el precio supere al costo', () => {
    expect(messagesOf({ ...valid, cost: '30', price: '25' })).toEqual([])
  })
})

describe('productInputSchema', () => {
  it('manda el código en mayúsculas y la marca vacía como null', () => {
    expect(
      productInputSchema.parse({
        ...valid,
        code: ' fa-001 ',
        brand: '  ',
        minStock: '4.50 ',
      }),
    ).toStrictEqual({
      code: 'FA-001',
      name: 'Filtro de aceite',
      kind: 'PART',
      unit: 'UNIT',
      brand: null,
      minStock: '4.50',
      cost: '12.50',
      price: '25',
      isActive: true,
    })
  })

  it('al editar, las cantidades y los montos vuelven tal como los manda la API', () => {
    expect(productToForm(product)).toStrictEqual({
      code: 'ACE-2050-GL',
      name: 'Aceite de motor 20W-50',
      kind: 'SUPPLY',
      unit: 'GALLON',
      brand: '',
      minStock: '3.00',
      cost: '68.00',
      price: '95.00',
      isActive: true,
    })
  })
})

describe('productsSearchSchema', () => {
  it('completa los valores por defecto, sin las claves opcionales', () => {
    // toStrictEqual distingue una clave ausente de una en undefined: es lo que
    // rompió «Limpiar» en clientes cuando se armaba con estos valores.
    expect(productsSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    })
  })

  it('acepta los filtros y el orden por stock', () => {
    expect(
      productsSearchSchema.parse({
        kind: 'SUPPLY',
        isActive: false,
        lowStock: true,
        sortBy: 'stock',
      }),
    ).toMatchObject({
      kind: 'SUPPLY',
      isActive: false,
      lowStock: true,
      sortBy: 'stock',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = productsSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'filtro',
      kind: 'PART',
      isActive: true,
      lowStock: true,
      sortBy: 'price',
      sortOrder: 'desc',
    })
    // Así lo combina la ruta al navegar: el cambio sobre la búsqueda actual.
    // JSON hace lo que la URL: las claves en undefined no viajan.
    const next = productsSearchSchema.parse({
      ...current,
      ...PRODUCT_FILTERS_CLEARED,
    })
    expect(JSON.parse(JSON.stringify(next))).toStrictEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'price',
      sortOrder: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      productsSearchSchema.parse({
        page: -1,
        kind: 'TOOL',
        lowStock: 'si',
        sortBy: 'cost',
      }),
    ).toMatchObject({
      page: 1,
      kind: undefined,
      lowStock: undefined,
      sortBy: 'name',
    })
  })
})
