---
name: nuevo-hook-query
description: Crea una consulta o mutación de TanStack Query para un módulo, con su server function. Úsalo al agregar una lectura o escritura contra la API en modules/<group>/<module>/.
---

Una consulta nueva recorre tres archivos del módulo. El detalle y los ejemplos
están en la skill `estructura-frontend`, en «El recorrido de un dato».

1. **Server function** en `modules/<group>/<module>/<module>.fn.ts`, con
   `createServerFn` y `callApi` de `#/server/api`. Si recibe datos, declara
   `.validator(schema)` con el esquema Zod de `<module>.schemas.ts`.
   `inputValidator` está obsoleto: no se usa.
2. **Tipo de la respuesta** desde `#/types/api.gen` (`components['schemas'][...]`).
   Si el endpoint es nuevo, primero `pnpm api:types`. No se escribe a mano.
3. **En `<module>.queries.ts`**:
   - La clave sale del objeto `<module>Keys`: se agrega ahí si es nueva, por
     ejemplo `detail: (id) => [...vehiclesKeys.all, 'detail', id] as const`.
   - Una **lectura** se exporta como `queryOptions` dentro de `<module>Queries`,
     no como hook: la usan la ruta (`ensureQueryData`) y el componente
     (`useSuspenseQuery` o `useQuery`).
   - Una **mutación** se exporta como hook `use<Action><Resource>`
     (`useCreateVehicle`) e invalida en `onSuccess` las claves que quedan
     desactualizadas; normalmente, `<module>Keys.all`.
4. Tipar parámetros y respuestas explícitamente, sin `any`.
