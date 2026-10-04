import { useState } from 'react'
import { FlexRender, useTable } from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { dataTableFeatures } from './features'

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<typeof dataTableFeatures, TData>[]
  data: TData[]
  /** Texto de ayuda de la búsqueda. Sin él, la tabla no muestra buscador. */
  searchPlaceholder?: string
}

/**
 * La tabla de todos los listados de la app: orden por columna, búsqueda en todas
 * las columnas y paginación. Las columnas se definen en el módulo con
 * `createColumns<T>()`; esta tabla no sabe nada del dominio.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  searchPlaceholder,
}: DataTableProps<TData>) {
  const [filter, setFilter] = useState('')

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    globalFilterFn: 'includesString',
    state: { globalFilter: filter },
    onGlobalFilterChange: (value) =>
      setFilter(typeof value === 'function' ? value(filter) : value),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      {searchPlaceholder && (
        <Input
          placeholder={searchPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      onClick={header.column.getToggleSortingHandler()}
                      disabled={!header.column.getCanSort()}
                    >
                      <FlexRender header={header} />
                      {header.column.getIsSorted() === 'asc' && (
                        <ArrowUp className="size-3" />
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <ArrowDown className="size-3" />
                      )}
                    </button>
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
                className="text-center text-muted-foreground"
              >
                Sin registros
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>
          Página {table.state.pagination.pageIndex + 1} de{' '}
          {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
