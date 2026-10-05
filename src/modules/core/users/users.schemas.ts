import { z } from 'zod'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { PAGE_SIZES } from '#/components/data-table/DataTablePagination'
import { ROLE_LABELS } from '#/modules/core/auth/auth.schemas'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import type { components } from '#/types/api.gen'

export type User = components['schemas']['User']

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

const password = z
  .string()
  .min(8, 'La contraseña tiene al menos 8 caracteres')
  .max(200, 'La contraseña es demasiado larga')

/** Que la confirmación coincida; el error va en el campo de confirmación. */
function confirmationMatches(
  value: { password: string; passwordConfirmation: string },
  ctx: z.RefinementCtx,
) {
  if (value.password !== value.passwordConfirmation) {
    ctx.addIssue({
      code: 'custom',
      path: ['passwordConfirmation'],
      message: 'Las contraseñas no coinciden',
    })
  }
}

/**
 * Los datos de un usuario que se editan. La contraseña no está: tiene su propio
 * diálogo, «Cambiar contraseña».
 */
export const userFormSchema = z.object({
  email,
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

/**
 * El alta: los mismos datos, sin el estado (un usuario nuevo nace activo) y con
 * la contraseña inicial escrita dos veces.
 */
export const newUserFormSchema = userFormSchema
  .omit({ isActive: true })
  .extend({ password, passwordConfirmation: z.string() })
  .superRefine(confirmationMatches)

export type NewUserFormValues = z.infer<typeof newUserFormSchema>

/** La contraseña nueva que el administrador le asigna a un usuario. */
export const passwordFormSchema = z
  .object({ password, passwordConfirmation: z.string() })
  .superRefine(confirmationMatches)

export type PasswordFormValues = z.infer<typeof passwordFormSchema>

export const emptyNewUserForm: NewUserFormValues = {
  email: '',
  name: '',
  phone: '',
  role: 'MECHANIC',
  password: '',
  passwordConfirmation: '',
}

export const emptyPasswordForm: PasswordFormValues = {
  password: '',
  passwordConfirmation: '',
}

/** Los valores del formulario para editar un usuario existente. */
export function userToForm(user: User): UserFormValues {
  return {
    email: user.email,
    name: user.name,
    phone: user.phone ?? '',
    role: user.role,
    isActive: user.isActive,
  }
}

// Lo que se le manda a la API. La confirmación no viaja (la API rechaza una
// propiedad que no declara) y el teléfono vacío va como null para borrarlo.

export const createUserInputSchema = newUserFormSchema.transform((value) => ({
  email: value.email,
  name: value.name,
  phone: value.phone || null,
  role: value.role,
  password: value.password,
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

export const changeUserPasswordRequestSchema = z.object({
  userId: z.uuid(),
  values: passwordFormSchema.transform(({ password: value }) => ({
    password: value,
  })),
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
