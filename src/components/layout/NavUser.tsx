import { Link } from '@tanstack/react-router'
import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon } from 'lucide-react'
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
import { initials } from '#/lib/initials'
import { useLogout } from '#/modules/core/auth/auth.queries'
import { ROLE_LABELS } from '#/modules/core/auth/auth.schemas'
import type { StaffSession } from '#/modules/core/auth/auth.schemas'

function UserSummary({ session }: { session: StaffSession }) {
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
export function NavUser({ session }: { session: StaffSession }) {
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
            <DropdownMenuItem asChild>
              <Link to="/change-password">
                <KeyRoundIcon />
                Cambiar contraseña
              </Link>
            </DropdownMenuItem>
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
