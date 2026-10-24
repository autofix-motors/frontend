import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { ROLE_LABELS } from '#/modules/core/auth/auth.schemas'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import type { components } from '#/types/api.gen'

export type User = components['schemas']['User']
/** El usuario recién registrado, con su contraseña temporal. */
export type IssuedUser = components['schemas']['IssuedUser']
export type TemporaryPassword = components['schemas']['TemporaryPassword']

export const USER_ROLES = [
  'ADMIN',
  'MECHANIC',
] as const satisfies readonly UserRole[]

export const roleOptions = USER_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))

/**
 * Un usuario como opción de un combobox: el nombre, y debajo el rol y el
 * correo, para distinguir a dos con el mismo nombre.
 */
export function userOption(
  user: Pick<User, 'userId' | 'name' | 'role' | 'email'>,
): ComboboxOption {
  return {
    value: user.userId,
    label: user.name,
    description: `${ROLE_LABELS[user.role]} · ${user.email}`,
  }
}

// Las mismas reglas que valida la API (create-user.dto.ts del backend), para
// avisar al momento en el formulario.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'El correo es demasiado largo')
  .pipe(z.email({ error: 'Ingresa un correo válido' }))

/** El DNI como lo guarda la API: sin espacios, puntos ni guiones. */
const documentNumber = z
  .string()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'El DNI tiene 8 dígitos'))

/**
 * Los datos de un usuario que se editan. La contraseña no está: la genera el
 * sistema al registrarlo o al restablecerla («Restablecer contraseña»).
 */
export const userFormSchema = z.object({
  email,
  documentNumber,
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre')
    .max(120, 'El nombre tiene como máximo 120 caracteres'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?\d{6,15}$/.test(value.replace(/[\s()-]/g, '')),
      'El teléfono tiene de 6 a 15 dígitos y puede empezar con +',
    ),
  role: z.enum(USER_ROLES, { error: 'Selecciona el rol' }),
  isActive: z.boolean(),
})

export type UserFormValues = z.infer<typeof userFormSchema>

export type UserFormInput = z.input<typeof userFormSchema>

/**
 * El alta: los mismos datos, sin el estado (un usuario nuevo nace activo). Sin
 * contraseña: la genera el sistema y se le comparte.
 */
export const newUserFormSchema = userFormSchema.omit({ isActive: true })

export type NewUserFormValues = z.input<typeof newUserFormSchema>

export const emptyNewUserForm: NewUserFormValues = {
  email: '',
  documentNumber: '',
  name: '',
  phone: '',
  role: 'MECHANIC',
}

/** Los valores del formulario para editar un usuario existente. */
export function userToForm(user: User): UserFormInput {
  return {
    email: user.email,
    // Vacío en el personal registrado antes de pedirlo: al guardar se exige.
    documentNumber: user.documentNumber ?? '',
    name: user.name,
    phone: user.phone ?? '',
    role: user.role,
    isActive: user.isActive,
  }
}

// Lo que se le manda a la API: el teléfono vacío va como null para borrarlo.

export const createUserInputSchema = newUserFormSchema.transform((value) => ({
  ...value,
  phone: value.phone || null,
}))

export type CreateUserInput = z.input<typeof createUserInputSchema>

export const updateUserInputSchema = userFormSchema.transform((value) => ({
  ...value,
  phone: value.phone || null,
}))

export type UpdateUserInput = z.input<typeof updateUserInputSchema>

export const userIdSchema = z.object({ userId: z.uuid() })

export const updateUserRequestSchema = z.object({
  userId: z.uuid(),
  values: updateUserInputSchema,
})


/**
 * La búsqueda, los filtros, el orden y la página del listado, tal como viven en
 * la URL. Un valor inválido (alguien editó la URL a mano) cae a su valor por
 * defecto en vez de romper la página.
 */
export const usersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(10),
  search: z.string().trim().max(100).optional().catch(undefined),
  role: z.enum(USER_ROLES).optional().catch(undefined),
  isActive: z.boolean().optional().catch(undefined),
  sortBy: z.enum(['name', 'createdAt', 'lastLoginAt']).catch('name'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc'),
})

export type UsersSearch = z.infer<typeof usersSearchSchema>

/**
 * Los valores por defecto: no se escriben en la URL. Zod 4 omite las claves
 * opcionales que quedan `undefined`, así que aquí no aparecen `search` ni los
 * filtros.
 */
export const defaultUsersSearch: UsersSearch = usersSearchSchema.parse({})

/**
 * Lo que aplica «Limpiar»: quita la búsqueda y los filtros, y vuelve a la
 * primera página; conserva el orden y el tamaño de página. Las claves van
 * explícitas en `undefined` porque el cambio se mezcla con la búsqueda actual.
 */
export const USER_FILTERS_CLEARED = {
  search: undefined,
  role: undefined,
  isActive: undefined,
  page: 1,
} satisfies Partial<UsersSearch>
