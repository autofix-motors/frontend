import { UploadIcon } from 'lucide-react'
import { useState } from 'react'
import { ErrorCode, useDropzone } from 'react-dropzone'
import type { Accept, FileRejection } from 'react-dropzone'
import { cn } from '#/lib/utils'
import { FieldError } from '#/components/ui/field'
import { Spinner } from '#/components/ui/spinner'

/** 2097152 → «2 MB». */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * Por qué se rechazó un archivo, en español. `typesLabel` es cómo se le dice al
 * usuario lo que se acepta: «PNG, JPG o WEBP».
 */
export function rejectionMessage(
  rejection: Pick<FileRejection, 'errors'>,
  { maxSize, typesLabel }: { maxSize: number; typesLabel: string },
): string {
  switch (rejection.errors[0]?.code) {
    case ErrorCode.FileInvalidType:
      return `El archivo tiene que ser ${typesLabel}`
    case ErrorCode.FileTooLarge:
      return `El archivo pesa más de ${formatBytes(maxSize)}`
    case ErrorCode.TooManyFiles:
      return 'Suelta un solo archivo'
    default:
      return 'No se pudo usar ese archivo'
  }
}

type DropzoneProps = {
  /** Los tipos aceptados, como los pide react-dropzone: `{ 'image/png': ['.png'] }`. */
  accept: Accept
  /** Cómo se nombran esos tipos para el usuario: «PNG, JPG o WEBP». */
  typesLabel: string
  maxSize: number
  /** Recibe el archivo que pasó las comprobaciones del navegador. */
  onFile: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
  /** Un error que viene de afuera, por ejemplo el que devolvió la API. */
  error?: string
  className?: string
}

/**
 * Zona para arrastrar o elegir **un** archivo. Revisa en el navegador el tipo y
 * el tamaño, para avisar antes de subir. No reemplaza la validación de la API,
 * que revisa el contenido real del archivo.
 */
export function Dropzone({
  accept,
  typesLabel,
  maxSize,
  onFile,
  isUploading = false,
  disabled = false,
  error,
  className,
}: DropzoneProps) {
  const [rejection, setRejection] = useState<string>()

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept,
      maxSize,
      maxFiles: 1,
      multiple: false,
      disabled: disabled || isUploading,
      onDropAccepted: ([file]) => {
        setRejection(undefined)
        if (file) onFile(file)
      },
      onDropRejected: ([first]) => {
        if (first)
          setRejection(rejectionMessage(first, { maxSize, typesLabel }))
      },
    })

  const message = rejection ?? error

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm transition-colors',
          'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          isDragActive && 'border-primary bg-muted/50',
          (isDragReject || message) && 'border-destructive',
          (disabled || isUploading) && 'cursor-not-allowed opacity-60',
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? <Spinner /> : <UploadIcon className="size-5" />}
        <p className="font-medium">
          {isUploading
            ? 'Subiendo…'
            : isDragActive
              ? 'Suelta el archivo aquí'
              : 'Arrastra un archivo o haz clic para elegirlo'}
        </p>
        <p className="text-xs text-muted-foreground">
          {typesLabel}, hasta {formatBytes(maxSize)}
        </p>
      </div>
      {message && <FieldError>{message}</FieldError>}
    </div>
  )
}
