import {
  USER_FILTERS_CLEARED,
  changeUserPasswordRequestSchema,
  createUserInputSchema,
  emptyNewUserForm,
  newUserFormSchema,
  passwordFormSchema,
  updateUserInputSchema,
  userOption,
  userFormSchema,
  usersSearchSchema,
} from './users.schemas'

const valid = {
  ...emptyNewUserForm,
  email: 'jquispe@autofix.local',
  name: 'Juan Quispe',
  password: 'Mecanico123',
  passwordConfirmation: 'Mecanico123',
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

  it('exige una contraseña de al menos 8 caracteres, igual que la API', () => {
    expect(
      messagesOf(newUserFormSchema, {
        ...valid,
        password: 'corta',
        passwordConfirmation: 'corta',
      }),
    ).toEqual(['La contraseña tiene al menos 8 caracteres'])
  })

  it('marca la confirmación cuando no coincide', () => {
    const result = newUserFormSchema.safeParse({
      ...valid,
      passwordConfirmation: 'Mecanico124',
    })
    expect(result.error?.issues).toMatchObject([
      {
        path: ['passwordConfirmation'],
        message: 'Las contraseñas no coinciden',
      },
    ])
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
  it('no manda la confirmación, normaliza el correo y el teléfono vacío va como null', () => {
    expect(
      createUserInputSchema.parse({
        ...valid,
        email: ' JQuispe@AutoFix.Local ',
      }),
    ).toStrictEqual({
      email: 'jquispe@autofix.local',
      name: 'Juan Quispe',
      phone: null,
      role: 'MECHANIC',
      password: 'Mecanico123',
    })
  })
})

describe('updateUserInputSchema', () => {
  it('lleva el estado y no la contraseña', () => {
    expect(
      updateUserInputSchema.parse({
        email: 'jquispe@autofix.local',
        name: 'Juan Quispe',
        phone: '987 654 321',
        role: 'ADMIN',
        isActive: false,
      }),
    ).toStrictEqual({
      email: 'jquispe@autofix.local',
      name: 'Juan Quispe',
      phone: '987 654 321',
      role: 'ADMIN',
      isActive: false,
    })
  })
})

describe('changeUserPasswordRequestSchema', () => {
  it('solo manda la contraseña nueva, no la confirmación', () => {
    expect(
      changeUserPasswordRequestSchema.parse({
        userId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
        values: {
          password: 'OtraClave123',
          passwordConfirmation: 'OtraClave123',
        },
      }).values,
    ).toStrictEqual({ password: 'OtraClave123' })
  })

  it('rechaza una confirmación distinta', () => {
    expect(
      passwordFormSchema.safeParse({
        password: 'OtraClave123',
        passwordConfirmation: 'otraclave123',
      }).success,
    ).toBe(false)
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
