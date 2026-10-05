import type { z } from 'zod'
import {
  OPEN_STATUSES,
  addItemFormSchema,
  addItemRequestSchema,
  canChangeItems,
  canEditItem,
  editItemFormSchema,
  emptyAddItemForm,
  formatItemQuantity,
  itemToEditForm,
  toAddItemRequest,
  toUpdateItemRequest,
  updateItemRequestSchema,
  WORK_ORDER_FILTERS_CLEARED,
  WORK_ORDER_STATUSES,
  allowedTransitions,
  canEditDiagnosis,
  canTransition,
  changeStatusRequestSchema,
  createWorkOrderFormSchema,
  createWorkOrderInputSchema,
  defaultWorkOrdersSearch,
  emptyCreateWorkOrderForm,
  emptyStatusChangeForm,
  formatWorkOrderNumber,
  noteFormSchema,
  statusChangeFormSchema,
  updateWorkOrderFormSchema,
  updateWorkOrderInputSchema,
  workOrderToForm,
  workOrdersSearchSchema,
} from './work-orders.schemas'

const VEHICLE_ID = '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70'
const USER_ID = '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b'
const WORK_ORDER_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a'
const ITEM_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
const SERVICE_ID = '7a1c4f0e-2b3d-4e5f-8a9b-0c1d2e3f4a5b'
const PRODUCT_ID = '3f2e1d0c-9b8a-4f6e-8d4c-3b2a1f0e9d8c'

const messagesOf = (schema: z.ZodType, values: unknown) => {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

// Hoy en Lima: 4 de octubre de 2026 (las 23:30 de Lima ya son el 5 en UTC,
// para comprobar que el «hoy» no se corre).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T04:30:00.000Z'))
})
afterEach(() => vi.useRealTimers())

describe('canTransition (copia de la tabla de la API)', () => {
  // Lo permitido, escrito a mano desde el alcance: el mismo test que el del
  // backend, para que las dos copias no se separen sin que falle algo.
  const ADMIN_ALLOWED = new Set([
    'RECEIVED→DIAGNOSIS',
    'RECEIVED→IN_PROGRESS',
    'RECEIVED→CANCELLED',
    'DIAGNOSIS→IN_PROGRESS',
    'DIAGNOSIS→CANCELLED',
    'WAITING_APPROVAL→CANCELLED',
    'IN_PROGRESS→WAITING_PARTS',
    'IN_PROGRESS→READY',
    'IN_PROGRESS→CANCELLED',
    'WAITING_PARTS→IN_PROGRESS',
    'WAITING_PARTS→CANCELLED',
    'READY→DELIVERED',
    'READY→IN_PROGRESS',
    'READY→CANCELLED',
  ])
  const MECHANIC_ALLOWED = new Set(
    [...ADMIN_ALLOWED].filter(
      (pair) => !pair.endsWith('→DELIVERED') && !pair.endsWith('→CANCELLED'),
    ),
  )
  const pairs = WORK_ORDER_STATUSES.flatMap((from) =>
    WORK_ORDER_STATUSES.map((to) => [from, to] as const),
  )

  it.each(pairs)('ADMIN %s → %s', (from, to) => {
    expect(canTransition(from, to, 'ADMIN')).toBe(
      ADMIN_ALLOWED.has(`${from}→${to}`),
    )
  })

  it.each(pairs)('MECHANIC %s → %s', (from, to) => {
    expect(canTransition(from, to, 'MECHANIC')).toBe(
      MECHANIC_ALLOWED.has(`${from}→${to}`),
    )
  })

  it('los botones de cada rol desde un estado', () => {
    expect(allowedTransitions('READY', 'ADMIN')).toEqual([
      'DELIVERED',
      'IN_PROGRESS',
      'CANCELLED',
    ])
    expect(allowedTransitions('READY', 'MECHANIC')).toEqual(['IN_PROGRESS'])
    expect(allowedTransitions('WAITING_APPROVAL', 'MECHANIC')).toEqual([])
    expect(allowedTransitions('DELIVERED', 'ADMIN')).toEqual([])
  })
})

