import { useSuspenseQuery } from '@tanstack/react-query'
import {
  ClockIcon,
  IdCardIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formatDateTime, formatMonthYear } from '#/lib/dates'
import { initials } from '#/lib/initials'
import { TONES } from '#/lib/tones'
import { cn } from '#/lib/utils'
import { authQueries } from '../auth.queries'
import { ROLE_LABELS, documentLabel } from '../auth.schemas'
import type { CurrentSession, Profile } from '../auth.schemas'
import { ChangePasswordForm } from './ChangePasswordForm'

/** Lo que se muestra cuando falta un dato. */
const MISSING = 'No registrado'

/**
 * «Mi perfil», el mismo para el personal (`/account/profile`, con la barra
 * lateral) y el cliente (`/portal/profile`, con la cabecera del portal): sus
 * datos, de solo lectura, y el cambio de contraseña. Hay poco que mostrar, así
 * que va centrado, y en pantallas grandes también al medio del alto
 * disponible (`lg:my-auto` dentro del contenedor flex del layout).
 */
export function ProfileView({ session }: { session: CurrentSession }) {
  const { data: profile } = useSuspenseQuery(authQueries.profile(session))
  // El tono del menú: personal y administración en violeta, clientes en verde.
  // El mismo azul pastel del menú, para el personal y para el cliente.
  const tone = TONES.sky

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:my-auto lg:py-4">
      <ProfileHeader profile={profile} toneChip={tone.chip} />
      <PersonalData profile={profile} toneChip={tone.chip} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            <h2>Cambiar contraseña</h2>
          </CardTitle>
          <CardDescription>
            Al guardarla se cerrarán tus sesiones en otros dispositivos; en este
            sigues conectado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <ChangePasswordForm mode="profile" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileHeader({
  profile,
  toneChip,
}: {
  profile: Profile
  toneChip: string
}) {
  return (
    <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <Avatar className="size-20 after:hidden">
        <AvatarFallback
          className={cn('font-heading text-2xl font-semibold', toneChip)}
        >
          {initials(profile.nombre)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-muted-foreground">Mi perfil</p>
          <h1 className="font-heading text-2xl font-semibold break-words sm:text-3xl">
            {profile.nombre}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:justify-start">
          <Badge className={toneChip}>{ROLE_LABELS[profile.rol]}</Badge>
          <span>Miembro desde {formatMonthYear(profile.miembroDesde)}</span>
        </div>
      </div>
    </header>
  )
}

function PersonalData({
  profile,
  toneChip,
}: {
  profile: Profile
  toneChip: string
}) {
  const isCustomer = profile.tipo === 'CLIENTE'
  const items: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: IdCardIcon, label: 'Documento', value: documentLabel(profile) },
    { icon: MailIcon, label: 'Correo', value: profile.correo },
    { icon: PhoneIcon, label: 'Teléfono', value: profile.telefono },
    ...(isCustomer
      ? [{ icon: MapPinIcon, label: 'Dirección', value: profile.direccion }]
      : []),
    {
      icon: ClockIcon,
      label: 'Último ingreso',
      value: profile.ultimoIngresoEn
        ? formatDateTime(profile.ultimoIngresoEn)
        : null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRoundIcon className="size-4 text-muted-foreground" />
          <h2>Datos personales</h2>
        </CardTitle>
        <CardDescription>
          {isCustomer
            ? 'Si algún dato no es correcto, comunícate con el taller para actualizarlo.'
            : 'Si algún dato no es correcto, pide a un administrador que lo actualice en Personal.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  toneChip,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd
                  className={cn(
                    'text-sm break-words',
                    value ? 'font-medium' : 'text-muted-foreground italic',
                  )}
                >
                  {value ?? MISSING}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
