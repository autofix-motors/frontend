import { createServerFn } from '@tanstack/react-start'
import {
  callApi,
  callApiEnvelope,
  callApiPage,
  toQueryString,
} from '#/server/api'
import {
  changeUserPasswordRequestSchema,
  createUserInputSchema,
  updateUserRequestSchema,
  userIdSchema,
  usersSearchSchema,
} from './users.schemas'
import type { User } from './users.schemas'

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
    const { data: user, message } = await callApiEnvelope<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { user, message }
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

export const changeUserPassword = createServerFn({ method: 'POST' })
  .validator(changeUserPasswordRequestSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/users/${data.userId}/password`,
      { method: 'PUT', body: JSON.stringify(data.values) },
    )
    return { message }
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(`/users/${data.userId}`, {
      method: 'DELETE',
    })
    return { message }
  })
