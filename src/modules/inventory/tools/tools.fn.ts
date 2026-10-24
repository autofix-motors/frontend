import { createServerFn } from '@tanstack/react-start'
import { callApiEnvelope, callApiPage, toQueryString } from '#/server/api'
import {
  assignToolRequestSchema,
  toolIdSchema,
  toolInputSchema,
  toolsSearchSchema,
  updateToolRequestSchema,
} from './tools.schemas'
import type { Tool } from './tools.schemas'

// Las herramientas, contra /tools. Las mutaciones devuelven el mensaje de la
// API para mostrarlo tal cual en el aviso.

export const listTools = createServerFn({ method: 'GET' })
  .validator(toolsSearchSchema)
  .handler(({ data }) => callApiPage<Tool>(`/tools${toQueryString(data)}`))

export const createTool = createServerFn({ method: 'POST' })
  .validator(toolInputSchema)
  .handler(async ({ data }) => {
    const { data: tool, message } = await callApiEnvelope<Tool>('/tools', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { tool, message }
  })

export const updateTool = createServerFn({ method: 'POST' })
  .validator(updateToolRequestSchema)
  .handler(async ({ data }) => {
    const { data: tool, message } = await callApiEnvelope<Tool>(
      `/tools/${data.toolId}`,
      { method: 'PATCH', body: JSON.stringify(data.values) },
    )
    return { tool, message }
  })

export const assignTool = createServerFn({ method: 'POST' })
  .validator(assignToolRequestSchema)
  .handler(async ({ data }) => {
    const { data: tool, message } = await callApiEnvelope<Tool>(
      `/tools/${data.toolId}/assignment`,
      {
        method: 'PUT',
        body: JSON.stringify({ assignedToId: data.assignedToId }),
      },
    )
    return { tool, message }
  })

export const deleteTool = createServerFn({ method: 'POST' })
  .validator(toolIdSchema)
  .handler(async ({ data }) => {
    const { message } = await callApiEnvelope<null>(`/tools/${data.toolId}`, {
      method: 'DELETE',
    })
    return { message }
  })
