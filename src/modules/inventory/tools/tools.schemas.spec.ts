import {
  TOOL_FILTERS_CLEARED,
  assignToolFormSchema,
  assigneeOption,
  defaultToolsSearch,
  emptyToolForm,
  toolFormSchema,
  toolInputSchema,
  toolLocation,
  toolToForm,
  toolsSearchSchema,
} from './tools.schemas'
import type { Tool } from './tools.schemas'

const USER_ID = '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b'

const valid = { ...emptyToolForm, code: 'HER-01', name: 'Gata hidráulica 3 t' }

const messagesOf = (values: unknown) => {
  const result = toolFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

const tool: Tool = {
  toolId: '6f1c2a5e-8d3b-4c7a-9e1f-2b3c4d5e6f70',
  code: 'HER-TORQ-01',
  name: 'Torquímetro de 1/2"',
  brand: null,
  status: 'AVAILABLE',
  notes: null,
  assignedTo: { userId: USER_ID, name: 'Jorge Quispe' },
  createdAt: '2026-10-04T12:00:00.000Z',
  updatedAt: '2026-10-04T12:00:00.000Z',
}

describe('toolFormSchema', () => {
  it('acepta una herramienta en el almacén o asignada', () => {
    expect(messagesOf(valid)).toEqual([])
    expect(messagesOf({ ...valid, assignedToId: USER_ID })).toEqual([])
  })

  it('exige el código y el nombre, con los mismos topes que la API', () => {
    expect(messagesOf({ ...valid, code: ' ', name: '' })).toEqual([
      'Ingresa el código',
      'Ingresa el nombre de la herramienta',
    ])
    expect(
      messagesOf({
        ...valid,
        code: 'X'.repeat(31),
        brand: 'x'.repeat(61),
        notes: 'x'.repeat(1001),
      }),
    ).toEqual([
      'El código tiene como máximo 30 caracteres',
      'La marca tiene como máximo 60 caracteres',
      'Las notas tienen como máximo 1000 caracteres',
    ])
  })

  it('rechaza una asignación que no es un usuario', () => {
    expect(messagesOf({ ...valid, assignedToId: 'juan' })).toEqual([
      'Selecciona a quién se le asigna',
    ])
  })
})

describe('toolInputSchema', () => {
  it('manda el código en mayúsculas y los vacíos como null', () => {
    expect(
      toolInputSchema.parse({ ...valid, code: ' her-01 ', brand: ' ' }),
    ).toStrictEqual({
      code: 'HER-01',
      name: 'Gata hidráulica 3 t',
      brand: null,
      status: 'AVAILABLE',
      assignedToId: null,
      notes: null,
    })
  })

  it('manda la asignación solo si la herramienta está operativa', () => {
    expect(
      toolInputSchema.parse({ ...valid, assignedToId: USER_ID }).assignedToId,
    ).toBe(USER_ID)
    expect(
      toolInputSchema.parse({
        ...valid,
        status: 'IN_REPAIR',
        assignedToId: USER_ID,
      }).assignedToId,
    ).toBeNull()
  })
})

describe('toolToForm', () => {
  it('lleva a quién la tiene, y los vacíos como texto vacío', () => {
    expect(toolToForm(tool)).toStrictEqual({
      code: 'HER-TORQ-01',
      name: 'Torquímetro de 1/2"',
      brand: '',
      status: 'AVAILABLE',
      assignedToId: USER_ID,
      notes: '',
    })
    expect(toolToForm({ ...tool, assignedTo: null }).assignedToId).toBe('')
  })
})

describe('toolLocation y assigneeOption', () => {
  it('dice quién la tiene o que está en el almacén', () => {
    expect(toolLocation(tool)).toBe('Jorge Quispe')
    expect(toolLocation({ assignedTo: null })).toBe('En el almacén')
  })

  it('arma la opción del combobox con el usuario que la tiene', () => {
    expect(assigneeOption({ userId: USER_ID, name: 'Jorge Quispe' })).toEqual({
      value: USER_ID,
      label: 'Jorge Quispe',
    })
  })
})

describe('assignToolFormSchema', () => {
  it('exige elegir a quién se le entrega', () => {
    expect(assignToolFormSchema.safeParse({ assignedToId: '' }).success).toBe(
      false,
    )
    expect(
      assignToolFormSchema.safeParse({ assignedToId: USER_ID }).success,
    ).toBe(true)
  })
})

describe('toolsSearchSchema', () => {
  it('por defecto: primera página de 10, por código ascendente, sin filtros', () => {
    expect(defaultToolsSearch).toStrictEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'code',
      sortOrder: 'asc',
    })
  })

  it('lee los filtros de la URL', () => {
    expect(
      toolsSearchSchema.parse({
        status: 'IN_REPAIR',
        assignedToId: USER_ID,
        isAssigned: true,
        sortBy: 'status',
      }),
    ).toMatchObject({
      status: 'IN_REPAIR',
      assignedToId: USER_ID,
      isAssigned: true,
      sortBy: 'status',
    })
  })

  it('una URL editada a mano cae a los valores por defecto', () => {
    expect(
      toolsSearchSchema.parse({
        page: 0,
        pageSize: 7,
        status: 'LOST',
        assignedToId: 'none',
        isAssigned: 'si',
        sortBy: 'brand',
      }),
    ).toEqual(defaultToolsSearch)
  })

  it('«Limpiar» quita la búsqueda y todos los filtros', () => {
    expect(TOOL_FILTERS_CLEARED).toStrictEqual({
      search: undefined,
      status: undefined,
      assignedToId: undefined,
      isAssigned: undefined,
      page: 1,
    })
  })
})
