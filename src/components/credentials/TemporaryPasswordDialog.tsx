import { CheckIcon, CopyIcon, MessageCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { formatDateTime } from '#/lib/dates'
import { temporaryPasswordMessage, whatsappUrl } from '#/lib/whatsapp'

/** Lo que se le comparte a alguien con su contraseña temporal. */
export type TemporaryCredentials = {
  name: string
  phone: string | null
  loginIdentifier: string
  temporaryPassword: string
  expiresAt: string
  /** El personal entra con «Soy interno»; el cliente, directo. */
  isStaff: boolean
}

/**
 * Muestra una contraseña temporal recién generada, **una sola vez**: la API no
 * la guarda y no hay cómo volver a verla. Se comparte por WhatsApp (un enlace
 * `wa.me` con el mensaje escrito) o se copia. Al cerrar, se descarta.
 */
export function TemporaryPasswordDialog({
  credentials,
  onClose,
}: {
  /** Sin credenciales, el diálogo está cerrado. */
  credentials: TemporaryCredentials | undefined
  onClose: () => void
}) {
  return (
    <Dialog
      open={Boolean(credentials)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña temporal</DialogTitle>
          <DialogDescription>
            Compártela ahora: no se vuelve a mostrar. Al entrar,{' '}
            {credentials?.name ?? ''} tendrá que cambiarla por una propia.
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <CredentialsBody credentials={credentials} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CredentialsBody({
  credentials,
  onClose,
}: {
  credentials: TemporaryCredentials
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const message = temporaryPasswordMessage({
    ...credentials,
    loginUrl: `${window.location.origin}/login`,
  })
  const whatsapp = credentials.phone
    ? whatsappUrl(credentials.phone, message)
    : null

  const copy = () =>
    navigator.clipboard.writeText(message).then(
      () => {
        setCopied(true)
        toast.success('Mensaje copiado')
      },
      () => toast.error('No se pudo copiar: selecciona el texto a mano'),
    )

  return (
    <>
      {/* min-w-0 y break-all: un correo largo como usuario no estira la
          tarjeta fuera del diálogo. */}
      <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
        <dt className="text-muted-foreground">Usuario</dt>
        <dd className="font-medium break-all">{credentials.loginIdentifier}</dd>
        <dt className="text-muted-foreground">Contraseña</dt>
        <dd className="font-mono text-base font-semibold tracking-wider break-all select-all">
          {credentials.temporaryPassword}
        </dd>
        <dt className="text-muted-foreground">Vence</dt>
        <dd>{formatDateTime(credentials.expiresAt)}</dd>
      </dl>
      {!whatsapp && (
        <p className="text-sm text-muted-foreground">
          {credentials.phone
            ? `El teléfono ${credentials.phone} no parece un celular: copia el mensaje y envíalo por otro medio.`
            : 'No tiene teléfono registrado: copia el mensaje y envíalo por otro medio.'}
        </p>
      )}
      {/* Las dos formas de compartirla, apiladas y a lo ancho: en una fila con
          «Listo» no caben en el ancho del diálogo. */}
      <div className="flex flex-col gap-2">
        {whatsapp && (
          <Button asChild className="w-full">
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircleIcon />
              Enviar por WhatsApp
            </a>
          </Button>
        )}
        <Button
          variant={whatsapp ? 'outline' : 'default'}
          type="button"
          className="w-full"
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Mensaje copiado' : 'Copiar mensaje'}
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Listo
        </Button>
      </DialogFooter>
    </>
  )
}
