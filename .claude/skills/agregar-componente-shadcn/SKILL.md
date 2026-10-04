---
name: agregar-componente-shadcn
description: Instala una primitiva de shadcn/ui en el proyecto y la deja lista para usar en src/components/ui.
---

1. Instalar con `pnpm dlx shadcn@latest add <componente>`.
2. Verificar que el archivo se creó en `src/components/ui/<componente>.tsx`.
3. No modificar el estilo base generado salvo necesidad puntual; si se requiere una variante custom, envolverla como componente global (ver skill `nuevo-componente-global`) en lugar de editar la primitiva.
4. Revisar que las dependencias nuevas (si las hay) quedaron en `package.json`.
