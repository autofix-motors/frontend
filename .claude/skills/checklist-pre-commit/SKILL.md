---
name: checklist-pre-commit
description: Corre build y verificaciones básicas antes de commitear cambios en el frontend de AutoFix Motors.
---

1. Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`, y
   confirmar que los cuatro terminan sin errores.
2. Si se tocaron rutas, correr `pnpm generate-routes` y confirmar que
   `routeTree.gen.ts` quedó actualizado.
3. Si el cambio usa un endpoint nuevo o cambiado del backend, correr
   `pnpm api:types` y revisar el diff de `src/types/api.gen.ts`.
4. Revisar `git status` y `git diff` para confirmar que solo se incluyen los
   cambios esperados. Si aparecen archivos que no se tocaron a propósito (suele
   ser el formateador, o `routeTree.gen.ts` con solo cambios de fin de línea),
   se devuelven con `git checkout -- <archivo>`.
5. Confirmar que no se commitean archivos generados innecesarios ni secretos
   (`.env` no se commitea; `.env.example` sí).