describe('canEditDiagnosis y OPEN_STATUSES', () => {
  it('el diagnóstico se escribe mientras se trabaja, como en la API', () => {
    expect(WORK_ORDER_STATUSES.filter(canEditDiagnosis)).toEqual([
      'RECEIVED',
      'DIAGNOSIS',
      'IN_PROGRESS',
      'WAITING_PARTS',
    ])
  })

  it('abiertas: todo menos entregadas y canceladas', () => {
    expect(OPEN_STATUSES).toEqual([
      'RECEIVED',
      'DIAGNOSIS',
      'WAITING_APPROVAL',
      'IN_PROGRESS',
      'WAITING_PARTS',
      'READY',
    ])
  })
})

describe('formatWorkOrderNumber', () => {
  it('rellena con ceros hasta seis dígitos', () => {
    expect(formatWorkOrderNumber(123)).toBe('OT-000123')
  })
})

describe('createWorkOrderFormSchema', () => {
  const valid = {
    ...emptyCreateWorkOrderForm,
    vehicleId: VEHICLE_ID,
    mileageIn: '84500',
    reason: 'Ruido al frenar',
  }

  it('acepta el ingreso mínimo', () => {
    expect(messagesOf(createWorkOrderFormSchema, valid)).toEqual([])
  })

  it('pide el vehículo, el kilometraje y el motivo una sola vez', () => {
    expect(
      messagesOf(createWorkOrderFormSchema, emptyCreateWorkOrderForm),
    ).toEqual([
      'Selecciona el vehículo',
      'Ingresa el kilometraje',
      'Ingresa el motivo del ingreso',
    ])
  })

  it('el kilometraje es un entero de 0 a 9 999 999', () => {
    const mileage = (mileageIn: string) =>
      messagesOf(createWorkOrderFormSchema, { ...valid, mileageIn })
    expect(mileage('0')).toEqual([])
    expect(mileage('9999999')).toEqual([])
    for (const bad of ['-1', '12.5', '10000000', '84 500']) {
      expect(mileage(bad)).toEqual([
        'El kilometraje es un número entero de 0 a 9 999 999',
      ])
    }
  })

  it('la fecha prometida no puede ser anterior a hoy en Lima', () => {
    const date = (promisedDate: string) =>
      messagesOf(createWorkOrderFormSchema, { ...valid, promisedDate })
    expect(date('2026-10-04')).toEqual([])
    expect(date('2026-10-03')).toEqual([
      'La fecha prometida no puede ser anterior a hoy',
    ])
  })

  it('manda números como número y lo vacío como null', () => {
    expect(createWorkOrderInputSchema.parse(valid)).toStrictEqual({
      vehicleId: VEHICLE_ID,
      mileageIn: 84500,
      reason: 'Ruido al frenar',
      promisedDate: null,
      mechanicId: null,
    })
    expect(
      createWorkOrderInputSchema.parse({
        ...valid,
        promisedDate: '2026-10-08',
        mechanicId: USER_ID,
      }),
    ).toMatchObject({ promisedDate: '2026-10-08', mechanicId: USER_ID })
  })
})

describe('updateWorkOrderFormSchema', () => {
  const order = {
    mileageIn: 84500,
    reason: 'Ruido al frenar',
    promisedDate: '2026-10-01',
    mechanic: { userId: USER_ID, name: 'Carlos Huamán Quispe' },
  }

  it('una orden vencida se edita sin moverle la fecha', () => {
    const schema = updateWorkOrderFormSchema(order.promisedDate)
    expect(messagesOf(schema, workOrderToForm(order))).toEqual([])
    expect(
      messagesOf(schema, {
        ...workOrderToForm(order),
        promisedDate: '2026-10-02',
      }),
    ).toEqual(['La fecha prometida no puede ser anterior a hoy'])
  })

  it('vaciar la fecha o el mecánico los quita (null)', () => {
    expect(
      updateWorkOrderInputSchema.parse({
        ...workOrderToForm(order),
        promisedDate: '',
        mechanicId: '',
      }),
    ).toStrictEqual({
      mileageIn: 84500,
      reason: 'Ruido al frenar',
      promisedDate: null,
      mechanicId: null,
    })
  })
})

