import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { defaultPortalWorkOrdersSearch } from '../portal.schemas'

/** Una orden que no existe o no es del cliente: para la API es lo mismo. */
export function PortalWorkOrderNotFound() {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="text-lg font-semibold">No se encontró la reparación</h1>
      <p className="text-sm text-muted-foreground">
        Revisa el enlace o búscala en tu lista de reparaciones.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link to="/portal/work-orders" search={defaultPortalWorkOrdersSearch}>
          <ArrowLeftIcon />
          Mis reparaciones
        </Link>
      </Button>
    </div>
  )
}
