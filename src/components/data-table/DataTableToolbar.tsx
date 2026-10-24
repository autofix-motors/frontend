import { SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'

// Cuánto se espera después de la última tecla para buscar: lo justo para no
// pedirle a la API una consulta por letra.
const SEARCH_DEBOUNCE_MS = 350

type DataTableToolbarProps = {
  search: string
  onSearchChange: (search: string) => void
  searchPlaceholder: string
  /** Los filtros del listado (`DataTableFilter`). */
  children?: ReactNode
  /** Si hay búsqueda o filtros aplicados: muestra el botón de limpiarlos. */
  isFiltered: boolean
  onReset: () => void
  /** Acciones a la derecha, como «Nuevo cliente». */
  actions?: ReactNode
}

/** La búsqueda, los filtros y las acciones de un listado. */
export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  isFiltered,
  onReset,
  actions,
}: DataTableToolbarProps) {
  const [text, setText] = useState(search)

  // Si la búsqueda cambia desde afuera (limpiar filtros, volver atrás en el
  // navegador), el cuadro la refleja.
  useEffect(() => setText(search), [search])

  useEffect(() => {
    if (text.trim() === search) return
    const timer = setTimeout(
      () => onSearchChange(text.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [text, search, onSearchChange])

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder={searchPlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </InputGroup>
        {children}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Limpiar
            <XIcon />
          </Button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
