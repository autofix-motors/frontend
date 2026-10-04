import { Link, useMatchRoute } from '@tanstack/react-router'
import { WrenchIcon } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '#/components/ui/sidebar'
import type { CurrentSession } from '#/modules/core/auth/auth.schemas'
import { NavSections } from './NavSections'
import { NavUser } from './NavUser'
import { GENERAL_ITEMS, SECTIONS, visibleSections } from './navigation'

/**
 * La barra lateral de la app. Se llama AppSidebar y no Sidebar para no chocar
 * con la primitiva de shadcn (`components/ui/sidebar.tsx`).
 */
export function AppSidebar({ session }: { session: CurrentSession }) {
  const matchRoute = useMatchRoute()
  const sections = visibleSections(SECTIONS, session.role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <WrenchIcon className="size-4" />
                </div>
                <span className="truncate font-semibold">AutoFix Motors</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {GENERAL_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={Boolean(matchRoute({ to: item.to }))}
                >
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {sections.length > 0 && (
          <SidebarGroup>
            <NavSections sections={sections} />
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
