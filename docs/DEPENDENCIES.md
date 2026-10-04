# Dependencias

Qué se instaló, cuándo y para qué. Lo escribe quien instala o quita el paquete,
en el mismo commit. El formato y el porqué están en
[`.claude/rules/dependencias.md`](../.claude/rules/dependencias.md).

No están listadas las que vienen en el andamio de TanStack Start (`.cta.json`:
Router, Query, Table, Tailwind, shadcn…) ni las que agrega `shadcn add`: son la
línea base del framework, no una decisión del equipo.

## Instaladas

| Fecha | Paquete | Tipo | Para qué |
|---|---|---|---|
| 2026-09-24 | `@tanstack/react-form` | prod | Formularios tipados con validación por campo, asíncrona (duplicados contra el servidor) y entre campos |
| 2026-09-24 | `zod` | prod | Validar los formularios en el navegador y, con el mismo esquema, lo que reciben las server functions; y las variables de entorno del servidor |
| 2026-09-24 | `openapi-typescript` | dev | Generar los tipos de la API desde el OpenAPI de NestJS, para no escribirlos a mano en dos repos |
| 2026-09-24 | `oxlint` | dev | Linter, el mismo que usa el backend |
| 2026-09-24 | `prettier` | dev | Formato, el mismo que usa el backend |
| 2026-09-24 | `vitest` | dev | Tests, el mismo runner que el backend |
| 2026-09-24 | `@testing-library/react` | dev | Probar componentes como los usa una persona, por lo que muestran |
| 2026-09-24 | `@testing-library/dom` | dev | Peer obligatorio de `@testing-library/react` desde la 16 |
| 2026-09-24 | `jsdom` | dev | El DOM en el que corren los tests de Vitest |
| 2026-09-25 | `date-fns` | prod | Formatear fechas de la API en un solo lugar (utilidad pendiente en `lib/`), sin repetir `toLocaleDateString` en cada pantalla |
| 2026-09-25 | `react-dropzone` | prod | Arrastrar y soltar archivos en un componente de carga reutilizable (pendiente), para los documentos de los módulos |

## Retiradas

| Fecha | Paquete | Por qué |
|---|---|---|
| 2026-09-24 | `@faker-js/faker` | Ya no se usa: venía como dependencia de producción en el ejemplo de tabla del andamio, sin usos en `src/` |

## Notas

- **Versiones fijadas.** Hasta el 2026-09-24 los paquetes de TanStack estaban en
  `latest`. Se fijaron a la versión que estaba instalada ese día.
- **`openapi-typescript` y TypeScript 6.** La 7.13 declara `typescript ^5`, y no
  hay versión que declare la 6. Se comprobó que funciona: generó los tipos de la
  API real y compilaron con `tsc`. La excepción está en `pnpm-workspace.yaml`
  (`peerDependencyRules`) y se quita cuando el paquete declare soporte para la 6.
- **`axios` no se instaló.** Se evaluó el 2026-09-25. En el BFF todas las
  llamadas a la API salen de un solo lugar, `src/server/api.ts`, que corre en el
  servidor, donde `fetch` es nativo. Lo que axios aportaría (JSON, errores
  normalizados, tiempo máximo, un punto para el token) ya lo resuelve
  `callApi` en pocas líneas. Si algún día hace falta algo que `fetch` no da
  (reintentos, progreso de subida), se vuelve a evaluar.
- **`clsx` y `tailwind-merge`** siguen instalados, pero desde el preset
  `radix-lyra` nadie los importa: shadcn usa el paquete `cn`. Pendiente de
  decidir, porque `.claude/rules/estilos.md` todavía los menciona.
