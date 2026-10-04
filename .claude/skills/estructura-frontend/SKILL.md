---
name: estructura-frontend
description: Estructura del frontend (TanStack Start + Router + Query + Table + Form, shadcn). USAR SIEMPRE antes de crear o mover un archivo en src/ — una pantalla, un módulo, un formulario, una tabla, una server function o una consulta. Define dónde vive cada cosa, el recorrido de un dato del componente a NestJS, cómo se construyen formularios y tablas, y cómo se generan los tipos de la API.
---

# Estructura del frontend

TanStack Start 1.168 (React 19) con Router, Query 5, Table 9 y Form, más
shadcn/ui y Tailwind 4. Lo que hay que tener presente antes de escribir la
primera línea:

- **Es un BFF.** El navegador nunca llama a la API de NestJS (el repo
  `backend`): llama a *server functions* que corren en el servidor de Start, y
  son ellas las que llaman a la API. Así la sesión puede vivir en una cookie
  httpOnly y el backend no queda expuesto al navegador.
- **TanStack cambia de API entre versiones mayores.** Table 9 no se usa como la
  8, y en las server functions `inputValidator` quedó obsoleto a favor de
  `validator`. La mayoría de los ejemplos que se encuentran buscando son de
  versiones anteriores: se verifica contra `node_modules` y compilando, y se
  mira si lo que se usa está marcado `@deprecated`.
- **Todo identificador va en inglés**, con el vocabulario del backend. Los
  textos de la interfaz y los comentarios siguen en español. Ver
  [`nomenclatura.md`](../../rules/nomenclatura.md).
- **No hay un módulo plantilla.** Hoy el único módulo es `core/auth`, y es
  especial: no tiene consultas, porque la sesión viaja en el contexto del
  router. Un módulo nuevo se arma con los patrones de esta skill. **Los ejemplos
  con `workshop/vehicles` son ilustrativos**: muestran la forma, no código que
  exista en el repo.

## El mapa

```
src/
├── routes/                         SOLO cableado: loader, search params, página
│   ├── __root.tsx                  documento HTML, devtools
│   ├── login.tsx                   /login: la única pantalla sin sesión ni barra lateral
│   ├── _app.tsx                    layout de la app: exige sesión (beforeLoad) y pone la barra lateral
│   └── _app/
│       ├── index.tsx               / : la pantalla de inicio
│       └── <group>/<module>/       pantallas de un módulo: /<group>/<module>
├── modules/
│   └── <group>/                    un grupo por archivo de schema del backend (hoy solo core)
│       └── <module>/               un módulo, con el nombre del módulo del backend
│           ├── <module>.fn.ts      server functions: lo ÚNICO que llama a NestJS
│           ├── <module>.queries.ts claves, queryOptions y mutaciones
│           ├── <module>.schemas.ts esquemas Zod y tipos del módulo
│           └── components/         tablas, formularios y vistas del módulo
├── components/
│   ├── ui/                         primitivas de shadcn. Las genera el CLI
│   ├── form/                       useAppForm y los campos (TextField, TextareaField, SelectField, SwitchField, DateField, ColorField)
│   ├── data-table/                 DataTable, su paginación, barra y filtros, y createColumns
│   ├── upload/                     Dropzone: arrastrar o elegir un archivo
│   └── layout/                     AppSidebar y sus piezas, AppHeader, navigation.ts, ErrorScreen
├── server/                         SOLO servidor
│   ├── env.ts                      variables del servidor, validadas con Zod
│   ├── api.ts                      fetchApi, callApi y ApiError
│   └── session.ts                  las cookies de sesión del navegador
├── integrations/tanstack-query/    el QueryClient y sus devtools
├── hooks/use-mobile.ts             lo genera shadcn (lo usa la barra lateral)
├── types/api.gen.ts                generado del OpenAPI. No se edita
├── lib/utils.ts                    cn(). Lo genera shadcn
├── lib/dates.ts                    formatDateOnly y formatDateTime
├── lib/api-types.ts                WithNullable: corrige campos que el OpenAPI declara sin tipo
├── router.tsx                      crea el router; registra ErrorScreen como error por defecto
├── routeTree.gen.ts                generado por TanStack Router. No se edita
└── styles.css                      tema de shadcn y Tailwind
```

