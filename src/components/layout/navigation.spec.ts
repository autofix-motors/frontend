import { HouseIcon } from 'lucide-react'
import { SECTIONS, breadcrumbFor, visibleSections } from './navigation'
import type { NavSection } from './navigation'

describe('visibleSections', () => {
  const sections: NavSection[] = [
    {
      label: 'Taller',
      icon: HouseIcon,
      items: [
        { label: 'Inicio', to: '/' },
        { label: 'Solo admin', to: '/', roles: ['ADMIN'] },
      ],
    },
    {
      label: 'Administración',
      icon: HouseIcon,
      items: [{ label: 'Solo admin', to: '/', roles: ['ADMIN'] }],
    },
  ]

  it('muestra todo al rol que puede abrirlo', () => {
    const visible = visibleSections(sections, 'ADMIN')
    expect(visible.map((section) => section.label)).toEqual([
      'Taller',
      'Administración',
    ])
    expect(visible[0]?.items).toHaveLength(2)
  })

  it('oculta los ítems de otro rol, y la sección que queda vacía', () => {
    const visible = visibleSections(sections, 'MECHANIC')
    expect(visible.map((section) => section.label)).toEqual(['Taller'])
    expect(visible[0]?.items.map((item) => item.label)).toEqual(['Inicio'])
  })
})

describe('breadcrumbFor', () => {
  it('usa solo la etiqueta en las páginas generales', () => {
    expect(breadcrumbFor('/')).toEqual(['Inicio'])
  })

  it('queda vacío en una ruta que no está en el menú', () => {
    expect(breadcrumbFor('/login')).toEqual([])
  })
})

it('cada módulo del menú tiene una ruta distinta', () => {
  const paths = SECTIONS.flatMap((section) =>
    section.items.map((item) => item.to),
  )
  expect(new Set(paths).size).toBe(paths.length)
})

it('el mecánico solo ve el catálogo de servicios, los repuestos, sus movimientos y las herramientas', () => {
  const visible = visibleSections(SECTIONS, 'MECHANIC')
  expect(
    visible.map((section) => [
      section.label,
      section.items.map((item) => item.label),
    ]),
  ).toEqual([
    ['Taller', ['Catálogo de servicios']],
    ['Inventario', ['Repuestos e insumos', 'Movimientos', 'Herramientas']],
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
  expect(breadcrumbFor('/inventory/tools')).toEqual([
    'Inventario',
    'Herramientas',
  ])
})
