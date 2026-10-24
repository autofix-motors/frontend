import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import type { PaginationMeta } from '#/server/api'

/** «Anterior · Página X de Y · Siguiente». Con una sola página no se dibuja. */
export function PortalPager({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  if (meta.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
      >
        <ChevronLeftIcon />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {meta.page} de {meta.totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Siguiente
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
