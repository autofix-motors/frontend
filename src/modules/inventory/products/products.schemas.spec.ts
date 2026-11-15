import {
  PRODUCT_FILTERS_CLEARED,
  emptyProductForm,
  formatStock,
  productFormSchema,
  productOption,
  productInputSchema,
  productToForm,
  productsSearchSchema,
} from './products.schemas'
import type { Product } from './products.schemas'

const valid = {
  ...emptyProductForm,
  codigo: 'FA-001',
  nombre: 'Filtro de aceite',
  stockMinimo: '4',
  costo: '12.50',
  precio: '25',
}

const messagesOf = (values: unknown) => {
  const result = productFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

const product: Product = {
  productoId: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
  codigo: 'ACE-2050-GL',
  nombre: 'Aceite de motor 20W-50',
  tipo: 'INSUMO',
  unidad: 'GALON',
  marca: null,
  stock: '0.00',
  stockMinimo: '3.00',
  stockBajo: true,
  costo: '68.00',
  precio: '95.00',
  margen: '27.00',
  activo: true,
  creadoEn: '2026-10-04T12:00:00.000Z',
  actualizadoEn: '2026-10-04T12:00:00.000Z',
}

describe('formatStock', () => {
  it('muestra la cantidad con su unidad, sin decimales si es entera', () => {
    expect(formatStock('12.00', 'UNIDAD')).toBe('12 und')
    expect(formatStock('4.50', 'LITRO')).toBe('4.50 L')
    expect(formatStock('2.00', 'GALON')).toBe('2 gal')
    expect(formatStock('1.00', 'KIT')).toBe('1 kit')
    expect(formatStock('15.25', 'METRO')).toBe('15.25 m')
    expect(formatStock('1200.00', 'UNIDAD')).toBe('1,200 und')
  })

  it('no le pone unidad a una cantidad que no se entiende', () => {
    expect(formatStock('', 'UNIDAD')).toBe('—')
  })
})

describe('productOption', () => {
  it('muestra el código y el nombre, y debajo el stock con su unidad', () => {
    expect(productOption({ ...product, stock: '4.50' })).toStrictEqual({
      value: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
      label: 'ACE-2050-GL · Aceite de motor 20W-50',
      description: 'Stock: 4.50 gal',
    })
  })
})

describe('productFormSchema', () => {
  it('acepta un producto válido, sin stock', () => {
    expect(messagesOf(valid)).toEqual([])
    expect(
      messagesOf({ ...valid, stockMinimo: ' 2.5 ', marca: 'Bosch' }),
    ).toEqual([])
  })

  it('pide cada dato obligatorio una sola vez cuando está vacío', () => {
    expect(
      messagesOf({
        ...valid,
        codigo: ' ',
        stockMinimo: '',
        costo: ' ',
        precio: '',
      }),
    ).toEqual([
      'Ingresa el código',
      'Ingresa el stock mínimo',
      'Ingresa el costo',
      'Ingresa el precio de venta',
    ])
  })

  it('valida el stock mínimo, el costo y el precio igual que la API', () => {
    expect(
      messagesOf({
        ...valid,
        stockMinimo: '1.255',
        costo: '-1',
        precio: '12,50',
      }),
    ).toEqual([
      'El stock mínimo tiene como máximo 2 decimales',
      'El costo no puede ser negativo',
      'El precio de venta es un monto en soles con hasta 2 decimales, por ejemplo 120.50',
    ])
    expect(messagesOf({ ...valid, stockMinimo: '-1' })).toEqual([
      'El stock mínimo no puede ser negativo',
    ])
  })

  it('limita el código, el nombre y la marca al largo de la API', () => {
    expect(
      messagesOf({
        ...valid,
        codigo: 'x'.repeat(31),
        nombre: 'x'.repeat(151),
        marca: 'x'.repeat(61),
      }),
    ).toEqual([
      'El código tiene como máximo 30 caracteres',
      'El nombre tiene como máximo 150 caracteres',
      'La marca tiene como máximo 60 caracteres',
    ])
  })

  it('no exige que el precio supere al costo', () => {
    expect(messagesOf({ ...valid, costo: '30', precio: '25' })).toEqual([])
  })
})

describe('productInputSchema', () => {
  it('manda el código en mayúsculas y la marca vacía como null', () => {
    expect(
      productInputSchema.parse({
        ...valid,
        codigo: ' fa-001 ',
        marca: '  ',
        stockMinimo: '4.50 ',
      }),
    ).toStrictEqual({
      codigo: 'FA-001',
      nombre: 'Filtro de aceite',
      tipo: 'REPUESTO',
      unidad: 'UNIDAD',
      marca: null,
      stockMinimo: '4.50',
      costo: '12.50',
      precio: '25',
      activo: true,
    })
  })

  it('al editar, las cantidades y los montos vuelven tal como los manda la API', () => {
    expect(productToForm(product)).toStrictEqual({
      codigo: 'ACE-2050-GL',
      nombre: 'Aceite de motor 20W-50',
      tipo: 'INSUMO',
      unidad: 'GALON',
      marca: '',
      stockMinimo: '3.00',
      costo: '68.00',
      precio: '95.00',
      activo: true,
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
      ordenarPor: 'nombre',
      sentido: 'asc',
    })
  })

  it('acepta los filtros y el orden por stock', () => {
    expect(
      productsSearchSchema.parse({
        tipo: 'INSUMO',
        activo: false,
        stockBajo: true,
        ordenarPor: 'stock',
      }),
    ).toMatchObject({
      tipo: 'INSUMO',
      activo: false,
      stockBajo: true,
      ordenarPor: 'stock',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = productsSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'filtro',
      tipo: 'REPUESTO',
      activo: true,
      stockBajo: true,
      ordenarPor: 'precio',
      sentido: 'desc',
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
      ordenarPor: 'precio',
      sentido: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      productsSearchSchema.parse({
        page: -1,
        tipo: 'TOOL',
        stockBajo: 'si',
        ordenarPor: 'costo',
      }),
    ).toMatchObject({
      page: 1,
      tipo: undefined,
      stockBajo: undefined,
      ordenarPor: 'nombre',
    })
  })
})
