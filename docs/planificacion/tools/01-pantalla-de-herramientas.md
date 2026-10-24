# Pantalla de herramientas

La pantalla de `/inventory/tools` («Herramientas», en la sección
«Inventario»), sobre la API del plan
`backend/docs/planificacion/tools/01-gestion-de-herramientas.md`.

## Qué entra y qué no

- **Entra:** el listado con búsqueda, filtros por estado, ubicación (en el
  almacén / asignadas) y persona, y orden por código, nombre o estado; alta,
  edición y borrado en diálogos para `ADMIN`, y en el menú de cada fila
  «Asignar» / «Reasignar» (un diálogo con el personal activo) y «Devolver al
  almacén» (un clic). El mismo listado en solo lectura para `MECHANIC`, con
  «Mis herramientas» en vez del filtro por persona. Nuevos: `clearLabel` en
  `ComboboxField`; en `users`, `getUser`, `usersQueries.detail` y `.options`
  y `userOption`.
- **No entra:** el historial de préstamos, una página de detalle, que el
  mecánico pida o devuelva una herramienta él mismo, exportar.

## Decisiones

| Decisión | Por qué |
|---|---|
| Estados con etiqueta y badge en español: «Operativa» (gris), «En reparación» (rojo), «De baja» (contorno) | La que no se puede usar mientras tanto salta a la vista |
| «Asignada a» muestra el nombre, o «En el almacén» en gris | Es la pregunta de todos los días: dónde está |
| En el formulario, quien la tiene se elige con `ComboboxField` contra `GET /users?search&isActive=true`, con «Dejarla en el almacén» para quitarlo | Solo activos, como exige la API. `/users` es solo de `ADMIN`, igual que el formulario |
| Al pasar el estado a «En reparación» o «De baja», el campo de asignación se vacía y se bloquea, con la explicación; lo que se manda a la API lleva `assignedToId: null` | La API la devuelve sola al almacén, y rechaza pedir que quede asignada: el formulario no deja armar ese pedido |
| «Asignar» deshabilitado si no está operativa; «Eliminar» deshabilitado si alguien la tiene | Lo que la API rechaza solo para un registro se deshabilita en ese registro (regla de la skill). El 409 del borrado lo cubre el flujo contra la API |
| «Devolver al almacén» sin diálogo; si la API la rechaza, el motivo sale en un aviso (`toast.error`) | No pide nada más que confirmar; un diálogo sería un paso de más |
| El filtro por persona (`DataTableComboboxFilter` sobre el personal) solo lo ve `ADMIN`; al mecánico, un botón «Mis herramientas» con su `session.userId` | El mecánico no puede listar el personal (403). La ruta solo precarga el nombre del filtro para `ADMIN` |
| El filtro por persona ofrece también a los inactivos | Pueden tener aún herramientas que no devolvieron |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por código, nombre y marca; filtros por estado, persona
> y ubicación; orden por código (por defecto), nombre o estado.

## Avance

- [x] `clearLabel` en `ComboboxField`.
- [x] En `users`: `getUser`, `usersQueries.detail` y `.options`, `userOption`
  con su test.
- [x] Módulo `inventory/tools` (server functions, consultas, esquemas con su
  test —13 casos—, tabla y diálogos) y su ruta; «Herramientas» en el menú
  para los dos roles, con su test.
- [x] Tipos de la API regenerados sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega `/tools`.
- [x] Prueba en navegador contra una **API simulada en memoria**
  (`tools-mock-api.mjs`, con las mismas reglas que `ToolsService`): 34 de 34
  comprobaciones (menú, estados en español, búsqueda, cada filtro, «Limpiar»,
  orden, alta con validación y asignación, 409 del código repetido, acciones
  rápidas, edición a reparación, borrado, vista del mecánico y «Mis
  herramientas») y la consola limpia. No reemplaza la prueba real.
- [ ] Prueba en navegador contra la API real (`tools-browser.mjs`): no se pudo
  correr, Postgres local no acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
