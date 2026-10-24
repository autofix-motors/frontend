import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { PortalWorkOrderNotFound } from '#/modules/workshop/portal/components/PortalWorkOrderNotFound'
import { PortalWorkOrderView } from '#/modules/workshop/portal/components/PortalWorkOrderView'
import { portalQueries } from '#/modules/workshop/portal/portal.queries'
import { portalWorkOrderIdSchema } from '#/modules/workshop/portal/portal.schemas'

// El detalle de una orden del cliente. Si no existe o no es suya, la server
// function lanza `notFound()`; un id que ni es UUID, igual, sin llamar a la API.
export const Route = createFileRoute('/portal/work-orders/$workOrderId')({
  loader: ({ context: { queryClient }, params }) => {
    if (!portalWorkOrderIdSchema.safeParse(params).success) throw notFound()
    return queryClient.ensureQueryData(
      portalQueries.workOrder(params.workOrderId),
    )
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData ? loaderData.trackingCode : 'Orden'} · AutoFix Motors`,
      },
    ],
  }),
  notFoundComponent: PortalWorkOrderNotFound,
  component: PortalWorkOrderPage,
})

function PortalWorkOrderPage() {
  const { workOrderId } = Route.useParams()
  const { data } = useSuspenseQuery(portalQueries.workOrder(workOrderId))
  return <PortalWorkOrderView order={data} />
}
