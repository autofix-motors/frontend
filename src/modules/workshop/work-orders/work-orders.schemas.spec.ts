import type { z } from 'zod'
import {
  OPEN_STATUSES,
  authorName,
  canSendQuote,
  decideQuoteFormSchema,
  decideQuoteRequestSchema,
  emptyDecideQuoteForm,
  emptySendQuoteForm,
  pendingQuote,
  sendQuoteFormSchema,
  sendQuoteRequestSchema,
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
    'RECIBIDO→EN_DIAGNOSTICO',
    'RECIBIDO→EN_REPARACION',
    'RECIBIDO→CANCELADO',
    'EN_DIAGNOSTICO→EN_REPARACION',
    'EN_DIAGNOSTICO→CANCELADO',
    'ESPERANDO_APROBACION→CANCELADO',
    'EN_REPARACION→ESPERANDO_REPUESTOS',
    'EN_REPARACION→LISTO',
    'EN_REPARACION→CANCELADO',
    'ESPERANDO_REPUESTOS→EN_REPARACION',
    'ESPERANDO_REPUESTOS→CANCELADO',
    'LISTO→ENTREGADO',
    'LISTO→EN_REPARACION',
    'LISTO→CANCELADO',
  ])
  const MECHANIC_ALLOWED = new Set(
    [...ADMIN_ALLOWED].filter(
      (pair) => !pair.endsWith('→ENTREGADO') && !pair.endsWith('→CANCELADO'),
    ),
  )
  const pairs = WORK_ORDER_STATUSES.flatMap((from) =>
    WORK_ORDER_STATUSES.map((to) => [from, to] as const),
  )

  it.each(pairs)('ADMINISTRADOR %s → %s', (from, to) => {
    expect(canTransition(from, to, 'ADMINISTRADOR')).toBe(
      ADMIN_ALLOWED.has(`${from}→${to}`),
    )
  })

  it.each(pairs)('MECANICO %s → %s', (from, to) => {
    expect(canTransition(from, to, 'MECANICO')).toBe(
      MECHANIC_ALLOWED.has(`${from}→${to}`),
    )
  })

  it('los botones de cada rol desde un estado', () => {
    expect(allowedTransitions('LISTO', 'ADMINISTRADOR')).toEqual([
      'ENTREGADO',
      'EN_REPARACION',
      'CANCELADO',
    ])
    expect(allowedTransitions('LISTO', 'MECANICO')).toEqual(['EN_REPARACION'])
    expect(allowedTransitions('ESPERANDO_APROBACION', 'MECANICO')).toEqual([])
    expect(allowedTransitions('ENTREGADO', 'ADMINISTRADOR')).toEqual([])
  })
})

