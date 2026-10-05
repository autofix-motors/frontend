import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { defaultWorkOrdersSearch } from '../work-orders.schemas'

/**
 * Una orden que no existe, o que es de otro mecánico: para la API es lo
 * mismo, y aquí también, para no revelar que la orden está.
 */
export function WorkOrderNotFound() {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="text-lg font-semibold">
        No se encontró la orden de trabajo
      </h1>
      <p className="text-sm text-muted-foreground">
        Puede que se haya eliminado, o que no la tengas asignada.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link to="/workshop/work-orders" search={defaultWorkOrdersSearch}>
          <ArrowLeftIcon />
          Órdenes de trabajo
        </Link>
      </Button>
    </div>
  )
}
