import {
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { createColumns } from '#/components/data-table/features'
import { DataTable } from '#/components/data-table/DataTable'
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
import {
  TemporaryPasswordDialog,
  type TemporaryCredentials,
} from '#/components/credentials/TemporaryPasswordDialog'
import { formatDateTime } from '#/lib/dates'
import { ROLE_LABELS } from '#/modules/core/auth/auth.schemas'
import type { Page } from '#/server/api'
import { USER_FILTERS_CLEARED, roleOptions } from '../users.schemas'
import type { TemporaryPassword, User, UsersSearch } from '../users.schemas'
import { DeleteUserDialog } from './DeleteUserDialog'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { UserFormDialog } from './UserFormDialog'

/** Lo que se le comparte a un usuario del personal con su temporal. */
function staffCredentials(
  user: User,
  password: TemporaryPassword,
): TemporaryCredentials {
  return {
    name: user.name,
    phone: user.phone,
    // Con el DNI si lo tiene; el personal registrado antes, con su correo.
    loginIdentifier: user.documentNumber ?? user.email,
    temporaryPassword: password.temporaryPassword,
    expiresAt: password.expiresAt,
    isStaff: true,
  }
}

const column = createColumns<User>()

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

const muted = (text: string) => (
  <span className="text-muted-foreground">{text}</span>
)

type RowActions = {
  currentUserId: string
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onDelete: (user: User) => void
}

function userColumns({
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete,
}: RowActions) {
  return column.columns([
    column.accessor('name', {
      header: 'Nombre',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="flex items-center gap-2 font-medium">
            {info.getValue()}
            {info.row.original.userId === currentUserId && (
              <Badge variant="outline">Tú</Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {info.row.original.email}
          </span>
        </div>
      ),
    }),
    column.accessor('documentNumber', {
      header: 'DNI',
      enableSorting: false,
      cell: (info) => info.getValue() ?? muted('Sin DNI'),
    }),
    column.accessor('phone', {
      header: 'Teléfono',
      enableSorting: false,
      cell: (info) => info.getValue() ?? muted('—'),
    }),
    column.accessor('role', {
      header: 'Rol',
      enableSorting: false,
      cell: (info) => (
        <Badge variant={info.getValue() === 'ADMIN' ? 'default' : 'secondary'}>
          {ROLE_LABELS[info.getValue()]}
        </Badge>
      ),
    }),
    column.accessor('assignedWorkOrdersCount', {
      header: 'Órdenes asignadas',
      enableSorting: false,
    }),
    column.accessor('isActive', {
      header: 'Estado',
      enableSorting: false,
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue() ? (
            <Badge variant="secondary">Activo</Badge>
          ) : (
            <Badge variant="outline">Inactivo</Badge>
          )}
          {/* Todavía no entró a cambiar la contraseña que se le generó. */}
          {info.row.original.mustChangePassword && (
            <Badge variant="outline">Contraseña temporal</Badge>
          )}
        </div>
      ),
    }),
    column.accessor('lastLoginAt', {
      header: 'Último ingreso',
      cell: (info) =>
        info.getValue() ? formatDateTime(info.getValue()) : muted('Nunca'),
    }),
    column.accessor('createdAt', {
      header: 'Registrado',
      cell: (info) => formatDateTime(info.getValue()),
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: (info) => {
        const user = info.row.original
        // La API no deja que el usuario de la sesión se borre: la acción se
        // muestra deshabilitada en vez de ofrecer un botón que falla.
        const isSelf = user.userId === currentUserId
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(user)}>
                <PencilIcon />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onResetPassword(user)}>
                <KeyRoundIcon />
                Restablecer contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSelf}
                onSelect={() => onDelete(user)}
              >
                <Trash2Icon />
                {isSelf ? 'No puedes eliminarte' : 'Eliminar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ])
}

type UserTableProps = {
  page: Page<User>
  search: UsersSearch
  /** Cambia la búsqueda en la URL; la ruta vuelve a pedir la página. */
  onSearchChange: (changes: Partial<UsersSearch>) => void
  isFetching: boolean
  /** El usuario de la sesión, para no ofrecerle lo que la API le impide. */
  currentUserId: string
}

/** El listado del personal con su búsqueda, filtros, alta, edición y borrado. */
export function UserTable({
  page,
  search,
  onSearchChange,
  isFetching,
  currentUserId,
}: UserTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User>()
  const [resettingPassword, setResettingPassword] = useState<User>()
  const [credentials, setCredentials] = useState<TemporaryCredentials>()
  const [deleting, setDeleting] = useState<User>()

  const columns = useMemo(
    () =>
      userColumns({
        currentUserId,
        onEdit: (user) => {
          setEditing(user)
          setFormOpen(true)
        },
        onResetPassword: setResettingPassword,
        onDelete: setDeleting,
      }),
    [currentUserId],
  )

  // Cambiar la búsqueda o un filtro vuelve a la primera página: la página 4 de
  // un resultado nuevo puede no existir.
  const filter = (changes: Partial<UsersSearch>) =>
    onSearchChange({ ...changes, page: 1 })

  const isFiltered = Boolean(
    search.search || search.role || search.isActive !== undefined,
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
            ? 'Ningún usuario coincide con la búsqueda'
            : 'Todavía no hay usuarios registrados'
        }
        onPageChange={(next) => onSearchChange({ page: next })}
        onPageSizeChange={(pageSize) => onSearchChange({ pageSize, page: 1 })}
        sort={{ sortBy: search.sortBy, sortOrder: search.sortOrder }}
        onSortChange={(sort) =>
          onSearchChange({
            sortBy: sort.sortBy as UsersSearch['sortBy'],
            sortOrder: sort.sortOrder,
          })
        }
        toolbar={
          <DataTableToolbar
            search={search.search ?? ''}
            onSearchChange={(text) => filter({ search: text || undefined })}
            searchPlaceholder="Buscar por nombre o correo"
            isFiltered={isFiltered}
            onReset={() => onSearchChange(USER_FILTERS_CLEARED)}
            actions={
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <PlusIcon />
                Nuevo usuario
              </Button>
            }
          >
            <DataTableFilter
              label="Rol"
              allLabel="Todos los roles"
              options={roleOptions}
              value={search.role}
              onChange={(value) =>
                filter({ role: value as UsersSearch['role'] })
              }
            />
            <DataTableFilter
              label="Estado"
              allLabel="Todos los estados"
              options={STATUS_OPTIONS}
              value={
                search.isActive === undefined
                  ? undefined
                  : String(search.isActive)
              }
              onChange={(value) =>
                filter({
                  isActive: value === undefined ? undefined : value === 'true',
                })
              }
            />
          </DataTableToolbar>
        }
      />
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        currentUserId={currentUserId}
        onCreated={({ user, ...password }) =>
          setCredentials(staffCredentials(user, password))
        }
      />
      <ResetPasswordDialog
        user={resettingPassword}
        isSelf={resettingPassword?.userId === currentUserId}
        onOpenChange={(open) => !open && setResettingPassword(undefined)}
        onIssued={(user, password) =>
          setCredentials(staffCredentials(user, password))
        }
      />
      <TemporaryPasswordDialog
        credentials={credentials}
        onClose={() => setCredentials(undefined)}
      />
      <DeleteUserDialog
        user={deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      />
    </>
  )
}