describe('cambio de estado', () => {
  it('cancelar pide el motivo y lo deja interno por defecto', () => {
    expect(emptyStatusChangeForm('CANCELLED')).toStrictEqual({
      note: '',
      isPublic: false,
    })
    expect(
      messagesOf(statusChangeFormSchema('CANCELLED'), {
        note: '  ',
        isPublic: false,
      }),
    ).toEqual(['Indica el motivo de la cancelación'])
  })

  it('los demás cambios no exigen nota y los ve el cliente por defecto', () => {
    expect(emptyStatusChangeForm('READY')).toStrictEqual({
      note: '',
      isPublic: true,
    })
    expect(
      messagesOf(
        statusChangeFormSchema('READY'),
        emptyStatusChangeForm('READY'),
      ),
    ).toEqual([])
  })

  it('la nota vacía viaja como null', () => {
    expect(
      changeStatusRequestSchema.parse({
        workOrderId: VEHICLE_ID,
        status: 'READY',
        note: '  ',
        isPublic: true,
      }),
    ).toStrictEqual({
      workOrderId: VEHICLE_ID,
      status: 'READY',
      note: null,
      isPublic: true,
    })
  })
})

describe('noteFormSchema', () => {
  it('pide la nota y la recorta', () => {
    expect(messagesOf(noteFormSchema, { note: ' ', isPublic: false })).toEqual([
      'Escribe la nota',
    ])
    expect(
      noteFormSchema.parse({ note: ' Repuesto en camino ', isPublic: true }),
    ).toStrictEqual({ note: 'Repuesto en camino', isPublic: true })
  })
})

describe('workOrdersSearchSchema', () => {
  it('por defecto: primera página, lo último que entró primero, sin filtros', () => {
    expect(defaultWorkOrdersSearch).toStrictEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'receivedAt',
      sortOrder: 'desc',
    })
  })

  it('los estados son una lista; uno que no existe descarta el filtro', () => {
    expect(
      workOrdersSearchSchema.parse({ status: ['READY', 'DIAGNOSIS'] }).status,
    ).toEqual(['READY', 'DIAGNOSIS'])
    expect(
      workOrdersSearchSchema.parse({ status: ['READY', 'FINISHED'] }).status,
    ).toBeUndefined()
    expect(workOrdersSearchSchema.parse({ status: [] }).status).toBeUndefined()
  })

  it('descarta ids, fechas y órdenes que no se entienden', () => {
    expect(
      workOrdersSearchSchema.parse({
        mechanicId: '123',
        from: '2026-02-30',
        sortBy: 'status',
        overdue: 'si',
      }),
    ).toEqual(defaultWorkOrdersSearch)
  })

  it('«Limpiar» quita búsqueda y filtros y conserva orden y tamaño', () => {
    const search = workOrdersSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'ABK',
      status: ['READY'],
      mechanicId: USER_ID,
      vehicleId: VEHICLE_ID,
      customerId: VEHICLE_ID,
      overdue: true,
      from: '2026-10-01',
      to: '2026-10-04',
      sortBy: 'promisedDate',
      sortOrder: 'asc',
    })
    expect({ ...search, ...WORK_ORDER_FILTERS_CLEARED }).toStrictEqual({
      page: 1,
      pageSize: 20,
      search: undefined,
      status: undefined,
      mechanicId: undefined,
      vehicleId: undefined,
      customerId: undefined,
      overdue: undefined,
      from: undefined,
      to: undefined,
      sortBy: 'promisedDate',
      sortOrder: 'asc',
    })
  })
})

describe('ítems: estados, permisos y cantidades', () => {
  it('los ítems se cambian en los mismos estados que en la API', () => {
    expect(WORK_ORDER_STATUSES.filter(canChangeItems)).toEqual([
      'RECEIVED',
      'DIAGNOSIS',
      'IN_PROGRESS',
      'WAITING_PARTS',
    ])
  })

  it('el mecánico edita servicios; un repuesto solo el administrador', () => {
    expect(canEditItem({ type: 'SERVICE' }, 'MECHANIC')).toBe(true)
    expect(canEditItem({ type: 'PRODUCT' }, 'MECHANIC')).toBe(false)
    expect(canEditItem({ type: 'PRODUCT' }, 'ADMIN')).toBe(true)
  })

  it('la cantidad de un repuesto lleva su unidad; la de un servicio, no', () => {
    expect(formatItemQuantity({ quantity: '4.50', unit: 'LITER' })).toBe(
      '4.50 L',
    )
    expect(formatItemQuantity({ quantity: '2.00', unit: 'UNIT' })).toBe('2 und')
    expect(formatItemQuantity({ quantity: '1.00', unit: null })).toBe('1')
  })
})