| Si es… | Va en… |
|---|---|
| Una pantalla | `routes/_app/<group>/<module>/…` |
| Un módulo en el menú | `components/layout/navigation.ts` |
| Algo de un solo módulo: una tabla, un formulario, una vista | `modules/<group>/<module>/components/` |
| Algo que usan varios módulos | `components/` (ver la skill `nuevo-componente-global`) |
| Una primitiva de UI | `components/ui/` (ver la skill `agregar-componente-shadcn`) |
| Una llamada a la API | `modules/<group>/<module>/<module>.fn.ts` |
| Una consulta o mutación | `modules/<group>/<module>/<module>.queries.ts` (ver la skill `nuevo-hook-query`) |
| Una utilidad genérica sin estado | `lib/` |

### Los módulos se agrupan como el schema

Igual que en el backend: **un grupo por archivo de `prisma/schema/`** y dentro,
un módulo por cada módulo del backend que se consume. Hoy el backend tiene un
solo grupo, `core` (`core.prisma`), con `auth`: `modules/core/auth/` es el
frontend de `backend/src/modules/core/auth/`, y se llaman igual.

- **Antes de crear un módulo, se decide su grupo**: el del archivo de schema
  donde vive su entidad. Un grupo nace con su primer módulo. Por ejemplo
  (ilustrativo), si el backend agrega `workshop.prisma` con los vehículos, el
  frontend tendría `modules/workshop/vehicles/`.
- **El grupo es solo una carpeta.** No hay `<group>.module.ts` ni un índice: en
  el backend existe porque Nest registra los módulos; aquí no hay nada que
  registrar.
- **La pantalla va en `routes/_app/<group>/<module>/`** y se sirve en
  `/<group>/<module>`: `routes/_app/workshop/vehicles/index.tsx` sirve
  `/workshop/vehicles`. Es la URL del navegador; la de la API no lleva grupo
  (`callApi('/auth/session')`, `callApi('/vehicles')`).
- **Un módulo aparece en el menú cuando se agrega a
  `components/layout/navigation.ts`**: en `GENERAL_ITEMS` si va arriba de todo
  (como «Inicio»), o como ítem de una sección de `SECTIONS`, que hoy está vacío.
  Una sección aparece cuando tiene su primer ítem. De ahí sale también el
  breadcrumb (`breadcrumbFor`): no se declara en cada ruta. `to` se tipa contra
  las rutas que existen, así que primero va la ruta y después el ítem.

  ```ts
  // Ilustrativo: una sección «Taller» con un módulo solo para administradores
  export const SECTIONS: NavSection[] = [
    {
      label: 'Taller',
      icon: WrenchIcon,
      items: [{ label: 'Vehículos', to: '/workshop/vehicles', roles: ['ADMIN'] }],
    },
  ]
  ```

- **El menú se filtra por rol.** Un ítem con `roles` solo lo ven esos roles
  (`visibleSections(SECTIONS, session.role)`); sin `roles`, lo ven todos. Hay
  dos roles: `ADMIN` y `MECHANIC` (`UserRole`, con sus etiquetas en
  `ROLE_LABELS`). Ocultar un ítem no bloquea la URL: lo que protege es el
  `@Roles()` del endpoint en la API, y si alguien abre la pantalla igual, el
  403 llega como error y lo muestra `ErrorScreen`.
- **Lo que el usuario no puede hacer no se le muestra.** Un botón que la API
  rechazaría con 403 se oculta con `hasRole(session, 'ADMIN')`
  (`modules/core/auth/auth.schemas.ts`), y un formulario que su rol no puede
  guardar se ve en solo lectura. La API lo vuelve a comprobar: esto es para la
  experiencia, no para la seguridad.

## El recorrido de un dato, siempre el mismo

```
componente ──► queryOptions / mutación ──► server function ──► server/api.ts ──► NestJS
             (<module>.queries.ts)        (<module>.fn.ts)      (callApi)
```

**Nunca se salta un paso.** Un componente no hace `fetch`, una ruta no llama a
`callApi`, y nada fuera de `*.fn.ts` importa `server/`.

