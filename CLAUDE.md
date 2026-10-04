# autofix-motors-frontend

## Stack
- TanStack Start 1.168 (React 19) + Router + Query 5 + Table 9 + Form, como BFF: el navegador llama a server functions y estas a la API de NestJS (repo `backend`)
- Zod para validar, openapi-typescript para los tipos de la API
- Tailwind CSS 4 + shadcn/ui (componentes en `src/components/ui`)
- oxlint, Prettier y Vitest; pnpm

## Comandos
- `pnpm dev` — servidor de desarrollo (puerto 3000). Necesita `.env` con `API_URL` (ver `.env.example`)
- `pnpm typecheck` · `pnpm lint` · `pnpm format` · `pnpm test` · `pnpm build`
- `pnpm api:types` — regenera `src/types/api.gen.ts` desde el OpenAPI del backend (levantado en el 3001)
- `pnpm generate-routes` — regenera `routeTree.gen.ts` (TanStack Router)
- Agregar componente shadcn: `pnpm dlx shadcn@latest add <componente>`

## Estructura
- `src/routes/` — rutas por archivo; solo cablean (loader, página). `login.tsx` es la única sin sesión. `_app.tsx` exige sesión y pone la barra lateral; las pantallas van en `_app/<group>/<module>/`
- `src/modules/<group>/<module>/` — un grupo por archivo de schema del backend (hoy solo `core`) y dentro un módulo por cada módulo del backend: `<module>.fn.ts` (server functions), `<module>.queries.ts`, `<module>.schemas.ts` y `components/`.
- `src/components/` — compartidos: `ui/` (shadcn), `form/` (useAppForm y campos), `data-table/` (DataTable), `upload/` (Dropzone), `layout/` (AppSidebar, AppHeader, `navigation.ts` con el menú filtrable por rol, ErrorScreen)
- `src/server/` — solo servidor: variables de entorno, cliente hacia NestJS y cookies de sesión
- `src/types/api.gen.ts`, `src/routeTree.gen.ts` — generados, no editar a mano

El detalle, con ejemplos, está en la skill `estructura-frontend`.

## Reglas del proyecto
Reglas obligatorias que aplican a todo el trabajo en este repo, ubicadas en `.claude/rules/`:
- `proyecto.md` — idioma, git e invariantes (el navegador no llama a la API, `server/` no sale del servidor, versiones fijadas, la sesión solo se renueva en `getSession`).
- `nomenclatura.md` — nombres de carpetas, archivos y símbolos (identificadores en inglés, con el vocabulario del backend).
- `estilos.md` — convenciones de estilo de código y UI (Tailwind, shadcn, nombres de componentes, `cn()`).
- `confirmacion-antes-de-subir.md` — nada se sube sin confirmación explícita.
- `commits.md` · `ramas.md` · `documentacion.md` · `dependencias.md` — flujo de trabajo, igual que en el backend.
- `trabajar-con-ia.md` — el procedimiento para pedir y revisar cambios hechos con IA.

## Skills disponibles
Flujos reutilizables en `.claude/skills/`, invocables con `/<nombre>`:
- `estructura-frontend` — dónde va cada archivo, el recorrido de un dato, formularios, tablas y tipos de la API.
- `nuevo-hook-query` — crear una consulta o mutación con su server function.
- `nuevo-componente-global` — crear un componente global reutilizable en `src/components`.
- `agregar-componente-shadcn` — instalar y dejar lista una primitiva de shadcn/ui.
- `checklist-pre-commit` — verificaciones antes de commitear (typecheck, lint, tests, build, `git status`).

## Agentes disponibles
Subagentes en `.claude/agents/`:
- `git-watcher` — revisa el remoto de Git y reporta si hay commits nuevos que no están en local (solo lectura).
