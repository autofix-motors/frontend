import { queryOptions } from '@tanstack/react-query'
import { getDashboard } from './dashboard.fn'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: dashboardKeys.summary(),
      queryFn: () => getDashboard(),
    }),
}