Los ejemplos que siguen son del módulo ilustrativo `modules/workshop/vehicles/`.

### Server functions (`<module>.fn.ts`)

```ts
// vehicles.fn.ts (ilustrativo)
export const listVehicles = createServerFn({ method: 'GET' }).handler(() =>
  callApi<Vehicle[]>('/vehicles'),
)

export const createVehicle = createServerFn({ method: 'POST' })
  .validator(createVehicleSchema)   // lo que llega del navegador se revalida
  .handler(({ data }) =>
    callApi<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  )
```

- **`validator` es obligatorio** en toda server function que recibe datos, con
  el mismo esquema Zod del formulario. La validación del navegador es para la
  experiencia, no para la seguridad. `inputValidator` hace lo mismo pero está
  marcado `@deprecated` y Vite avisa en cada arranque: no se usa.
- Corren en el servidor. El compilador de Start las convierte en una llamada
  HTTP cuando se invocan desde el navegador, y quita su código del bundle del
  cliente.

### `server/api.ts`

`callApi<T>(path, options)` arma la URL con `API_URL`, manda JSON y devuelve
el cuerpo parseado. Si la API responde con error, lanza un **`ApiError`** con el
`message` que manda NestJS, que ya viene en español; si la validación devuelve
varios mensajes, los une. La pantalla muestra `error.message` tal cual.

Cada llamada tiene un **tiempo máximo de 10 segundos**: una API colgada no puede
dejar colgado el renderizado. Si vence, lanza `ApiError` 504; si la API no
responde en absoluto (caída o URL mal configurada), 503. Una operación que de
verdad tarde más pasa su propio `signal` en las opciones.

**Sin axios.** `fetch` es nativo en el servidor de Start, y todo lo que axios
aportaría (JSON automático, errores normalizados, tiempo máximo y un solo lugar
para el token, que en axios sería un interceptor) ya está en `callApi`, que es
el único punto de llamada del BFF. Se evaluó el 2026-09-25 y se descartó por la
regla de dependencias: no se agrega un paquete para lo que ya está resuelto.

`fetchApi` hace lo mismo pero devuelve la `Response` sin leer: la usa el login,
que necesita el `Set-Cookie` de la API. Las dos mandan la sesión del usuario
(ver «Sesión en el BFF»).

Todo archivo de `server/` empieza con `import '@tanstack/react-start/server-only'`:
el build falla si un archivo del cliente lo importa.

### Sesión en el BFF

El login vive en `modules/core/auth/` (`auth.fn.ts`, `components/LoginForm.tsx`),
y las cookies en `server/session.ts`.

- **El navegador nunca ve las cookies de NestJS.** Al iniciar sesión o renovar,
  el BFF lee los tokens del `Set-Cookie` de la API (`afm_access`,
  `afm_refresh`) y pone **las suyas** (`afm_web_access`, `afm_web_refresh`):
  httpOnly, `SameSite=Lax`, `path: '/'`, y la duración que manda el backend. No
  se reenvían tal cual: la de refresco de Nest tiene `path: '/auth'` y no
  llegaría a las server functions, y en local los puertos 3000 y 3001 comparten
  cookies.
- **`fetchApi` agrega la sesión a cada llamada** (`Cookie: afm_access=…`). Una
  server function nueva no tiene que hacer nada para llamar a un endpoint
  protegido.
- **`_app.tsx` exige sesión en su `beforeLoad`** con `getSession`, y la deja en
  el contexto: cualquier página la lee con `Route.useRouteContext()`, sin
  volver a pedirla. La sesión es `CurrentSession` (`userId`, `name`, `email`,
  `role`). Sin sesión, redirige a `/login?redirect=<ruta>`, que al entrar
  vuelve a esa ruta (solo rutas de la app: `safeRedirect`).
- **La sesión no es una consulta.** Por eso `auth.queries.ts` solo tiene las
  mutaciones `useLogin` y `useLogout`; `useLogout` además vacía la caché de
  Query, para que el siguiente usuario del navegador no vea datos del anterior.
