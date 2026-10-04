import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'

/**
 * Lo que saben hacer todas las tablas de la app: ordenar, buscar y paginar. En
 * TanStack Table 9 cada funcionalidad se declara aquí, fuera de los
 * componentes, y la tabla solo incluye el código de lo que se declara.
 *
 * Las funciones de orden y filtro se registran por nombre porque la 9 solo
 * resuelve `'auto'` entre las registradas.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  // La búsqueda global se apoya en el filtrado por columna: la 9 exige los dos.
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  filterFns: { includesString: filterFn_includesString },
})

/** Crea las columnas de una tabla tipadas con las características de la app. */
export function createColumns<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>()
}
