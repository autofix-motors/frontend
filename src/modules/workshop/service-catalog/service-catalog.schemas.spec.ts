import {
  SERVICE_CATALOG_FILTERS_CLEARED,
  emptyServiceCatalogItemForm,
  serviceCatalogItemFormSchema,
  serviceCatalogItemInputSchema,
  serviceCatalogItemOption,
  serviceCatalogItemToForm,
  serviceCatalogSearchSchema,
} from './service-catalog.schemas'

const valid = {
  ...emptyServiceCatalogItemForm,
  name: 'Afinamiento',
  laborPrice: '180',
}

const messagesOf = (values: unknown) => {
  const result = serviceCatalogItemFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('serviceCatalogItemFormSchema', () => {
  it('acepta un servicio válido', () => {
    expect(messagesOf(valid)).toEqual([])
    expect(messagesOf({ ...valid, laborPrice: ' 120.50 ' })).toEqual([])
  })

  it('pide el precio una sola vez cuando está vacío', () => {
    expect(messagesOf({ ...valid, laborPrice: '  ' })).toEqual([
      'Ingresa el precio de mano de obra',
    ])
  })

  it('valida el precio igual que la API', () => {
    expect(messagesOf({ ...valid, laborPrice: '12.345' })).toEqual([
      'El precio de mano de obra tiene como máximo 2 decimales',
    ])
    expect(messagesOf({ ...valid, laborPrice: '-10' })).toEqual([
      'El precio de mano de obra no puede ser negativo',
    ])
    expect(messagesOf({ ...valid, laborPrice: '100000000' })).toEqual([
      'El precio de mano de obra es como máximo 99999999.99',
    ])
  })

  it('pide el nombre y limita su largo', () => {
    expect(messagesOf({ ...valid, name: ' ' })).toEqual([
      'Ingresa el nombre del servicio',
    ])
    expect(messagesOf({ ...valid, name: 'x'.repeat(121) })).toEqual([
      'El nombre tiene como máximo 120 caracteres',
    ])
  })
})

describe('serviceCatalogItemInputSchema', () => {
  it('manda el precio como texto y la descripción vacía como null', () => {
    expect(
      serviceCatalogItemInputSchema.parse({
        ...valid,
        laborPrice: '60.50 ',
        description: '  ',
      }),
    ).toStrictEqual({
      name: 'Afinamiento',
      laborPrice: '60.50',
      description: null,
      isActive: true,
    })
  })

  it('al editar, el precio vuelve tal como lo manda la API', () => {
    expect(
      serviceCatalogItemToForm({
        serviceCatalogItemId: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
        name: 'Lavado de motor',
        description: null,
        laborPrice: '45.00',
        isActive: false,
        createdAt: '2026-10-04T12:00:00.000Z',
        updatedAt: '2026-10-04T12:00:00.000Z',
      }),
    ).toStrictEqual({
      name: 'Lavado de motor',
      laborPrice: '45.00',
      description: '',
      isActive: false,
    })
  })
})

describe('serviceCatalogSearchSchema', () => {
  it('completa los valores por defecto, sin las claves opcionales', () => {
    // toStrictEqual distingue una clave ausente de una en undefined: es lo que
    // rompió «Limpiar» en clientes cuando se armaba con estos valores.
    expect(serviceCatalogSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    })
  })

  it('acepta el rango de precio y el orden por precio', () => {
    expect(
      serviceCatalogSearchSchema.parse({
        minPrice: 50,
        maxPrice: 199.9,
        sortBy: 'laborPrice',
      }),
    ).toMatchObject({ minPrice: 50, maxPrice: 199.9, sortBy: 'laborPrice' })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = serviceCatalogSearchSchema.parse({
      page: 2,
      pageSize: 20,
      search: 'aceite',
      isActive: true,
      minPrice: 50,
      maxPrice: 200,
      sortBy: 'laborPrice',
      sortOrder: 'desc',
    })
    // Así lo combina la ruta al navegar: el cambio sobre la búsqueda actual.
    // JSON hace lo que la URL: las claves en undefined no viajan.
    const next = serviceCatalogSearchSchema.parse({
      ...current,
      ...SERVICE_CATALOG_FILTERS_CLEARED,
    })
    expect(JSON.parse(JSON.stringify(next))).toStrictEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'laborPrice',
      sortOrder: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      serviceCatalogSearchSchema.parse({
        page: 0,
        minPrice: -5,
        maxPrice: 12.345,
        sortBy: 'description',
      }),
    ).toMatchObject({
      page: 1,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'name',
    })
  })
})

describe('serviceCatalogItemOption', () => {
  it('el nombre, y debajo el precio de mano de obra que se sugiere', () => {
    expect(
      serviceCatalogItemOption({
        serviceCatalogItemId: 's1',
        name: 'Afinamiento',
        laborPrice: '1180.5',
      }),
    ).toStrictEqual({
      value: 's1',
      label: 'Afinamiento',
      description: 'Mano de obra: S/ 1,180.50',
    })
  })
})
