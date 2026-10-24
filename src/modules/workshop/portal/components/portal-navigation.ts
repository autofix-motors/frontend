import { linkOptions } from '@tanstack/react-router'
import { CarIcon, HouseIcon, WrenchIcon } from 'lucide-react'
import {
  defaultPortalVehiclesSearch,
  defaultPortalWorkOrdersSearch,
} from '../portal.schemas'

// Las secciones del portal, en un solo lugar: las usan la barra de arriba (PC)
// y la de abajo (celular), para que no se desalineen.

// Sin anotar el tipo: `linkOptions` tipa cada enlace contra su ruta, y una
// anotación común lo borraría. `exact`: Inicio solo está activo en /portal;
// las demás, también en su detalle.
export const PORTAL_NAV = [
  {
    label: 'Inicio',
    icon: HouseIcon,
    link: linkOptions({ to: '/portal' }),
    exact: true,
  },
  {
    label: 'Reparaciones',
    icon: WrenchIcon,
    link: linkOptions({
      to: '/portal/work-orders',
      search: defaultPortalWorkOrdersSearch,
    }),
    exact: false,
  },
  {
    label: 'Vehículos',
    icon: CarIcon,
    link: linkOptions({
      to: '/portal/vehicles',
      search: defaultPortalVehiclesSearch,
    }),
    exact: false,
  },
] as const
