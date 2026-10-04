import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar'
import { useLogout } from '#/modules/core/auth/auth.queries'
import { ROLE_LABELS } from '#/modules/core/auth/auth.schemas'
import type { CurrentSession } from '#/modules/core/auth/auth.schemas'

/** Las iniciales del nombre: «Eduardo Huarcaya» → «EH». */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function UserSummary({ session }: { session: CurrentSession }) {
  return (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg">
          {initials(session.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{session.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {session.email}
        </span>
      </div>
    </>
  )
}

/** El usuario de la sesión, al pie de la barra lateral, con su menú. */
export function NavUser({ session }: { session: CurrentSession }) {
  const { isMobile } = useSidebar()
  const logout = useLogout()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserSummary session={session} />
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserSummary session={session} />
              </div>
              <p className="px-1 pb-1.5 text-xs text-muted-foreground">
                {ROLE_LABELS[session.role]}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logout.isPending}
              onSelect={() => logout.mutate()}
            >
              <LogOutIcon />
              {logout.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
