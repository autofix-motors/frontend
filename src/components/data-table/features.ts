import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'

/**
 * Lo que saben hacer todas las tablas de la app. En TanStack Table 9 cada
 * funcionalidad se declara aquí, fuera de los componentes, y la tabla solo
 * incluye el código de lo que se declara.
 *
 * Solo el orden: los listados se paginan, buscan y filtran en la API (regla
 * del proyecto), así que la tabla no ordena ni filtra filas por su cuenta; solo
 * avisa qué columna se pidió ordenar.
 */
export const dataTableFeatures = tableFeatures({ rowSortingFeature })

/** Crea las columnas de una tabla tipadas con las características de la app. */
export function createColumns<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>()
}
