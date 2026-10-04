import {
  customerFormSchema,
  customerInputSchema,
  customersSearchSchema,
  emptyCustomerForm,
} from './customers.schemas'

const valid = {
  ...emptyCustomerForm,
  documentNumber: '45678912',
  name: 'Juan Pérez',
  phone: '987 654 321',
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
    expect(messagesOf({ ...valid, documentType: 'RUC' })).toEqual([
      'El RUC tiene 11 dígitos y empieza en 10, 15, 16, 17 o 20',
    ])
    expect(
      messagesOf({
        ...valid,
        documentType: 'RUC',
        documentNumber: '20-123456789',
      }),
    ).toEqual([])
  })

  it('rechaza un correo mal escrito pero acepta dejarlo vacío', () => {
    expect(messagesOf({ ...valid, email: 'juan@' })).toEqual([
      'Ingresa un correo válido',
    ])
    expect(messagesOf({ ...valid, email: '' })).toEqual([])
  })
})

describe('customerInputSchema', () => {
  it('normaliza el documento y manda null en los opcionales vacíos', () => {
    expect(
      customerInputSchema.parse({ ...valid, documentNumber: '4567-8912' }),
    ).toMatchObject({
      documentNumber: '45678912',
      email: null,
      address: null,
      notes: null,
    })
  })
})

describe('customersSearchSchema', () => {
  it('completa los valores por defecto', () => {
    expect(customersSearchSchema.parse({})).toEqual({
      page: 1,
      pageSize: 10,
      search: undefined,
      documentType: undefined,
      isActive: undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      customersSearchSchema.parse({
        page: -3,
        pageSize: 7,
        documentType: 'XYZ',
      }),
    ).toMatchObject({ page: 1, pageSize: 10, documentType: undefined })
  })
})
