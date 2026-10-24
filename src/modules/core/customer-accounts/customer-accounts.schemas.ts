import { z } from 'zod'
import type { TemporaryCredentials } from '#/components/credentials/TemporaryPasswordDialog'
import type { Customer } from '#/modules/customer/customers/customers.schemas'
import type { components } from '#/types/api.gen'

/** El usuario y la contraseña temporal del portal, recién generados. */
export type PortalCredentials = components['schemas']['PortalCredentials']

export const customerAccountIdSchema = z.object({ customerId: z.uuid() })

/** Lo que se le comparte al cliente con su acceso al portal. */
export function portalCredentials(
  customer: Pick<Customer, 'name' | 'phone'>,
  credentials: PortalCredentials,
): TemporaryCredentials {
  return {
    name: customer.name,
    phone: customer.phone,
    loginIdentifier: credentials.loginIdentifier,
    temporaryPassword: credentials.temporaryPassword,
    expiresAt: credentials.expiresAt,
    isStaff: false,
  }
}
