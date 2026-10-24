import { useQuery } from '@tanstack/react-query'
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UndoIcon,
  UserRoundCheckIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ComboboxOption } from '#/components/combobox/AsyncCombobox'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
import { DataTableComboboxFilter } from '#/components/data-table/DataTableComboboxFilter'
import { DataTableFilter } from '#/components/data-table/DataTableFilter'
import { DataTableToolbar } from '#/components/data-table/DataTableToolbar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { usersQueries } from '#/modules/core/users/users.queries'
import { userOption } from '#/modules/core/users/users.schemas'
import type { Page } from '#/server/api'
import { useAssignTool } from '../tools.queries'
import {
  TOOL_FILTERS_CLEARED,
  TOOL_STATUS_LABELS,
  toolLocation,
} from '../tools.schemas'
import type { Tool, ToolStatus, ToolsSearch } from '../tools.schemas'
import { AssignToolDialog } from './AssignToolDialog'
import { DeleteToolDialog } from './DeleteToolDialog'
import { ToolFormDialog } from './ToolFormDialog'

const column = createColumns<Tool>()

// En plural, como se lee en el filtro.
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Operativas' },
  { value: 'IN_REPAIR', label: 'En reparación' },
  { value: 'RETIRED', label: 'De baja' },
] satisfies { value: ToolStatus; label: string }[]

const STATUS_BADGES: Record<
  ToolStatus,
  'secondary' | 'destructive' | 'outline'
> = {
  AVAILABLE: 'secondary',
  // No se puede usar mientras tanto: que salte a la vista.
  IN_REPAIR: 'destructive',
  RETIRED: 'outline',
}

const LOCATION_OPTIONS = [
  { value: 'false', label: 'En el almacén' },
  { value: 'true', label: 'Asignadas' },
]

/** Un filtro de sí/no de la barra: `undefined` es «todas». */
const toBooleanFilter = (value: string | undefined) =>
  value === undefined ? undefined : value === 'true'

const fromBooleanFilter = (value: boolean | undefined) =>
  value === undefined ? undefined : String(value)

// El filtro ofrece a todo el personal, también al inactivo: puede tener aún
// herramientas que no devolvió.
const allUserOptions = (search: string) =>
  usersQueries.options({ search, onlyActive: false })

type RowActions = {
  onAssign: (tool: Tool) => void
  onReturn: (tool: Tool) => void
  onEdit: (tool: Tool) => void
  onDelete: (tool: Tool) => void
}

/**
 * Las columnas. Las acciones son solo de quien puede modificar (el
 * administrador): el mecánico ve el listado en solo lectura.
 */
