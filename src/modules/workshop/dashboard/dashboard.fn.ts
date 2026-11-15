import { createServerFn } from '@tanstack/react-start'
import { callApi } from '#/server/api'
import type { Dashboard } from './dashboard.schemas'

// El panel de inicio del personal, contra /dashboard. La API decide qué ve
// cada rol: al mecánico le llegan solo sus órdenes y en null lo que es de
// administración (montos, carga del equipo, servicios y stock).

export const getDashboard = createServerFn({ method: 'GET' }).handler(() =>
  callApi<Dashboard>('/dashboard'),
)
