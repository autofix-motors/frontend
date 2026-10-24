import { Link } from '@tanstack/react-router'
import { PORTAL_NAV } from './portal-navigation'

/**
 * Las secciones del portal en el celular: una barra fija abajo, al alcance del
 * pulgar, como en una app. En pantallas anchas van en la cabecera.
 */
export function PortalBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3">
        {PORTAL_NAV.map((item) => (
          <Link
            key={item.label}
            {...item.link}
            activeOptions={{ exact: item.exact, includeSearch: false }}
            className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors"
            activeProps={{ className: 'font-medium text-primary' }}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