- **La sesión solo se renueva en `getSession`** (invariante 6 de
  `proyecto.md`). El backend rota el refresco y, si recibe uno ya usado, revoca
  la sesión entera: dos renovaciones en paralelo la cerrarían. Por eso
  `callApi` nunca renueva ante un 401. Si `getSession` renueva mientras se
  renderiza en el servidor, los loaders de esa misma petición usan el token
  nuevo: `session.ts` lo guarda por petición.
- **Las server functions solo aceptan llamadas del mismo origen**: Start
  responde 403 a una que llega desde otro sitio. Junto con `SameSite=Lax`, eso
  cierra la puerta a CSRF.

### Subir archivos

Hoy ningún endpoint del backend recibe archivos; esto es el patrón para el
primero. Un archivo viaja **navegador → server function → NestJS**, igual que
cualquier dato: el navegador nunca habla con la API.

```ts
// vehicles.fn.ts (ilustrativo): recibe FormData y lo reenvía tal cual
export const uploadVehiclePhoto = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (!(data instanceof FormData) || !(data.get('file') instanceof File)) {
      throw new Error('Adjunta un archivo')
    }
    return data
  })
  .handler(({ data }) =>
    callApi<Vehicle>(`/vehicles/${data.get('vehicleId')}/photo`, { method: 'PUT', body: data }),
  )

// vehicles.queries.ts (ilustrativo): la mutación arma el FormData
mutationFn: ({ vehicleId, file }: { vehicleId: string; file: File }) => {
  const data = new FormData()
  data.set('vehicleId', vehicleId)
  data.set('file', file)
  return uploadVehiclePhoto({ data })
}
```

- **El archivo va en el campo `file`**, el nombre que se acuerde con el
  endpoint del backend.
- **`fetchApi` no fija el `Content-Type` cuando el cuerpo es `FormData`**:
  `fetch` arma el del multipart con su `boundary`. Si alguien lo fija a mano, la
  API no puede leer el archivo.
- **La zona para soltar el archivo es `components/upload/Dropzone.tsx`**:
  recibe `accept` (en el formato de react-dropzone), `typesLabel` («PNG, JPG o
  WEBP»), `maxSize` y `onFile`. Avisa en el navegador el tipo o el tamaño que no
  sirven, con mensajes en español, y muestra el error de la API con `error`. No
  reemplaza la validación de la API, que es la que debe revisar el archivo.
- Pasar por el BFF y la API sirve para archivos chicos (una foto de pocos MB).
  Si algún día hacen falta archivos grandes, se evalúa entonces otra vía.

### Consultas (`<module>.queries.ts`)

```ts
// vehicles.queries.ts (ilustrativo)
export const vehiclesKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehiclesKeys.all, 'list'] as const,
}

export const vehiclesQueries = {
  list: () =>
    queryOptions({ queryKey: vehiclesKeys.list(), queryFn: () => listVehicles() }),
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => createVehicle({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehiclesKeys.all }),
  })
}
```

- **Las claves se arman desde un objeto `<module>Keys`**, nunca a mano en el
  componente: así invalidar todo el módulo es invalidar `vehiclesKeys.all`.
- **Las lecturas se exportan como `queryOptions`**, no como hooks: la misma
  opción la usan la ruta (para precargar) y el componente (para leer).

### Rutas (`routes/`)

```ts
// routes/_app/workshop/vehicles/index.tsx (ilustrativo)
export const Route = createFileRoute('/_app/workshop/vehicles/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(vehiclesQueries.list()),
  head: () => ({ meta: [{ title: 'Vehículos · AutoFix Motors' }] }),
  component: VehiclesPage,
})
```

- **La ruta solo cablea**: precarga, lee los search params, arma la página con
  componentes del módulo. La lógica vive en `modules/`.
- **El `loader` precarga en el servidor** con `ensureQueryData`, y el componente
  lee con `useSuspenseQuery` de la misma `queryOptions`: la página llega con
  datos, sin estado de carga que manejar.
- `routeTree.gen.ts` se regenera solo con `pnpm dev` o con `pnpm generate-routes`.
- **Si una página no puede cargar** (la API caída o un error de la API), el
  router muestra `ErrorScreen` (`components/layout/`), registrado una vez como
  `defaultErrorComponent` en `router.tsx`. Muestra el mensaje en español que
  trae el error y un botón para reintentar; una ruta no maneja su propio error
  salvo que necesite algo distinto.

