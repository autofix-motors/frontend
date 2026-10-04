# Nomenclatura

Cómo se llaman las carpetas, los archivos y los símbolos. **Todo identificador
va en inglés**, con el mismo vocabulario que el backend; lo que genera el
framework o una herramienta se queda como viene. Los comentarios, los textos de
la interfaz, la documentación y los commits siguen en español.

## Carpetas

```
src/
├── routes/                     convención de TanStack Router (no se renombra)
├── modules/<group>/<module>/   módulos agrupados por dominio, como el backend
├── components/                 compartidos: ui/ (shadcn), form/, data-table/, layout/
├── server/                     solo servidor
├── integrations/               configuración de librerías (TanStack Query)
├── types/                      tipos generados
└── lib/                        utilidades sin estado
```

### Módulos agrupados por dominio

```
src/modules/
└── core/                grupo: el de core.prisma
    └── auth/
        ├── auth.fn.ts
        ├── auth.queries.ts
        ├── auth.schemas.ts
        └── components/
```

- **Un grupo por archivo de schema del backend** (hoy solo `core`). Antes de
  crear un módulo, la pregunta es a qué grupo pertenece. Un grupo nace con su
  primer módulo: no se crean carpetas vacías.
- **El módulo se llama como el módulo del backend** que consume:
  `modules/core/auth/` usa la API de `backend/src/modules/core/auth/`. La misma
  palabra en la carpeta, en sus archivos, en la ruta de la pantalla y en el
  scope de los commits.
- **El grupo no tiene archivo propio.** A diferencia del backend, donde
  `<group>.module.ts` registra los módulos en Nest, aquí la carpeta solo ordena.
- **Las pantallas siguen la misma forma**: van en
  `routes/_app/<group>/<module>/` y sirven `/<group>/<module>` (por ejemplo,
  `/workshop/work-orders`). La URL de la pantalla es del frontend, no de la
  API: la API sigue sin grupo (`/work-orders`).

## Archivos

| Qué | Cómo | Ejemplo |
|---|---|---|
| Componente propio | PascalCase, como el componente | `WorkOrderTable.tsx`, `TextField.tsx` |
| Primitiva de shadcn | Como la genera el CLI | `button.tsx`, `field.tsx` |
| Server functions del módulo | `<module>.fn.ts` | `work-orders.fn.ts` |
| Consultas y mutaciones | `<module>.queries.ts` | `work-orders.queries.ts` |
| Esquemas Zod y tipos | `<module>.schemas.ts` | `work-orders.schemas.ts` |
| Otros archivos sin componente | kebab-case | `features.ts`, `context.ts` |
| Tests | Junto al archivo, con `.spec` | `api.spec.ts` |
| Rutas | Convención de TanStack Router | `routes/_app/index.tsx` |

La regla de PascalCase para componentes es de [`estilos.md`](estilos.md): separa
a simple vista lo propio (`DataTable.tsx`) de lo generado (`table.tsx`).

**Un componente propio no se llama igual que una primitiva de shadcn**: el
layout de la app es `AppSidebar`, no `Sidebar`, porque `ui/sidebar.tsx` ya
exporta `Sidebar` y los dos terminarían importados en el mismo archivo.

**Cada entidad con su propio módulo en el backend tiene su propio módulo aquí**:
`modules/workshop/vehicles/` y `modules/workshop/work-orders/`, no un
`workshop.fn.ts` que crece con cada entidad del grupo.

## Símbolos

| Qué | Cómo | Ejemplo |
|---|---|---|
| Componentes, tipos | PascalCase | `WorkOrderForm`, `CreateWorkOrderInput` |
| Funciones, variables, props | camelCase | `listWorkOrders`, `mileageIn` |
| Hooks | prefijo `use` | `useCreateWorkOrder`, `useAppForm` |
| Esquemas Zod | sufijo `Schema` | `createWorkOrderSchema` |
| Claves de consulta | `<module>Keys` | `workOrdersKeys.list()` |
| Constantes de módulo | UPPER_SNAKE_CASE | `ROLE_LABELS` |
| Variables de entorno | UPPER_SNAKE_CASE | `API_URL` |
| Booleanos | prefijo `is`, `has` o `can` | `isActive`, `canSubmit` |

(Los nombres con `WorkOrder` son ejemplos de cómo se vería un módulo futuro.)

- **El id de una entidad es `<entidad>Id`, nunca `id`**, igual que en el
  backend: `session.userId`, `vehicle.vehicleId`, y en rutas y parámetros
  también (`/workshop/work-orders/$workOrderId`). Así el mismo dato se llama
  igual en la base, la API y la pantalla.
- **Los campos que vienen de la API se llaman como en la API**: `createdAt`,
  `mileageIn`. No se renombran en el camino: el tipo generado ya los nombra.
- **Los términos del negocio usan la traducción del backend**, que está en su
  glosario y en el `/// Español: …` de cada modelo. Un `WorkOrder` en la API es
  un `WorkOrder` en la pantalla; lo que ve el usuario sigue diciendo «Orden de
  trabajo».

## Imports

- **Un solo alias: `#/*`**, que apunta a `src/`, y es el que usa shadcn. Nada de
  rutas relativas que suban más de un nivel (`../../`): se usa el alias.
- Dentro de un módulo, las rutas relativas cortas (`./auth.fn`, `../auth.queries`)
  dejan ver que el archivo es del mismo módulo.

## Lo que genera una herramienta se queda como viene

`components/ui/` (shadcn), `routeTree.gen.ts` (TanStack Router),
`types/api.gen.ts` (openapi-typescript), `styles.css` y `lib/utils.ts` (shadcn)
**no se editan ni se reformatean a mano**: se regenerarían en la siguiente
corrida y el cambio se perdería. Si hace falta otra variante de una primitiva,
se envuelve en un componente propio.