function toolColumns(actions: RowActions | undefined) {
  return column.columns([
    column.accessor('code', {
      header: 'Código',
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ),
    }),
    column.accessor('name', {
      header: 'Herramienta',
      cell: (info) => (
        <div className="flex max-w-sm flex-col">
          <span className="font-medium">{info.getValue()}</span>
          {info.row.original.brand && (
            <span className="truncate text-xs text-muted-foreground">
              {info.row.original.brand}
            </span>
          )}
        </div>
      ),
    }),
    column.accessor('status', {
      header: 'Estado',
      cell: (info) => (
        <Badge variant={STATUS_BADGES[info.getValue()]}>
          {TOOL_STATUS_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    column.accessor('assignedTo', {
      header: 'Asignada a',
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          toolLocation(info.row.original)
        ) : (
          <span className="text-muted-foreground">
            {toolLocation(info.row.original)}
          </span>
        ),
    }),
    column.accessor('notes', {
      header: 'Notas',
      enableSorting: false,
      cell: (info) => (
        <span className="line-clamp-2 max-w-xs text-xs text-muted-foreground">
          {info.getValue() ?? '—'}
        </span>
      ),
    }),
    ...(actions ? [actionsColumn(actions)] : []),
  ])
}

function actionsColumn(actions: RowActions) {
  return column.display({
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: (info) => {
      const tool = info.row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Acciones">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* La API solo asigna una herramienta operativa. */}
            <DropdownMenuItem
              disabled={tool.status !== 'AVAILABLE'}
              onSelect={() => actions.onAssign(tool)}
            >
              <UserRoundCheckIcon />
              {tool.assignedTo ? 'Reasignar' : 'Asignar'}
            </DropdownMenuItem>
            {tool.assignedTo && (
              <DropdownMenuItem onSelect={() => actions.onReturn(tool)}>
                <UndoIcon />
                Devolver al almacén
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onEdit(tool)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* La API no borra una herramienta que alguien tiene: primero se
                devuelve al almacén. */}
            <DropdownMenuItem
              variant="destructive"
              disabled={Boolean(tool.assignedTo)}
              onSelect={() => actions.onDelete(tool)}
            >
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  })
}

type ToolTableProps = {
  page: Page<Tool>
  search: ToolsSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<ToolsSearch>) => void
  isFetching: boolean
  /**
   * Si quien mira puede registrar, entregar, editar y borrar (el
   * administrador). El mecánico ve el listado en solo lectura.
   */
  canManage: boolean
  /** El usuario de la sesión: el filtro «Mis herramientas» del mecánico. */
  sessionUserId: string
}

/**
 * Las herramientas con su búsqueda, filtros, alta, edición, borrado y la
 * entrega o devolución rápida desde cada fila.
 */
export function ToolTable({
  page,
  search,
  onSearchChange,
  isFetching,
  canManage,
  sessionUserId,
}: ToolTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tool>()
  const [deleting, setDeleting] = useState<Tool>()
  const [assigning, setAssigning] = useState<Tool>()
  const { mutate: assign } = useAssignTool()

  const columns = useMemo(
    () =>
      toolColumns(
        canManage
          ? {
              onAssign: setAssigning,
              // Sin diálogo: devolverla no pide nada más. Si la API la
              // rechaza, el motivo sale en un aviso.
              onReturn: (tool) =>
                assign(
                  { toolId: tool.toolId, assignedToId: null },
                  { onError: (error) => toast.error(error.message) },
                ),
              onEdit: (tool) => {
                setEditing(tool)
                setFormOpen(true)
              },
              onDelete: setDeleting,
            }
          : undefined,
      ),
    [canManage, assign],
  )

  // El nombre de quien filtra el administrador: la URL solo guarda el id. Se
  // pide al módulo de usuarios (la ruta ya lo precargó).
  const filterUser = useQuery({
    ...usersQueries.detail(search.assignedToId ?? ''),
    enabled: canManage && Boolean(search.assignedToId),
  })
  const userFilterOption: ComboboxOption | undefined = search.assignedToId
    ? filterUser.data
      ? userOption(filterUser.data)
      : filterUser.isError
        ? { value: search.assignedToId, label: 'Usuario no encontrado' }
        : undefined
    : undefined

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<ToolsSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isMine = search.assignedToId === sessionUserId
  const isFiltered = Boolean(
    search.search ||
    search.status !== undefined ||
    search.assignedToId !== undefined ||
    search.isAssigned !== undefined,
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={page.items}
        meta={page.meta}
        isFetching={isFetching}
        emptyMessage={
          isFiltered
            ? 'Ninguna herramienta coincide con la búsqueda'
            : 'Todavía no hay herramientas registradas'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as ToolsSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por código, nombre o marca"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(TOOL_FILTERS_CLEARED)}
            actions={
              canManage && (
                <Button
                  onClick={() => {
                    setEditing(undefined)
                    setFormOpen(true)
                  }}
                >
                  <PlusIcon />
                  Nueva herramienta
                </Button>
              )
            }
          >
            <DataTableFilter
              label="Estado"
              allLabel="Todos los estados"
              options={STATUS_OPTIONS}
              value={search.status}
              onChange={(value) =>
                filter({ status: value as ToolsSearch['status'] })
              }
            />
            <DataTableFilter
              label="Ubicación"
              allLabel="Todas las ubicaciones"
              options={LOCATION_OPTIONS}
              value={fromBooleanFilter(search.isAssigned)}
              onChange={(value) =>
                filter({ isAssigned: toBooleanFilter(value) })
              }
            />
            {/* El personal solo lo lista el administrador (`/users`); el
                mecánico filtra las suyas con su propia sesión. */}
            {canManage ? (
              <DataTableComboboxFilter
                label="Asignada a"
                allLabel="Todo el personal"
                searchPlaceholder="Buscar por nombre o correo"
                value={search.assignedToId}
                selectedOption={userFilterOption}
                optionsQuery={allUserOptions}
                onChange={(assignedToId) => filter({ assignedToId })}
              />
            ) : (
              <Button
                variant={isMine ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={isMine}
                onClick={() =>
                  filter({ assignedToId: isMine ? undefined : sessionUserId })
                }
              >
                <UserRoundCheckIcon />
                Mis herramientas
              </Button>
            )}
          </DataTableToolbar>
        }
      />
      {canManage && (
        <>
          <ToolFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            tool={editing}
          />
          <AssignToolDialog
            tool={assigning}
            onOpenChange={(open) => !open && setAssigning(undefined)}
          />
          <DeleteToolDialog
            tool={deleting}
            onOpenChange={(open) => !open && setDeleting(undefined)}
          />
        </>
      )}
    </>
  )
}
