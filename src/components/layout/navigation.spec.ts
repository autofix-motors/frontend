import { HouseIcon } from 'lucide-react'
import { SECTIONS, breadcrumbFor, visibleSections } from './navigation'
import type { NavSection } from './navigation'

describe('visibleSections', () => {
  const sections: NavSection[] = [
    {
      label: 'Taller',
      icon: HouseIcon,
      tone: 'sky',
      items: [
        { label: 'Inicio', to: '/' },
        { label: 'Solo admin', to: '/', roles: ['ADMINISTRADOR'] },
      ],
    },
    {
      label: 'Administración',
      icon: HouseIcon,
      tone: 'violet',
      items: [{ label: 'Solo admin', to: '/', roles: ['ADMINISTRADOR'] }],
    },
  ]

  it('muestra todo al rol que puede abrirlo', () => {
    const visible = visibleSections(sections, 'ADMINISTRADOR')
    expect(visible.map((section) => section.label)).toEqual([
      'Taller',
      'Administración',
    ])
    expect(visible[0]?.items).toHaveLength(2)
  })

  it('oculta los ítems de otro rol, y la sección que queda vacía', () => {
    const visible = visibleSections(sections, 'MECANICO')
    expect(visible.map((section) => section.label)).toEqual(['Taller'])
    expect(visible[0]?.items.map((item) => item.label)).toEqual(['Inicio'])
  })
})

describe('breadcrumbFor', () => {
  it('usa solo la etiqueta en las páginas generales', () => {
    expect(breadcrumbFor('/')).toEqual(['Inicio'])
  })

  it('una página de la cuenta, fuera del menú, tiene su propio camino', () => {
    expect(breadcrumbFor('/account/profile')).toEqual(['Cuenta', 'Mi perfil'])
  })

  it('queda vacío en una ruta que no está en el menú', () => {
    expect(breadcrumbFor('/login')).toEqual([])
  })

  it('el detalle de un módulo cuelga del módulo', () => {
    expect(breadcrumbFor('/workshop/work-orders/$workOrderId')).toEqual([
      'Taller',
      'Órdenes de trabajo',
      'Detalle',
    ])
    // Solo un parámetro directo: una ruta más honda no es el detalle.
    expect(breadcrumbFor('/workshop/work-orders/$workOrderId/x')).toEqual([])
    expect(breadcrumbFor('/workshop/work-orders/nuevo')).toEqual([])
  })
})

it('cada módulo del menú tiene una ruta distinta', () => {
  const paths = SECTIONS.flatMap((section) =>
    section.items.map((item) => item.to),
  )
  expect(new Set(paths).size).toBe(paths.length)
})

it('el mecánico ve sus órdenes, el catálogo de servicios, los repuestos y sus movimientos', () => {
  const visible = visibleSections(SECTIONS, 'MECANICO')
  expect(
    visible.map((section) => [
      section.label,
      section.items.map((item) => item.label),
    ]),
  ).toEqual([
    ['Taller', ['Órdenes de trabajo', 'Catálogo de servicios']],
    ['Inventario', ['Repuestos e insumos', 'Movimientos']],
  ])
  expect(breadcrumbFor('/workshop/work-orders/')).toEqual([
    'Taller',
    'Órdenes de trabajo',
  ])
  expect(breadcrumbFor('/workshop/service-catalog/')).toEqual([
    'Taller',
    'Catálogo de servicios',
  ])
  expect(breadcrumbFor('/inventory/products')).toEqual([
    'Inventario',
    'Repuestos e insumos',
  ])
  expect(breadcrumbFor('/inventory/stock-movements')).toEqual([
    'Inventario',
    'Movimientos',
  ])
})
