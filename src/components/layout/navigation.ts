import {
  HouseIcon,
  PackageIcon,
  ShieldIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Tone } from '#/lib/tones'
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
  /**
   * El color de la sección (`lib/tones.ts`). Hoy todas usan el azul pastel
   * (`sky`): decisión de quien dirige el proyecto, un solo color en el menú.
   */
  tone: Tone
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
    tone: 'sky',
    items: [
      // El mecánico ve las suyas («Mis órdenes»): la API se lo impone.
      {
        label: 'Órdenes de trabajo',
        to: '/workshop/work-orders',
        roles: ['ADMINISTRADOR', 'MECANICO'],
      },
      // El mecánico lo consulta (en solo lectura) para armar sus órdenes.
      {
        label: 'Catálogo de servicios',
        to: '/workshop/service-catalog',
        roles: ['ADMINISTRADOR', 'MECANICO'],
      },
    ],
  },
  {
    label: 'Clientes',
    icon: UsersIcon,
    tone: 'sky',
    items: [
      {
        label: 'Clientes',
        to: '/customer/customers',
        roles: ['ADMINISTRADOR'],
      },
      {
        label: 'Vehículos',
        to: '/customer/vehicles',
        roles: ['ADMINISTRADOR'],
      },
    ],
  },
  {
    label: 'Inventario',
    icon: PackageIcon,
    tone: 'sky',
    items: [
      // El mecánico consulta el stock (en solo lectura y sin costos).
      {
        label: 'Repuestos e insumos',
        to: '/inventory/products',
        roles: ['ADMINISTRADOR', 'MECANICO'],
      },
      // El mecánico consulta el kardex (en solo lectura y sin costos).
      {
        label: 'Movimientos',
        to: '/inventory/stock-movements',
        roles: ['ADMINISTRADOR', 'MECANICO'],
      },
    ],
  },
  {
    label: 'Administración',
    icon: ShieldIcon,
    tone: 'sky',
    items: [{ label: 'Personal', to: '/core/users', roles: ['ADMINISTRADOR'] }],
  },
]

/**
 * Páginas que no son ítems del menú pero sí tienen su lugar en el breadcrumb:
 * las de la cuenta, a las que se entra desde el menú del usuario.
 */
export const OFF_MENU_PAGES: { to: AppPath; trail: string[] }[] = [
  { to: '/account/profile', trail: ['Cuenta', 'Mi perfil'] },
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
 * el módulo (`['Taller', 'Órdenes de trabajo']`). Lo usa el breadcrumb. Una
 * ruta con un parámetro justo debajo de un módulo
 * (`/workshop/work-orders/$workOrderId`, como la da `fullPath`) es su
 * detalle: suma «Detalle» al módulo. Las páginas fuera del menú declaran
 * su camino en `OFF_MENU_PAGES`.
 */
export function breadcrumbFor(path: string): string[] {
  const normalized = path.replace(/\/$/, '') || '/'

  const general = GENERAL_ITEMS.find((item) => item.to === normalized)
  if (general) return [general.label]

  const offMenu = OFF_MENU_PAGES.find((page) => page.to === normalized)
  if (offMenu) return offMenu.trail

  const parentPath = /^(.+)\/\$[^/]+$/.exec(normalized)?.[1]
  for (const section of SECTIONS) {
    const item = section.items.find((entry) => entry.to === normalized)
    if (item) return [section.label, item.label]
    const parent = section.items.find((entry) => entry.to === parentPath)
    if (parent) return [section.label, parent.label, 'Detalle']
  }
  return []
}
