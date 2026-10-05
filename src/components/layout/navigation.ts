import {
  HouseIcon,
  PackageIcon,
  ShieldIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '#/modules/core/auth/auth.schemas'
import type { FileRoutesByTo } from '#/routeTree.gen'

// El menú de la app, en un solo lugar. Un módulo aparece en la barra lateral
// cuando se agrega aquí, y el breadcrumb sale de esta misma lista. `to` se tipa
// contra las rutas que existen: un enlace a una ruta borrada no compila.

type AppPath = keyof FileRoutesByTo

export type NavItem = {
  label: string
  to: AppPath
  /** Los roles que pueden abrir el módulo. Sin `roles`, lo ven todos. */
  roles?: UserRole[]
}

export type NavSection = {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

/** Arriba de todo, fuera de las secciones. */
export const GENERAL_ITEMS: (NavItem & { icon: LucideIcon })[] = [
  { label: 'Inicio', to: '/', icon: HouseIcon },
]

/** Las secciones del menú. Una sección aparece cuando tiene su primer módulo. */
export const SECTIONS: NavSection[] = [
  {
    label: 'Taller',
    icon: WrenchIcon,
    items: [
      // El mecánico lo consulta (en solo lectura) para armar sus órdenes.
      {
        label: 'Catálogo de servicios',
        to: '/workshop/service-catalog',
        roles: ['ADMIN', 'MECHANIC'],
      },
    ],
  },
  {
    label: 'Clientes',
    icon: UsersIcon,
    items: [
      { label: 'Clientes', to: '/customer/customers', roles: ['ADMIN'] },
      { label: 'Vehículos', to: '/customer/vehicles', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Inventario',
    icon: PackageIcon,
    items: [
      // El mecánico consulta el stock (en solo lectura y sin costos).
      {
        label: 'Repuestos e insumos',
        to: '/inventory/products',
        roles: ['ADMIN', 'MECHANIC'],
      },
      // El mecánico consulta el kardex (en solo lectura y sin costos).
      {
        label: 'Movimientos',
        to: '/inventory/stock-movements',
        roles: ['ADMIN', 'MECHANIC'],
      },
      // El mecánico consulta qué hay y quién tiene qué (en solo lectura).
      {
        label: 'Herramientas',
        to: '/inventory/tools',
        roles: ['ADMIN', 'MECHANIC'],
      },
    ],
  },
  {
    label: 'Administración',
    icon: ShieldIcon,
    items: [{ label: 'Personal', to: '/core/users', roles: ['ADMIN'] }],
  },
]

/** Las secciones con solo los ítems que el rol del usuario puede abrir. */
export function visibleSections(
  sections: NavSection[],
  role: UserRole,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(role),
      ),
    }))
    .filter((section) => section.items.length > 0)
}

/**
 * Dónde está el usuario, según el menú: las etiquetas desde la sección hasta
 * el módulo (`['Taller', 'Órdenes']`). Lo usa el breadcrumb.
 */
export function breadcrumbFor(path: string): string[] {
  const normalized = path.replace(/\/$/, '') || '/'

  const general = GENERAL_ITEMS.find((item) => item.to === normalized)
  if (general) return [general.label]

  for (const section of SECTIONS) {
    const item = section.items.find((entry) => entry.to === normalized)
    if (item) return [section.label, item.label]
  }
  return []
}
