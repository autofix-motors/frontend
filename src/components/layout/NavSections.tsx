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
import { TONES } from '#/lib/tones'
import { cn } from '#/lib/utils'
import type { NavSection } from './navigation'

/**
 * Secciones colapsables del menú, cada una con sus módulos y su tono
 * (`lib/tones.ts`): el ícono va en un cuadrito del tono y el módulo actual se
 * marca con el mismo color.
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
          // Todas abiertas al entrar: son pocas y así se ve el menú completo
          // sin abrir nada. El usuario puede cerrar la que no use.
          defaultOpen
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={section.label}
                // Colapsada a íconos, el botón mide 32 px: con menos relleno
                // el cuadrito de 24 px queda centrado y entero.
                className="group-data-[collapsible=icon]:p-1!"
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md',
                    TONES[section.tone].chip,
                  )}
                >
                  <section.icon />
                </span>
                <span>{section.label}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.to}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(item.to)}
                      className={cn(
                        'data-active:font-medium',
                        TONES[section.tone].active,
                      )}
                    >
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
