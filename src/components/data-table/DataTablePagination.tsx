import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { PaginationMeta } from '#/server/api'

/** Los tamaños de página que se ofrecen. La API acepta hasta 100. */
export const PAGE_SIZES = [10, 20, 50] as const

/** «Mostrando 11–20 de 42»: qué filas se ven del total. */
export function rangeLabel({ page, pageSize, total }: PaginationMeta): string {
  if (total === 0) return 'Sin resultados'
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return `Mostrando ${from}–${to} de ${total}`
}

/** La paginación de un listado, a partir de la `meta` que devolvió la API. */
export function DataTablePagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const lastPage = Math.max(meta.totalPages, 1)
  const isFirst = meta.page <= 1
  const isLast = meta.page >= lastPage

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
      <span>{rangeLabel(meta)}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Filas por página</span>
          <Select
            value={String(meta.pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="w-18"
              aria-label="Filas por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span>
          Página {Math.min(meta.page, lastPage)} de {lastPage}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={isFirst}
            aria-label="Primera página"
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={isFirst}
            aria-label="Página anterior"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={isLast}
            aria-label="Página siguiente"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(lastPage)}
            disabled={isLast}
            aria-label="Última página"
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
