import { Link } from '@tanstack/react-router'
import { KeyRoundIcon, LogOutIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { initials } from '#/lib/initials'
import { useLogout } from '#/modules/core/auth/auth.queries'
import type { CustomerSession } from '#/modules/core/auth/auth.schemas'
import { PORTAL_NAV } from './portal-navigation'

/**
 * La cabecera del portal: la marca, las secciones (solo en pantallas anchas;
 * en el celular van en `PortalBottomNav`) y el menú de la cuenta.
 */
export function PortalHeader({ session }: { session: CustomerSession }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-6 px-4">
        <Link to="/portal" className="font-heading text-lg font-semibold">
          AutoFix Motors
        </Link>
        <nav className="hidden h-full flex-1 items-stretch justify-center gap-6 sm:flex">
          {PORTAL_NAV.map((item) => (
            <Link
              key={item.label}
              {...item.link}
              activeOptions={{ exact: item.exact, includeSearch: false }}
              className="inline-flex items-center border-b-2 border-transparent text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className: 'border-primary font-medium text-foreground',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto sm:ml-0">
          <AccountMenu session={session} />
        </div>
      </div>
    </header>
  )
}

/** El avatar con las iniciales: abre el nombre, la contraseña y salir. */
function AccountMenu({ session }: { session: CustomerSession }) {
  const logout = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Mi cuenta"
        >
          <Avatar>
            <AvatarFallback>{initials(session.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col font-normal">
          <span className="truncate font-medium">{session.name}</span>
          {session.email && (
            <span className="truncate text-xs text-muted-foreground">
              {session.email}
            </span>
          )}
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
  )
}
