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
  'ADMINISTRADOR',
  'MECANICO',
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
  user: Pick<User, 'usuarioId' | 'nombre' | 'rol' | 'correo'>,
): ComboboxOption {
  return {
    value: user.usuarioId,
    label: user.nombre,
    description: `${ROLE_LABELS[user.rol]} · ${user.correo}`,
  }
}

// Las mismas reglas que valida la API (create-user.dto.ts del backend), para
// avisar al momento en el formulario.

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'El correo es demasiado largo')
  .pipe(z.email({ error: 'Ingresa un correo válido' }))

/** El DNI como lo guarda la API: sin espacios, puntos ni guiones. */
const numeroDocumento = z
  .string()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'El DNI tiene 8 dígitos'))

/**
 * Los datos de un usuario que se editan. La contraseña no está: la genera el
 * sistema al registrarlo o al restablecerla («Restablecer contraseña»).
 */
export const userFormSchema = z.object({
  correo,
  numeroDocumento,
  nombre: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre')
    .max(120, 'El nombre tiene como máximo 120 caracteres'),
  telefono: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?\d{6,15}$/.test(value.replace(/[\s()-]/g, '')),
      'El teléfono tiene de 6 a 15 dígitos y puede empezar con +',
    ),
  rol: z.enum(USER_ROLES, { error: 'Selecciona el rol' }),
  activo: z.boolean(),
})

export type UserFormValues = z.infer<typeof userFormSchema>

export type UserFormInput = z.input<typeof userFormSchema>

/**
 * El alta: los mismos datos, sin el estado (un usuario nuevo nace activo). Sin
 * contraseña: la genera el sistema y se le comparte.
 */
export const newUserFormSchema = userFormSchema.omit({ activo: true })

export type NewUserFormValues = z.input<typeof newUserFormSchema>

export const emptyNewUserForm: NewUserFormValues = {
  correo: '',
  numeroDocumento: '',
  nombre: '',
  telefono: '',
  rol: 'MECANICO',
}

/** Los valores del formulario para editar un usuario existente. */
export function userToForm(user: User): UserFormInput {
  return {
    correo: user.correo,
    // Vacío en el personal registrado antes de pedirlo: al guardar se exige.
    numeroDocumento: user.numeroDocumento ?? '',
    nombre: user.nombre,
    telefono: user.telefono ?? '',
    rol: user.rol,
    activo: user.activo,
  }
}

// Lo que se le manda a la API: el teléfono vacío va como null para borrarlo.

export const createUserInputSchema = newUserFormSchema.transform((value) => ({
  ...value,
  telefono: value.telefono || null,
}))

export type CreateUserInput = z.input<typeof createUserInputSchema>

export const updateUserInputSchema = userFormSchema.transform((value) => ({
  ...value,
  telefono: value.telefono || null,
}))

export type UpdateUserInput = z.input<typeof updateUserInputSchema>

export const userIdSchema = z.object({ usuarioId: z.uuid() })

export const updateUserRequestSchema = z.object({
  usuarioId: z.uuid(),
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
  rol: z.enum(USER_ROLES).optional().catch(undefined),
  activo: z.boolean().optional().catch(undefined),
  ordenarPor: z.enum(['nombre', 'creadoEn', 'ultimoIngresoEn']).catch('nombre'),
  sentido: z.enum(['asc', 'desc']).catch('asc'),
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
  rol: undefined,
  activo: undefined,
  page: 1,
} satisfies Partial<UsersSearch>