## Formularios: TanStack Form + Zod

Todo formulario se construye con **`useAppForm`** (`components/form/form.ts`),
que registra una vez los campos y botones propios. El de login
(`modules/core/auth/components/LoginForm.tsx`) es el ejemplo real.

```tsx
const form = useAppForm({
  defaultValues,
  validators: { onChange: createVehicleSchema },
  onSubmit: async ({ value, formApi }) => {
    await create.mutateAsync(value)
    formApi.reset()
  },
})

<form.AppField name="plate">
  {(field) => <field.TextField label="Placa" />}
</form.AppField>
<form.AppForm>
  <form.SubmitButton label="Registrar" />
</form.AppForm>
```

- **El esquema Zod vive en `<module>.schemas.ts`** y lo usan el formulario y el
  `validator` de la server function: es la misma regla en los dos lados
  (`loginSchema` hace las dos cosas en `auth`).
- **Validación contra el servidor** (una placa que no puede repetirse):
  `validators={{ onChangeAsyncDebounceMs: 400, onChangeAsync: … }}` en el campo.
  `TextField` ya muestra «Verificando…» mientras corre.
- **Un campo que depende de otro** (un dato que solo es obligatorio según el
  valor de otro campo): `onChangeListenTo: ['<campo>']` en el campo que
  depende.
- **Un campo nuevo** (`NumberField`, `ComboboxField`…) se crea en
  `components/form/`, lee su estado con `useFieldContext<T>()` y se registra en
  `form.ts`. Se crea cuando lo necesita el primer formulario, no antes.
- **Los errores de la API** se muestran con `<FieldError>{mutation.error.message}</FieldError>`.

## Listados: paginados en la API, estado en la URL

Todo listado se pagina, busca, filtra y ordena **en la API** (regla del
proyecto). El ejemplo real es `modules/customer/customers/` con su ruta
`routes/_app/customer/customers/index.tsx`.

1. **La URL guarda el estado.** La ruta declara `validateSearch` con el esquema
   del módulo (`customersSearchSchema`: `page`, `pageSize`, `search`, filtros,
   `sortBy`, `sortOrder`), cada campo con `.catch(...)` para que una URL editada
   a mano no rompa la página, y `stripSearchParams(defaults)` para no escribir
   los valores por defecto.
2. **El loader precarga esa página**: `loaderDeps: ({ search }) => search` y
   `ensureQueryData(<module>Queries.list(deps))`. El componente la lee con
   `useSuspenseQuery`, y la consulta lleva `placeholderData: keepPreviousData`
   para que al cambiar de página la tabla se atenúe en vez de vaciarse.
3. **La server function** llama a `callApiPage<T>(path + toQueryString(search))`
   (`server/api.ts`), que devuelve `{ items, meta }`.
4. **La tabla**: `DataTable` recibe `data`, `meta`, el orden y los callbacks;
   `DataTableToolbar` (búsqueda con espera de 350 ms, filtros, «Limpiar» y
   acciones) y `DataTableFilter` (lista con «Todos»). Cambiar la búsqueda o un
   filtro vuelve a la página 1.

```tsx
const column = createColumns<Customer>()

column.columns([
  column.accessor('name', { header: 'Nombre' }),           // se ordena en la API
  column.accessor('phone', { header: 'Teléfono', enableSorting: false }),
])
```

- **Una columna que la API no sabe ordenar declara `enableSorting: false`**; el
  `id` de las que sí se ordenan es el valor de `sortBy` que acepta la API.
- **Las columnas se envuelven en `column.columns([...])`**: un arreglo literal no
  compila en la 9. Si necesitan acciones del componente (editar, borrar), se
  arman en una función y se memorizan con `useMemo`.
- `features.ts` solo declara `rowSortingFeature`: la tabla no ordena, filtra ni
  pagina filas por su cuenta.

## Respuestas de la API

