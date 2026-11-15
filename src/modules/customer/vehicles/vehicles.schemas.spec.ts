import {
  VEHICLE_FILTERS_CLEARED,
  emptyVehicleForm,
  maxVehicleYear,
  vehicleFormSchema,
  vehicleInputSchema,
  vehicleOption,
  vehiclesSearchSchema,
} from './vehicles.schemas'

const CUSTOMER_ID = '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b'

const valid = {
  ...emptyVehicleForm,
  clienteId: CUSTOMER_ID,
  placa: 'abc-123',
  marca: 'Toyota',
  modelo: 'Yaris',
}

const messagesOf = (values: unknown) => {
  const result = vehicleFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('vehicleFormSchema', () => {
  it('acepta un vehículo válido, con la placa escrita con guion', () => {
    expect(messagesOf(valid)).toEqual([])
  })

  it('exige el cliente, igual que la API', () => {
    expect(messagesOf({ ...valid, clienteId: '' })).toEqual([
      'Selecciona el cliente',
    ])
  })

  it('valida la placa ya normalizada', () => {
    expect(messagesOf({ ...valid, placa: 'AB-1' })).toEqual([
      'La placa tiene de 5 a 7 letras o dígitos',
    ])
  })

  it('valida el VIN solo si se escribe', () => {
    expect(messagesOf({ ...valid, vin: 'JTDBT9237O1234567' })).toEqual([
      'El VIN tiene 17 letras o dígitos, sin I, O ni Q',
    ])
    expect(messagesOf({ ...valid, vin: '' })).toEqual([])
  })

  it('acepta el año siguiente al actual y no más', () => {
    const max = maxVehicleYear()
    expect(messagesOf({ ...valid, anio: String(max) })).toEqual([])
    expect(messagesOf({ ...valid, anio: String(max + 1) })).toEqual([
      `El año va de 1950 a ${max}`,
    ])
    expect(messagesOf({ ...valid, anio: '19a0' })).toHaveLength(1)
  })
})

describe('vehicleInputSchema', () => {
  it('normaliza la placa y el VIN, convierte el año y manda null en los vacíos', () => {
    expect(
      vehicleInputSchema.parse({
        ...valid,
        anio: '2019',
        vin: 'jtdbt9237 71234567',
      }),
    ).toStrictEqual({
      clienteId: CUSTOMER_ID,
      placa: 'ABC123',
      marca: 'Toyota',
      modelo: 'Yaris',
      anio: 2019,
      color: null,
      vin: 'JTDBT923771234567',
      notas: null,
    })
  })

  it('un año vacío viaja como null para borrarlo', () => {
    expect(vehicleInputSchema.parse(valid).anio).toBeNull()
  })
})

describe('vehiclesSearchSchema', () => {
  it('completa los valores por defecto, sin las claves opcionales', () => {
    expect(vehiclesSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      ordenarPor: 'placa',
      sentido: 'asc',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = vehiclesSearchSchema.parse({
      page: 2,
      pageSize: 20,
      search: 'yaris',
      clienteId: CUSTOMER_ID,
      marca: 'Toyota',
      ordenarPor: 'creadoEn',
      sentido: 'desc',
    })
    const next = vehiclesSearchSchema.parse({
      ...current,
      ...VEHICLE_FILTERS_CLEARED,
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
      vehiclesSearchSchema.parse({
        clienteId: 'no-es-un-id',
        marca: '',
        ordenarPor: 'modelo',
      }),
    ).toMatchObject({
      clienteId: undefined,
      marca: undefined,
      ordenarPor: 'placa',
    })
  })
})

describe('vehicleOption', () => {
  it('la placa con la marca y el modelo, y abajo el dueño', () => {
    expect(
      vehicleOption({
        vehiculoId: 'v1',
        placa: 'ABK582',
        marca: 'Toyota',
        modelo: 'Yaris',
        cliente: {
          clienteId: CUSTOMER_ID,
          nombre: 'Juan Pérez Rojas',
          tipoDocumento: 'DNI',
          numeroDocumento: '45678912',
        },
      }),
    ).toStrictEqual({
      value: 'v1',
      label: 'ABK582 · Toyota Yaris',
      description: 'Juan Pérez Rojas',
    })
  })
})
