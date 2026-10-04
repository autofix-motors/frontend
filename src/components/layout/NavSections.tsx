import { Link, useMatchRoute } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '#/components/ui/sidebar'
import type { NavSection } from './navigation'

/**
 * Secciones colapsables del menú, cada una con sus módulos.
 */
export function NavSections({ sections }: { sections: NavSection[] }) {
  const matchRoute = useMatchRoute()
  const isActive = (to: NavSection['items'][number]['to']) =>
    Boolean(matchRoute({ to, fuzzy: true }))

  return (
    <SidebarMenu>
      {sections.map((section) => (
        <Collapsible
          key={section.label}
          asChild
          // Abierta si contiene la página actual: al entrar por un enlace, el
          // usuario ve dónde está sin abrir nada.
          defaultOpen={section.items.some((item) => isActive(item.to))}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={section.label}>
                <section.icon />
                <span>{section.label}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.to}>
                    <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                      <Link to={item.to}>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  )
}