describe('canEditDiagnosis y OPEN_STATUSES', () => {
  it('el diagnóstico se escribe mientras se trabaja, como en la API', () => {
    expect(WORK_ORDER_STATUSES.filter(canEditDiagnosis)).toEqual([
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'EN_REPARACION',
      'ESPERANDO_REPUESTOS',
    ])
  })

  it('abiertas: todo menos entregadas y canceladas', () => {
    expect(OPEN_STATUSES).toEqual([
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'ESPERANDO_APROBACION',
      'EN_REPARACION',
      'ESPERANDO_REPUESTOS',
      'LISTO',
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
    vehiculoId: VEHICLE_ID,
    kilometrajeIngreso: '84500',
    motivo: 'Ruido al frenar',
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
    const mileage = (kilometrajeIngreso: string) =>
      messagesOf(createWorkOrderFormSchema, { ...valid, kilometrajeIngreso })
    expect(mileage('0')).toEqual([])
    expect(mileage('9999999')).toEqual([])
    for (const bad of ['-1', '12.5', '10000000', '84 500']) {
      expect(mileage(bad)).toEqual([
        'El kilometraje es un número entero de 0 a 9 999 999',
      ])
    }
  })

  it('la fecha prometida no puede ser anterior a hoy en Lima', () => {
    const date = (fechaPrometida: string) =>
      messagesOf(createWorkOrderFormSchema, { ...valid, fechaPrometida })
    expect(date('2026-10-04')).toEqual([])
    expect(date('2026-10-03')).toEqual([
      'La fecha prometida no puede ser anterior a hoy',
    ])
  })

  it('manda números como número y lo vacío como null', () => {
    expect(createWorkOrderInputSchema.parse(valid)).toStrictEqual({
      vehiculoId: VEHICLE_ID,
      kilometrajeIngreso: 84500,
      motivo: 'Ruido al frenar',
      fechaPrometida: null,
      mecanicoId: null,
    })
    expect(
      createWorkOrderInputSchema.parse({
        ...valid,
        fechaPrometida: '2026-10-08',
        mecanicoId: USER_ID,
      }),
    ).toMatchObject({ fechaPrometida: '2026-10-08', mecanicoId: USER_ID })
  })
})

describe('updateWorkOrderFormSchema', () => {
  const order = {
    kilometrajeIngreso: 84500,
    motivo: 'Ruido al frenar',
    fechaPrometida: '2026-10-01',
    mecanico: { usuarioId: USER_ID, nombre: 'Carlos Huamán Quispe' },
  }

  it('una orden vencida se edita sin moverle la fecha', () => {
    const schema = updateWorkOrderFormSchema(order.fechaPrometida)
    expect(messagesOf(schema, workOrderToForm(order))).toEqual([])
    expect(
      messagesOf(schema, {
        ...workOrderToForm(order),
        fechaPrometida: '2026-10-02',
      }),
    ).toEqual(['La fecha prometida no puede ser anterior a hoy'])
  })

  it('vaciar la fecha o el mecánico los quita (null)', () => {
    expect(
      updateWorkOrderInputSchema.parse({
        ...workOrderToForm(order),
        fechaPrometida: '',
        mecanicoId: '',
      }),
    ).toStrictEqual({
      kilometrajeIngreso: 84500,
      motivo: 'Ruido al frenar',
      fechaPrometida: null,
      mecanicoId: null,
    })
  })
})

describe('cambio de estado', () => {
  it('cancelar pide el motivo y lo deja interno por defecto', () => {
    expect(emptyStatusChangeForm('CANCELADO')).toStrictEqual({
      nota: '',
      esPublico: false,
    })
    expect(
      messagesOf(statusChangeFormSchema('CANCELADO'), {
        nota: '  ',
        esPublico: false,
      }),
    ).toEqual(['Indica el motivo de la cancelación'])
  })

  it('los demás cambios no exigen nota y los ve el cliente por defecto', () => {
    expect(emptyStatusChangeForm('LISTO')).toStrictEqual({
      nota: '',
      esPublico: true,
    })
    expect(
      messagesOf(
        statusChangeFormSchema('LISTO'),
        emptyStatusChangeForm('LISTO'),
      ),
    ).toEqual([])
  })

  it('la nota vacía viaja como null', () => {
    expect(
      changeStatusRequestSchema.parse({
        ordenTrabajoId: VEHICLE_ID,
        estado: 'LISTO',
        nota: '  ',
        esPublico: true,
      }),
    ).toStrictEqual({
      ordenTrabajoId: VEHICLE_ID,
      estado: 'LISTO',
      nota: null,
      esPublico: true,
    })
  })
})

describe('noteFormSchema', () => {
  it('pide la nota y la recorta', () => {
    expect(messagesOf(noteFormSchema, { nota: ' ', esPublico: false })).toEqual(
      ['Escribe la nota'],
    )
    expect(
      noteFormSchema.parse({ nota: ' Repuesto en camino ', esPublico: true }),
    ).toStrictEqual({ nota: 'Repuesto en camino', esPublico: true })
  })
})

describe('workOrdersSearchSchema', () => {
  it('por defecto: primera página, lo último que entró primero, sin filtros', () => {
    expect(defaultWorkOrdersSearch).toStrictEqual({
      page: 1,
      pageSize: 10,
      ordenarPor: 'recibidaEn',
      sentido: 'desc',
    })
  })

  it('los estados son una lista; uno que no existe descarta el filtro', () => {
    expect(
      workOrdersSearchSchema.parse({ estado: ['LISTO', 'EN_DIAGNOSTICO'] })
        .estado,
    ).toEqual(['LISTO', 'EN_DIAGNOSTICO'])
    expect(
      workOrdersSearchSchema.parse({ estado: ['LISTO', 'FINISHED'] }).estado,
    ).toBeUndefined()
    expect(workOrdersSearchSchema.parse({ estado: [] }).estado).toBeUndefined()
  })

  it('descarta ids, fechas y órdenes que no se entienden', () => {
    expect(
      workOrdersSearchSchema.parse({
        mecanicoId: '123',
        desde: '2026-02-30',
        ordenarPor: 'estado',
        vencidas: 'si',
      }),
    ).toEqual(defaultWorkOrdersSearch)
  })

  it('«Limpiar» quita búsqueda y filtros y conserva orden y tamaño', () => {
    const search = workOrdersSearchSchema.parse({
      page: 3,
      pageSize: 20,
      search: 'ABK',
      estado: ['LISTO'],
      mecanicoId: USER_ID,
      vehiculoId: VEHICLE_ID,
      clienteId: VEHICLE_ID,
      vencidas: true,
      desde: '2026-10-01',
      hasta: '2026-10-04',
      ordenarPor: 'fechaPrometida',
      sentido: 'asc',
    })
    expect({ ...search, ...WORK_ORDER_FILTERS_CLEARED }).toStrictEqual({
      page: 1,
      pageSize: 20,
      search: undefined,
      estado: undefined,
      mecanicoId: undefined,
      vehiculoId: undefined,
      clienteId: undefined,
      vencidas: undefined,
      desde: undefined,
      hasta: undefined,
      ordenarPor: 'fechaPrometida',
      sentido: 'asc',
    })
  })
})

describe('ítems: estados, permisos y cantidades', () => {
  it('los ítems se cambian en los mismos estados que en la API', () => {
    expect(WORK_ORDER_STATUSES.filter(canChangeItems)).toEqual([
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'EN_REPARACION',
      'ESPERANDO_REPUESTOS',
    ])
  })

  it('el mecánico edita servicios; un repuesto solo el administrador', () => {
    expect(canEditItem({ tipo: 'SERVICIO' }, 'MECANICO')).toBe(true)
    expect(canEditItem({ tipo: 'PRODUCTO' }, 'MECANICO')).toBe(false)
    expect(canEditItem({ tipo: 'PRODUCTO' }, 'ADMINISTRADOR')).toBe(true)
  })

  it('la cantidad de un repuesto lleva su unidad; la de un servicio, no', () => {
    expect(formatItemQuantity({ cantidad: '4.50', unidad: 'LITRO' })).toBe(
      '4.50 L',
    )
    expect(formatItemQuantity({ cantidad: '2.00', unidad: 'UNIDAD' })).toBe(
      '2 und',
    )
    expect(formatItemQuantity({ cantidad: '1.00', unidad: null })).toBe('1')
  })
})

describe('agregar un ítem', () => {
  it('exige el original y una cantidad mayor que 0', () => {
    expect(messagesOf(addItemFormSchema('SERVICIO'), emptyAddItemForm)).toEqual(
      ['Selecciona el servicio'],
    )
    expect(
      messagesOf(addItemFormSchema('PRODUCTO'), {
        ...emptyAddItemForm,
        sourceId: PRODUCT_ID,
        cantidad: '0',
      }),
    ).toEqual(['La cantidad tiene que ser mayor que 0'])
    expect(
      messagesOf(addItemFormSchema('PRODUCTO'), {
        ...emptyAddItemForm,
        sourceId: PRODUCT_ID,
        cantidad: '1.255',
        precioUnitario: '-3',
      }),
    ).toEqual([
      'La cantidad tiene como máximo 2 decimales',
      'El precio unitario no puede ser negativo',
    ])
  })

  it('el precio y la descripción vacíos no viajan: la API copia los del original', () => {
    const request = toAddItemRequest(WORK_ORDER_ID, 'PRODUCTO', {
      sourceId: PRODUCT_ID,
      cantidad: '2',
      precioUnitario: '',
      descripcion: '  ',
    })
    expect(addItemRequestSchema.parse(request)).toStrictEqual({
      ordenTrabajoId: WORK_ORDER_ID,
      values: {
        tipo: 'PRODUCTO',
        productoId: PRODUCT_ID,
        cantidad: '2',
        precioUnitario: undefined,
        descripcion: undefined,
      },
    })
  })

  it('el id va en su campo según el tipo, con el precio del administrador', () => {
    const request = toAddItemRequest(WORK_ORDER_ID, 'SERVICIO', {
      sourceId: SERVICE_ID,
      cantidad: '1',
      precioUnitario: '70.00',
      descripcion: 'Afinamiento (cliente frecuente)',
    })
    expect(addItemRequestSchema.parse(request).values).toStrictEqual({
      tipo: 'SERVICIO',
      servicioId: SERVICE_ID,
      cantidad: '1',
      precioUnitario: '70.00',
      descripcion: 'Afinamiento (cliente frecuente)',
    })
  })
})

describe('editar un ítem', () => {
  const service = {
    detalleOrdenId: ITEM_ID,
    tipo: 'SERVICIO' as const,
    cantidad: '1.00',
    precioUnitario: '80.00',
    descripcion: 'Cambio de aceite y filtro',
  }

  it('parte de lo que tiene, con «1» en vez de «1.00»', () => {
    expect(itemToEditForm(service)).toStrictEqual({
      cantidad: '1',
      precioUnitario: '80.00',
      descripcion: 'Cambio de aceite y filtro',
    })
    expect(itemToEditForm({ ...service, cantidad: '1.50' }).cantidad).toBe(
      '1.50',
    )
  })

  it('solo valida lo que quien edita puede cambiar', () => {
    const mechanic = editItemFormSchema({
      canEditQuantity: true,
      canEditPrice: false,
    })
    expect(
      messagesOf(mechanic, {
        cantidad: '2',
        precioUnitario: '',
        descripcion: '',
      }),
    ).toEqual([])
    const adminOnPart = editItemFormSchema({
      canEditQuantity: false,
      canEditPrice: true,
    })
    expect(
      messagesOf(adminOnPart, {
        cantidad: '',
        precioUnitario: '',
        descripcion: '',
      }),
    ).toEqual(['Ingresa el precio unitario', 'Escribe la descripción del ítem'])
  })

  it('manda solo lo que se puede cambiar: nunca la cantidad de un repuesto', () => {
    const values = {
      cantidad: '2',
      precioUnitario: '75.00',
      descripcion: 'Otro',
    }
    expect(
      toUpdateItemRequest(WORK_ORDER_ID, service, values, 'MECANICO').values,
    ).toStrictEqual({ cantidad: '2' })
    expect(
      toUpdateItemRequest(
        WORK_ORDER_ID,
        { ...service, tipo: 'PRODUCTO' },
        values,
        'ADMINISTRADOR',
      ).values,
    ).toStrictEqual({ precioUnitario: '75.00', descripcion: 'Otro' })
    expect(
      updateItemRequestSchema.safeParse(
        toUpdateItemRequest(WORK_ORDER_ID, service, values, 'ADMINISTRADOR'),
      ).success,
    ).toBe(true)
  })
})

describe('presupuestos', () => {
  const QUOTE_ID = '5e4d3c2b-1a0f-4e9d-8c7b-6a5f4e3d2c1b'
  const quote = (estado: string, version: number) =>
    ({ presupuestoId: `q-${version}`, version, estado }) as never

  it('se envía en diagnóstico o a mitad de la reparación (copia de la API)', () => {
    expect(WORK_ORDER_STATUSES.filter(canSendQuote)).toEqual([
      'EN_DIAGNOSTICO',
      'EN_REPARACION',
      'ESPERANDO_REPUESTOS',
    ])
  })

  it('la versión pendiente solo cuenta mientras la orden espera aprobación', () => {
    const presupuestos = [quote('PENDIENTE', 2), quote('RECHAZADO', 1)]
    expect(
      pendingQuote({ estado: 'ESPERANDO_APROBACION', presupuestos })?.version,
    ).toBe(2)
    // Cancelada mientras esperaba: ya no hay respuesta que registrar.
    expect(pendingQuote({ estado: 'CANCELADO', presupuestos })).toBeUndefined()
    expect(
      pendingQuote({
        estado: 'ESPERANDO_APROBACION',
        presupuestos: [quote('APROBADO', 1)],
      }),
    ).toBeUndefined()
  })

  it('la nota del envío es opcional y vacía viaja como null', () => {
    expect(messagesOf(sendQuoteFormSchema, emptySendQuoteForm)).toEqual([])
    expect(messagesOf(sendQuoteFormSchema, { nota: 'x'.repeat(2001) })).toEqual(
      ['La nota tiene como máximo 2000 caracteres'],
    )
    expect(
      sendQuoteRequestSchema.parse({
        ordenTrabajoId: WORK_ORDER_ID,
        nota: '  ',
      }),
    ).toStrictEqual({ ordenTrabajoId: WORK_ORDER_ID, nota: null })
    expect(
      sendQuoteRequestSchema.parse({
        ordenTrabajoId: WORK_ORDER_ID,
        nota: ' Incluye la mano de obra ',
      }),
    ).toStrictEqual({
      ordenTrabajoId: WORK_ORDER_ID,
      nota: 'Incluye la mano de obra',
    })
  })

  it('la respuesta empieza vacía y pide qué respondió y por dónde', () => {
    expect(emptyDecideQuoteForm).toStrictEqual({
      decision: '',
      canal: '',
      nota: '',
    })
    expect(messagesOf(decideQuoteFormSchema, emptyDecideQuoteForm)).toEqual([
      'Indica si el cliente aprobó o rechazó el presupuesto',
      'Indica por dónde respondió el cliente',
    ])
    expect(
      messagesOf(decideQuoteFormSchema, {
        decision: 'REEMPLAZADO',
        canal: 'EMAIL',
        nota: '',
      }),
    ).toHaveLength(2)
  })

  it('lo que se manda: la decisión, el canal y la nota vacía como null', () => {
    expect(
      decideQuoteRequestSchema.parse({
        ordenTrabajoId: WORK_ORDER_ID,
        presupuestoId: QUOTE_ID,
        values: { decision: 'APROBADO', canal: 'WHATSAPP', nota: ' ' },
      }),
    ).toStrictEqual({
      ordenTrabajoId: WORK_ORDER_ID,
      presupuestoId: QUOTE_ID,
      values: { decision: 'APROBADO', canal: 'WHATSAPP', nota: null },
    })
    // El servidor vuelve a validar: un vacío no llega a la API.
    expect(
      decideQuoteRequestSchema.safeParse({
        ordenTrabajoId: WORK_ORDER_ID,
        presupuestoId: QUOTE_ID,
        values: emptyDecideQuoteForm,
      }).success,
    ).toBe(false)
  })
})

describe('authorName', () => {
  it('el personal por su nombre; sin autor, el cliente desde su portal', () => {
    expect(authorName({ nombre: 'Ana Admin' })).toBe('Ana Admin')
    expect(authorName(null)).toBe('El cliente (portal)')
  })
})
