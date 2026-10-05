import { createServerFn } from '@tanstack/react-start'
import {
  callApi,
  callApiEnvelope,
  callApiPage,
  toQueryString,
} from '#/server/api'
import {
  updateVehicleRequestSchema,
  vehicleIdSchema,
  vehicleInputSchema,
  vehiclesSearchSchema,
} from './vehicles.schemas'
import type { Vehicle, VehicleBrand } from './vehicles.schemas'

// Los vehículos de los clientes, contra /vehicles. Las mutaciones devuelven el
// mensaje de la API para mostrarlo tal cual en el aviso.

export const listVehicles = createServerFn({ method: 'GET' })
  .validator(vehiclesSearchSchema)
  .handler(({ data }) =>
    callApiPage<Vehicle>(`/vehicles${toQueryString(data)}`),
  )

export const getVehicle = createServerFn({ method: 'GET' })
  .validator(vehicleIdSchema)
  .handler(({ data }) => callApi<Vehicle>(`/vehicles/${data.vehicleId}`))

export const listVehicleBrands = createServerFn({ method: 'GET' }).handler(() =>
  callApi<VehicleBrand[]>('/vehicles/brands'),
)

export const createVehicle = createServerFn({ method: 'POST' })
  .validator(vehicleInputSchema)
  .handler(async ({ data }) => {
    const { data: vehicle, message } = await callApiEnvelope<Vehicle>(
      '/vehicles',
      { method: 'POST', body: JSON.stringify(data) },
    )
    return { vehicle, message }
  })

export const updateVehicle = createServerFn({ method: 'POST' })
  .validator(updateVehicleRequestSchema)
  .handler(async ({ data }) => {
    const { data: vehicle, message } = await callApiEnvelope<Vehicle>(
      `/vehicles/${data.vehicleId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { vehicle, message }
  })

export const deleteVehicle = createServerFn({ method: 'POST' })
  .validator(vehicleIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(
      `/vehicles/${data.vehicleId}`,
      { method: 'DELETE' },
    )
    return { message }
  })
