import {
  CUSTOMER_FILTERS_CLEARED,
  customerFormSchema,
  customerInputSchema,
  customersSearchSchema,
  emptyCustomerForm,
} from './customers.schemas'

const valid = {
  ...emptyCustomerForm,
  numeroDocumento: '45678912',
  nombre: 'Juan Pérez',
  telefono: '987 654 321',
}

const messagesOf = (values: unknown) => {
  const result = customerFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('customerFormSchema', () => {
  it('acepta un cliente válido', () => {
    expect(messagesOf(valid)).toEqual([])
  })

  it('valida el número según el tipo, igual que la API', () => {
    expect(messagesOf({ ...valid, tipoDocumento: 'RUC' })).toEqual([
      'El RUC tiene 11 dígitos y empieza en 10, 15, 16, 17 o 20',
    ])
    expect(
      messagesOf({
        ...valid,
        tipoDocumento: 'RUC',
        numeroDocumento: '20-123456789',
      }),
    ).toEqual([])
  })

  it('rechaza un correo mal escrito pero acepta dejarlo vacío', () => {
    expect(messagesOf({ ...valid, correo: 'juan@' })).toEqual([
      'Ingresa un correo válido',
    ])
    expect(messagesOf({ ...valid, correo: '' })).toEqual([])
  })
})

describe('customerInputSchema', () => {
  it('normaliza el documento y manda null en los opcionales vacíos', () => {
    expect(
      customerInputSchema.parse({ ...valid, numeroDocumento: '4567-8912' }),
    ).toMatchObject({
      numeroDocumento: '45678912',
      correo: null,
      direccion: null,
      notas: null,
    })
  })
})

describe('customersSearchSchema', () => {
  it('completa los valores por defecto, sin las claves opcionales', () => {
    // toStrictEqual distingue una clave ausente de una en undefined: es lo que
    // rompió «Limpiar» cuando se armaba con estos valores.
    expect(customersSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      ordenarPor: 'nombre',
      sentido: 'asc',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = customersSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'trans',
      tipoDocumento: 'RUC',
      activo: true,
      ordenarPor: 'creadoEn',
      sentido: 'desc',
    })
    // Así lo combina la ruta al navegar: el cambio sobre la búsqueda actual.
    // JSON hace lo que la URL: las claves en undefined no viajan.
    const next = customersSearchSchema.parse({
      ...current,
      ...CUSTOMER_FILTERS_CLEARED,
    })
    expect(JSON.parse(JSON.stringify(next))).toStrictEqual({
      page: 1,
      pageSize: 20,
      ordenarPor: 'creadoEn',
      sentido: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      customersSearchSchema.parse({
        page: -3,
        pageSize: 7,
        tipoDocumento: 'XYZ',
      }),
    ).toMatchObject({ page: 1, pageSize: 10, tipoDocumento: undefined })
  })
})