La API responde `BaseResponseDto` en todo (`{ success, message, data, meta }`).
`callApi<T>` devuelve solo `data`; `callApiEnvelope<T>` todo, para las
mutaciones, que devuelven `message` y lo muestran con `toast.success`; los
errores llegan como `ApiError` con el `message` de la API y se muestran con
`<FieldError>`.

## Tipos de la API

```bash
pnpm api:types    # con el backend levantado en http://localhost:3001
```

Genera `src/types/api.gen.ts` desde el OpenAPI de NestJS (`/api/docs-json`). Los
tipos se toman de ahí y **no se escriben a mano**:

```ts
// el real, en auth.schemas.ts
export type CurrentSession = components['schemas']['CurrentSession']
export type UserRole = components['schemas']['UserRole']
```

- **El archivo generado se commitea**, a diferencia del cliente de Prisma en el
  backend: el origen es otro repositorio, y el build no puede depender de que el
  backend esté levantado.
- **Cuando el backend cambia un endpoint**, se regenera y se revisa el diff: dice
  exactamente qué cambió en el contrato, y `pnpm typecheck` marca cada lugar del
  front que hay que actualizar.
- El backend documenta las respuestas y también los cuerpos de entrada (sus DTO
  van decorados): el esquema Zod del módulo usa los mismos nombres de campo que
  el DTO (`components['schemas']['LoginDto']` para `loginSchema`), que es la
  referencia al escribirlo.

### Lo que el OpenAPI no dice bien

- **Las etiquetas en español de un enum viven en el `*.schemas.ts` del módulo
  dueño**, como `ROLE_LABELS` (`Record<UserRole, string>`) en `auth.schemas.ts`.
  Si el enum alimenta un `SelectField`, las opciones `{ value, label }` se arman
  desde ahí. Otro módulo que use el mismo enum las importa de ese archivo.
- **Un campo opcional que puede ser null sale como `Record<string, never> |
  null`** cuando la entidad del backend no declara su tipo. Se corrige en el
  `*.schemas.ts` con `WithNullable` (`lib/api-types.ts`), campo por campo. Es un
  puente hasta que el backend declare esos tipos.
- **Las fechas llegan de dos formas.** Un día sin hora (`AAAA-MM-DD`) se
  muestra con `formatDateOnly`, que no pasa por `Date` para que el día no se
  corra por la zona horaria, y se edita con `DateField`. Una marca de tiempo
  se muestra con `formatDateTime`, en la hora de Lima.

## shadcn/ui

- Las primitivas se instalan con `pnpm dlx shadcn@latest add <componente>` y
  quedan en `components/ui/` (estilo `radix-luma`, en `components.json`). **No
  se editan a mano**: si hace falta una variante, se envuelve en un componente
  propio.
- `styles.css` y `lib/utils.ts` también los escribe shadcn, así que están fuera
  de Prettier (`.prettierignore`).
- Los componentes de formulario se arman sobre `Field`, `FieldLabel`,
  `FieldError` y `FieldDescription` de `components/ui/field.tsx`.

## Variables de entorno

| Variable | Quién la lee | Para qué |
|---|---|---|
| `API_URL` | `server/env.ts` | La URL de la API de NestJS |

- Se validan con Zod en la primera lectura: un error de configuración sale con un
  mensaje claro en la primera llamada.
- **Una variable con prefijo `VITE_` termina en el bundle del navegador**, que
  descarga cualquiera. Nada secreto lleva ese prefijo.
- `.env.example` lista todas; `.env` no se commitea.

## Comandos

```bash
pnpm dev               # desarrollo, puerto 3000
pnpm typecheck         # tsc --noEmit
pnpm lint              # oxlint
pnpm format            # prettier
pnpm test              # vitest
pnpm build             # build de producción
pnpm generate-routes   # regenera routeTree.gen.ts
pnpm api:types         # tipos desde el OpenAPI del backend
```

## Tests

Vitest con Testing Library, en `jsdom`. Van **junto al archivo que prueban**, con
`.spec` (`api.spec.ts`, `navigation.spec.ts`). Lo que decide algo es lo que se
prueba: la traducción de errores, el filtro del menú por rol, una regla de
formulario, un cálculo. Un componente que solo pinta lo que recibe no necesita
test.
