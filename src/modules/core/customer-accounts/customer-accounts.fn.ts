import { createServerFn } from '@tanstack/react-start'
import { callApiEnvelope } from '#/server/api'
import { customerAccountIdSchema } from './customer-accounts.schemas'
import type { PortalCredentials } from './customer-accounts.schemas'

// El acceso de un cliente a su portal, contra /customer-accounts. Solo el
// administrador.

/** Habilita el acceso o lo restablece con una contraseña temporal nueva. */
export const issuePortalAccess = createServerFn({ method: 'POST' })
  .validator(customerAccountIdSchema)
  .handler(async ({ data }) => {
    const { data: credentials, message } =
      await callApiEnvelope<PortalCredentials>(
        `/customer-accounts/${data.customerId}/temporary-password`,
        { method: 'POST' },
      )
    return { credentials, message }
  })

export const removePortalAccess = createServerFn({ method: 'POST' })
  .validator(customerAccountIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/customer-accounts/${data.customerId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
