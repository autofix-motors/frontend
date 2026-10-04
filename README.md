# AutoFix Motors — Frontend

Interfaz de AutoFix Motors. TanStack Start (React 19) como BFF: el navegador
llama a server functions y estas a la API de NestJS (repo `backend`). Tailwind
CSS 4 + shadcn/ui.

## Requisitos

- **Node.js** 24.
- **pnpm** (`npm install -g pnpm`).
- El **backend** levantado (por defecto en `http://localhost:3001`).

## Variables de entorno

Copia `.env.example` a `.env`. El `.env` no se commitea.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `API_URL` | Sí | URL de la API de NestJS. La lee solo el servidor: el navegador nunca llama a la API |

## Levantar el proyecto

```bash
pnpm install
pnpm dev           # http://localhost:3000
```

Se entra con el administrador que crea `pnpm db:seed` en el backend.

## Comandos

```bash
pnpm typecheck        # tsc
pnpm lint             # oxlint
pnpm test             # Vitest
pnpm build            # build de producción
pnpm format           # Prettier
pnpm api:types        # regenera src/types/api.gen.ts desde el OpenAPI del backend
pnpm generate-routes  # regenera src/routeTree.gen.ts
```

Para agregar una primitiva de shadcn: `pnpm dlx shadcn@latest add <componente>`.

La estructura del proyecto y sus reglas están en [`CLAUDE.md`](CLAUDE.md) y en
`.claude/`.
