---
name: nuevo-componente-global
description: Crea un componente global reutilizable en src/components, siguiendo las convenciones del proyecto (shadcn/ui, Tailwind, cn()).
---

0. Confirmar que es global: si solo lo usa un módulo (una tabla de predios, el formulario de un trabajador), va en `src/modules/<group>/<module>/components/`, no aquí. Se vuelve global cuando lo necesita un segundo módulo, aunque sea del mismo grupo.
1. Ubicar el componente en `src/components/<carpeta>/<Nombre>.tsx`, en la carpeta de su rol (`form/`, `data-table/`, `layout/`) o en una nueva si no encaja en ninguna (o `src/components/ui/<nombre>.tsx` si es una primitiva estilo shadcn).
2. Nombrar el archivo y el componente en PascalCase y en inglés, sin repetir el nombre de una primitiva de shadcn (`AppSidebar`, no `Sidebar`).
3. Usar Tailwind CSS para estilos; para clases condicionales usar `cn()` de `src/lib/utils.ts`.
4. Si el componente envuelve una primitiva de shadcn, instalar la base con `pnpm dlx shadcn@latest add <componente>` antes de crear el wrapper.
5. Exportar el componente como default o named export, consistente con los demás componentes de la carpeta.
