# Estilos y convenciones de UI

- Usar Tailwind CSS 4 (utility-first), evitar CSS custom salvo excepción justificada.
- Componentes UI base: shadcn/ui en `src/components/ui`, instalar con `pnpm dlx shadcn@latest add <nombre>`.
- Nombrar componentes en PascalCase, archivos de componente en PascalCase.tsx.
- Usar `clsx` / `tailwind-merge` (`cn()` en `src/lib/utils.ts`) para clases condicionales.
