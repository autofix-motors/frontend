import { createServerFn } from '@tanstack/react-start'
import {
  callApi,
  callApiEnvelope,
  callApiPage,
  toQueryString,
} from '#/server/api'
import {
  createUserInputSchema,
  updateUserRequestSchema,
  userIdSchema,
  usersSearchSchema,
} from './users.schemas'
import type { IssuedUser, TemporaryPassword, User } from './users.schemas'

// El personal del taller, contra /users. Las mutaciones devuelven el mensaje de
// la API para mostrarlo tal cual en el aviso.

export const listUsers = createServerFn({ method: 'GET' })
  .validator(usersSearchSchema)
  .handler(({ data }) => callApiPage<User>(`/users${toQueryString(data)}`))

export const getUser = createServerFn({ method: 'GET' })
  .validator(userIdSchema)
  .handler(({ data }) => callApi<User>(`/users/${data.userId}`))

export const createUser = createServerFn({ method: 'POST' })
  .validator(createUserInputSchema)
  .handler(async ({ data }) => {
    const { data: issued, message } = await callApiEnvelope<IssuedUser>(
      '/users',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { issued, message }
  })

export const updateUser = createServerFn({ method: 'POST' })
  .validator(updateUserRequestSchema)
  .handler(async ({ data }) => {
    const { data: user, message } = await callApiEnvelope<User>(
      `/users/${data.userId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { user, message }
  })

/** Genera una contraseña temporal nueva; la API cierra sus sesiones. */
export const issueUserTemporaryPassword = createServerFn({ method: 'POST' })
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { data: password, message } =
      await callApiEnvelope<TemporaryPassword>(
        `/users/${data.userId}/temporary-password`,
        { method: 'POST' },
      )
    return { password, message }
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(`/users/${data.userId}`, {
      method: 'DELETE',
    })
    return { message }
  })
