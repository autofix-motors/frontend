import {
  USER_FILTERS_CLEARED,
  createUserInputSchema,
  emptyNewUserForm,
  newUserFormSchema,
  updateUserInputSchema,
  userOption,
  userFormSchema,
  usersSearchSchema,
} from './users.schemas'

const valid = {
  ...emptyNewUserForm,
  email: 'jquispe@autofix.local',
  documentNumber: '45678912',
  name: 'Juan Quispe',
}

const messagesOf = (
  schema: typeof newUserFormSchema | typeof userFormSchema,
  values: unknown,
) => {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('newUserFormSchema', () => {
  it('acepta un usuario válido', () => {
    expect(messagesOf(newUserFormSchema, valid)).toEqual([])
  })

  it('exige el DNI de 8 dígitos, sin importar puntos ni espacios', () => {
    expect(
      messagesOf(newUserFormSchema, { ...valid, documentNumber: '45.678 912' }),
    ).toEqual([])
    expect(
      messagesOf(newUserFormSchema, { ...valid, documentNumber: '1234' }),
    ).toEqual(['El DNI tiene 8 dígitos'])
  })

  it('rechaza un correo o un teléfono mal escritos', () => {
    expect(
      messagesOf(newUserFormSchema, {
        ...valid,
        email: 'juan@',
        phone: '12',
      }),
    ).toEqual([
      'Ingresa un correo válido',
      'El teléfono tiene de 6 a 15 dígitos y puede empezar con +',
    ])
  })
})

describe('createUserInputSchema', () => {
  it('normaliza el correo y el DNI, sin contraseña, y el teléfono vacío va como null', () => {
    expect(
      createUserInputSchema.parse({
        ...valid,
        email: ' JQuispe@AutoFix.Local ',
        documentNumber: '45.678.912',
      }),
    ).toStrictEqual({
      email: 'jquispe@autofix.local',
      documentNumber: '45678912',
      name: 'Juan Quispe',
      phone: null,
      role: 'MECHANIC',
    })
  })
})

describe('updateUserInputSchema', () => {
  it('lleva el estado y el DNI, y no la contraseña', () => {
    expect(
      updateUserInputSchema.parse({
        email: 'jquispe@autofix.local',
        documentNumber: '45678912',
        name: 'Juan Quispe',
        phone: '987 654 321',
        role: 'ADMIN',
        isActive: false,
      }),
    ).toStrictEqual({
      email: 'jquispe@autofix.local',
      documentNumber: '45678912',
      name: 'Juan Quispe',
      phone: '987 654 321',
      role: 'ADMIN',
      isActive: false,
    })
  })
})

describe('usersSearchSchema', () => {
  it('completa los valores por defecto, sin las claves opcionales', () => {
    expect(usersSearchSchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    })
  })

  it('«Limpiar» quita la búsqueda y los filtros y conserva el orden', () => {
    const current = usersSearchSchema.parse({
      page: 2,
      pageSize: 20,
      search: 'quispe',
      role: 'MECHANIC',
      isActive: false,
      sortBy: 'lastLoginAt',
      sortOrder: 'desc',
    })
    // Así lo combina la ruta al navegar; JSON hace lo que la URL: las claves
    // en undefined no viajan.
    const next = usersSearchSchema.parse({
      ...current,
      ...USER_FILTERS_CLEARED,
    })
    expect(JSON.parse(JSON.stringify(next))).toStrictEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'lastLoginAt',
      sortOrder: 'desc',
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      usersSearchSchema.parse({ role: 'OWNER', sortBy: 'email', page: 0 }),
    ).toMatchObject({ role: undefined, sortBy: 'name', page: 1 })
  })
})

describe('userOption', () => {
  it('muestra el nombre, y debajo el rol y el correo', () => {
    expect(
      userOption({
        userId: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
        name: 'Juan Quispe',
        role: 'MECHANIC',
        email: 'jquispe@autofix.local',
      }),
    ).toEqual({
      value: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
      label: 'Juan Quispe',
      description: 'Mecánico · jquispe@autofix.local',
    })
  })
})
