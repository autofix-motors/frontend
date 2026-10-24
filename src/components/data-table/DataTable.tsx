import { FlexRender, useTable } from '@tanstack/react-table'
import type { ColumnDef, RowData, SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import type { PaginationMeta } from '#/server/api'
import { DataTablePagination } from './DataTablePagination'
import { dataTableFeatures } from './features'

/** El orden que pidió el usuario: la columna y la dirección. */
export type TableSort = { sortBy: string; sortOrder: 'asc' | 'desc' }

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<typeof dataTableFeatures, TData>[]
  data: TData[]
  /** La paginación que devolvió la API. */
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /**
   * El orden actual y cómo cambiarlo. Sin él, ninguna columna se ordena. Una
   * columna que la API no sabe ordenar declara `enableSorting: false`.
   */
  sort?: TableSort
  onSortChange?: (sort: TableSort) => void
  /** Búsqueda y filtros, arriba de la tabla (`DataTableToolbar`). */
  toolbar?: ReactNode
  /** Mientras llega la página nueva, la actual se atenúa en vez de vaciarse. */
  isFetching?: boolean
  emptyMessage?: string
}

/**
 * La tabla de todos los listados. La API pagina, busca, filtra y ordena (regla
 * del proyecto): la tabla muestra la página que llegó y avisa qué cambió. El
 * estado vive en la URL de la página, no aquí, para que un listado filtrado se
 * pueda recargar o compartir.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  meta,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  toolbar,
  isFetching = false,
  emptyMessage = 'Sin registros',
}: DataTableProps<TData>) {
  const sorting: SortingState = sort
    ? [{ id: sort.sortBy, desc: sort.sortOrder === 'desc' }]
    : []

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    manualSorting: true,
    enableSorting: Boolean(onSortChange),
    // Ordenar siempre por algo: un tercer clic invierte, no quita el orden.
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const [first] = next
      if (first && onSortChange) {
        onSortChange({
          sortBy: first.id,
          sortOrder: first.desc ? 'desc' : 'asc',
        })
      }
    },
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <div
        className={cn(
          'rounded-lg border transition-opacity',
          isFetching && 'opacity-60',
        )}
        aria-busy={isFetching}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <FlexRender header={header} />
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        meta={meta}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="size-3" />
  if (direction === 'desc') return <ArrowDown className="size-3" />
  return <ArrowUpDown className="size-3 opacity-40" />
}
