import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { workOrdersQueries } from '#/modules/workshop/work-orders/work-orders.queries'
import {
  formatWorkOrderNumber,
  workOrderIdSchema,
} from '#/modules/workshop/work-orders/work-orders.schemas'
import { WorkOrderNotFound } from '#/modules/workshop/work-orders/components/WorkOrderNotFound'
import { WorkOrderView } from '#/modules/workshop/work-orders/components/WorkOrderView'

// El detalle de una orden. Si no existe —o es de otro mecánico, que para la
// API es lo mismo— la server function lanza `notFound()` y se muestra
// WorkOrderNotFound; un id que ni siquiera es un UUID, igual, sin preguntarle
// a la API.
export const Route = createFileRoute('/_app/workshop/work-orders/$workOrderId')(
  {
    loader: ({ context: { queryClient }, params }) => {
      if (!workOrderIdSchema.safeParse(params).success) throw notFound()
      return queryClient.ensureQueryData(
        workOrdersQueries.detail(params.workOrderId),
      )
    },
    head: ({ loaderData }) => ({
      meta: [
        {
          title: `${loaderData ? formatWorkOrderNumber(loaderData.number) : 'Orden de trabajo'} · AutoFix Motors`,
        },
      ],
    }),
    notFoundComponent: WorkOrderNotFound,
    component: WorkOrderPage,
  },
)

function WorkOrderPage() {
  const { workOrderId } = Route.useParams()
  const { session } = Route.useRouteContext()
  const { data } = useSuspenseQuery(workOrdersQueries.detail(workOrderId))

  return <WorkOrderView workOrder={data} role={session.role} />
}
