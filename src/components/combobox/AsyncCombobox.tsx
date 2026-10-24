import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/utils'

/** Una opción de la lista: el valor que se guarda y lo que se le muestra. */
export type ComboboxOption = {
  value: string
  label: string
  /** Una segunda línea, como el documento de un cliente. */
  description?: string
}

// Lo justo para no pedirle a la API una consulta por letra.
const SEARCH_DEBOUNCE_MS = 300

/**
 * La consulta de opciones para un texto: un `queryOptions` del módulo dueño de
 * los datos, con su propia clave. Busca la API, no este componente.
 */
export type ComboboxOptionsQuery<TQueryKey extends QueryKey> = (
  search: string,
) => UseQueryOptions<ComboboxOption[], Error, ComboboxOption[], TQueryKey>

type AsyncComboboxProps<TQueryKey extends QueryKey> = {
  /** El valor elegido (un id), o undefined si no hay ninguno. */
  value: string | undefined
  /**
   * La opción del valor actual cuando no sale de una búsqueda: al editar, el
   * registro guardado puede no estar en la primera página de resultados.
   */
  selectedOption?: ComboboxOption
  onChange: (option: ComboboxOption | null) => void
  optionsQuery: ComboboxOptionsQuery<TQueryKey>
  placeholder: string
  searchPlaceholder: string
  emptyMessage?: string
  /** Si se da, ofrece quitar la selección con este texto (en los filtros). */
  clearLabel?: string
  /** Se llama al cerrar la lista: el formulario marca el campo como tocado. */
  onClose?: () => void
  id?: string
  size?: 'default' | 'sm'
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}

/**
 * Una lista que busca en la API mientras se escribe: para elegir entre muchos
 * registros (clientes, vehículos) sin traerlos todos. Es un Popover de Radix
 * con el Combobox de Base UI en modo `inline` adentro, y no el popup propio del
 * Combobox: un Dialog de Radix toma como «afuera» (y se cierra) todo clic fuera
 * de su contenido que no venga de una capa de Radix, y ese popup se monta en
 * `body` por su cuenta.
 *
 * La base de `ComboboxField` (formularios) y `DataTableComboboxFilter`.
 */
export function AsyncCombobox<TQueryKey extends QueryKey>({
  value,
  selectedOption,
  onChange,
  optionsQuery,
  placeholder,
  searchPlaceholder,
  emptyMessage = 'Sin resultados',
  clearLabel,
  onClose,
  id,
  size = 'default',
  disabled,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: AsyncComboboxProps<TQueryKey>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  // La última opción elegida: su etiqueta se sigue mostrando aunque no esté en
  // la página de resultados que se ve.
  const [picked, setPicked] = useState<ComboboxOption>()

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const results = useQuery({
    ...optionsQuery(query),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  const selected =
    (picked?.value === value && picked) ||
    (selectedOption?.value === value ? selectedOption : undefined)

  // Sin búsqueda, la opción elegida encabeza la lista aunque la API no la
  // devuelva en su primera página: así se ve marcada al abrir.
  const options = results.data ?? []
  const items =
    selected && !query && !options.some((o) => o.value === selected.value)
      ? [selected, ...options]
      : options

  const close = () => {
    setOpen(false)
    setSearch('')
    setQuery('')
    onClose?.()
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size={size}
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn('justify-between font-normal', className)}
        >
          <span
            className={cn('truncate', !selected && 'text-muted-foreground')}
          >
            {selected?.label ?? (value ? 'Cargando…' : placeholder)}
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 gap-0 p-0"
      >
        <Combobox
          inline
          open
          items={items}
          // La API ya filtró: el Combobox no vuelve a filtrar en el navegador.
          filter={null}
          autoHighlight
          value={selected ?? null}
          onValueChange={(option: ComboboxOption | null) => {
            if (!option) return
            setPicked(option)
            onChange(option)
            close()
          }}
          inputValue={search}
          onInputValueChange={(next, details) => {
            // Al elegir, el Combobox escribe la etiqueta en el cuadro; aquí el
            // cuadro es solo para buscar.
            if (
              details.reason === 'input-change' ||
              details.reason === 'input-clear'
            ) {
              setSearch(next)
            }
          }}
          itemToStringLabel={(option: ComboboxOption) => option.label}
          isItemEqualToValue={(a: ComboboxOption, b: ComboboxOption) =>
            a.value === b.value
          }
        >
          <ComboboxInput
            placeholder={searchPlaceholder}
            showTrigger={false}
            className="m-1.5 mb-0 h-8"
          />
          {results.isPending ? (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Spinner />
              Buscando…
            </p>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {results.isError ? results.error.message : emptyMessage}
            </p>
          ) : (
            <ComboboxList
              className={cn(results.isFetching && 'opacity-60')}
              aria-busy={results.isFetching}
            >
              {(option: ComboboxOption) => (
                <ComboboxItem key={option.value} value={option}>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          )}
          {clearLabel && value && (
            <div className="border-t p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onChange(null)
                  close()
                }}
              >
                <XIcon />
                {clearLabel}
              </Button>
            </div>
          )}
        </Combobox>
      </PopoverContent>
    </Popover>
  )
}