describe('agregar un ítem', () => {
  it('exige el original y una cantidad mayor que 0', () => {
    expect(messagesOf(addItemFormSchema('SERVICE'), emptyAddItemForm)).toEqual([
      'Selecciona el servicio',
    ])
    expect(
      messagesOf(addItemFormSchema('PRODUCT'), {
        ...emptyAddItemForm,
        sourceId: PRODUCT_ID,
        quantity: '0',
      }),
    ).toEqual(['La cantidad tiene que ser mayor que 0'])
    expect(
      messagesOf(addItemFormSchema('PRODUCT'), {
        ...emptyAddItemForm,
        sourceId: PRODUCT_ID,
        quantity: '1.255',
        unitPrice: '-3',
      }),
    ).toEqual([
      'La cantidad tiene como máximo 2 decimales',
      'El precio unitario no puede ser negativo',
    ])
  })

  it('el precio y la descripción vacíos no viajan: la API copia los del original', () => {
    const request = toAddItemRequest(WORK_ORDER_ID, 'PRODUCT', {
      sourceId: PRODUCT_ID,
      quantity: '2',
      unitPrice: '',
      description: '  ',
    })
    expect(addItemRequestSchema.parse(request)).toStrictEqual({
      workOrderId: WORK_ORDER_ID,
      values: {
        type: 'PRODUCT',
        productId: PRODUCT_ID,
        quantity: '2',
        unitPrice: undefined,
        description: undefined,
      },
    })
  })

  it('el id va en su campo según el tipo, con el precio del administrador', () => {
    const request = toAddItemRequest(WORK_ORDER_ID, 'SERVICE', {
      sourceId: SERVICE_ID,
      quantity: '1',
      unitPrice: '70.00',
      description: 'Afinamiento (cliente frecuente)',
    })
    expect(addItemRequestSchema.parse(request).values).toStrictEqual({
      type: 'SERVICE',
      serviceCatalogItemId: SERVICE_ID,
      quantity: '1',
      unitPrice: '70.00',
      description: 'Afinamiento (cliente frecuente)',
    })
  })
})

describe('editar un ítem', () => {
  const service = {
    workOrderItemId: ITEM_ID,
    type: 'SERVICE' as const,
    quantity: '1.00',
    unitPrice: '80.00',
    description: 'Cambio de aceite y filtro',
  }

  it('parte de lo que tiene, con «1» en vez de «1.00»', () => {
    expect(itemToEditForm(service)).toStrictEqual({
      quantity: '1',
      unitPrice: '80.00',
      description: 'Cambio de aceite y filtro',
    })
    expect(itemToEditForm({ ...service, quantity: '1.50' }).quantity).toBe(
      '1.50',
    )
  })

  it('solo valida lo que quien edita puede cambiar', () => {
    const mechanic = editItemFormSchema({
      canEditQuantity: true,
      canEditPrice: false,
    })
    expect(
      messagesOf(mechanic, { quantity: '2', unitPrice: '', description: '' }),
    ).toEqual([])
    const adminOnPart = editItemFormSchema({
      canEditQuantity: false,
      canEditPrice: true,
    })
    expect(
      messagesOf(adminOnPart, { quantity: '', unitPrice: '', description: '' }),
    ).toEqual(['Ingresa el precio unitario', 'Escribe la descripción del ítem'])
  })

  it('manda solo lo que se puede cambiar: nunca la cantidad de un repuesto', () => {
    const values = { quantity: '2', unitPrice: '75.00', description: 'Otro' }
    expect(
      toUpdateItemRequest(WORK_ORDER_ID, service, values, 'MECHANIC').values,
    ).toStrictEqual({ quantity: '2' })
    expect(
      toUpdateItemRequest(
        WORK_ORDER_ID,
        { ...service, type: 'PRODUCT' },
        values,
        'ADMIN',
      ).values,
    ).toStrictEqual({ unitPrice: '75.00', description: 'Otro' })
    expect(
      updateItemRequestSchema.safeParse(
        toUpdateItemRequest(WORK_ORDER_ID, service, values, 'ADMIN'),
      ).success,
    ).toBe(true)
  })
})
