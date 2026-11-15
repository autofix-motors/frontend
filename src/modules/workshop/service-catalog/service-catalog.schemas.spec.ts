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
  nombre: 'Afinamiento',
  precioManoObra: '180',
}

const messagesOf = (values: unknown) => {
  const result = serviceCatalogItemFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('serviceCatalogItemFormSchema', () => {
  it('acepta un servicio válido', () => {
    expect(messagesOf(valid)).toEqual([])
    expect(messagesOf({ ...valid, precioManoObra: ' 120.50 ' })).toEqual([])
  })

  it('pide el precio una sola vez cuando está vacío', () => {
    expect(messagesOf({ ...valid, precioManoObra: '  ' })).toEqual([
      'Ingresa el precio de mano de obra',
    ])
  })

  it('valida el precio igual que la API', () => {
    expect(messagesOf({ ...valid, precioManoObra: '12.345' })).toEqual([
      'El precio de mano de obra tiene como máximo 2 decimales',
    ])
    expect(messagesOf({ ...valid, precioManoObra: '-10' })).toEqual([
      'El precio de mano de obra no puede ser negativo',
    ])
    expect(messagesOf({ ...valid, precioManoObra: '100000000' })).toEqual([
      'El precio de mano de obra es como máximo 99999999.99',
    ])
  })

  it('pide el nombre y limita su largo', () => {
    expect(messagesOf({ ...valid, nombre: ' ' })).toEqual([
      'Ingresa el nombre del servicio',
    ])
    expect(messagesOf({ ...valid, nombre: 'x'.repeat(121) })).toEqual([
      'El nombre tiene como máximo 120 caracteres',
    ])
  })
})

describe('serviceCatalogItemInputSchema', () => {
  it('manda el precio como texto y la descripción vacía como null', () => {
    expect(
      serviceCatalogItemInputSchema.parse({
        ...valid,
        precioManoObra: '60.50 ',
        descripcion: '  ',
      }),
    ).toStrictEqual({
      nombre: 'Afinamiento',
      precioManoObra: '60.50',
      descripcion: null,
      activo: true,
    })
  })

  it('al editar, el precio vuelve tal como lo manda la API', () => {
    expect(
      serviceCatalogItemToForm({
        servicioId: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
        nombre: 'Lavado de motor',
        descripcion: null,
        precioManoObra: '45.00',
        activo: false,
        creadoEn: '2026-10-04T12:00:00.000Z',
        actualizadoEn: '2026-10-04T12:00:00.000Z',
      }),
    ).toStrictEqual({
      nombre: 'Lavado de motor',
      precioManoObra: '45.00',
      descripcion: '',
      activo: false,
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
      ordenarPor: 'nombre',
      sentido: 'asc',
    })
  })

  it('acepta el rango de precio y el orden por precio', () => {
    expect(
      serviceCatalogSearchSchema.parse({
        precioMinimo: 50,
        precioMaximo: 199.9,
        ordenarPor: 'precioManoObra',
      }),
    ).toMatchObject({
      precioMinimo: 50,
      precioMaximo: 199.9,
      ordenarPor: 'precioManoObra',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = serviceCatalogSearchSchema.parse({
      page: 2,
      pageSize: 20,
      search: 'aceite',
      activo: true,
      precioMinimo: 50,
      precioMaximo: 200,
      ordenarPor: 'precioManoObra',
      sentido: 'desc',
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
      ordenarPor: 'precioManoObra',
      sentido: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      serviceCatalogSearchSchema.parse({
        page: 0,
        precioMinimo: -5,
        precioMaximo: 12.345,
        ordenarPor: 'descripcion',
      }),
    ).toMatchObject({
      page: 1,
      precioMinimo: undefined,
      precioMaximo: undefined,
      ordenarPor: 'nombre',
    })
  })
})

describe('serviceCatalogItemOption', () => {
  it('el nombre, y debajo el precio de mano de obra que se sugiere', () => {
    expect(
      serviceCatalogItemOption({
        servicioId: 's1',
        nombre: 'Afinamiento',
        precioManoObra: '1180.5',
      }),
    ).toStrictEqual({
      value: 's1',
      label: 'Afinamiento',
      description: 'Mano de obra: S/ 1,180.50',
    })
  })
})
