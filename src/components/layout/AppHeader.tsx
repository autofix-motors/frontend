import { useMatches } from '@tanstack/react-router'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { breadcrumbFor } from './navigation'

/**
 * La barra de arriba de cada página: el botón que abre o colapsa la barra
 * lateral y dónde está el usuario. El breadcrumb sale del menú
 * (navigation.ts), así que no hay que declararlo en cada ruta.
 */
export function AppHeader() {
  const matches = useMatches()
  const trail = breadcrumbFor(matches.at(-1)?.fullPath ?? '/')

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {trail.map((label, index) => {
            const isLast = index === trail.length - 1
            return (
              // La posición y no el texto: una sección y su módulo pueden
              // llamarse igual («Clientes › Clientes»).
              <Fragment key={`${index}-${label}`}>
                {/* En móvil solo cabe la página actual. */}
                <BreadcrumbItem className={isLast ? '' : 'hidden md:block'}>
                  {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : label}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
