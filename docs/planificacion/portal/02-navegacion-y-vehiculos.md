# Navegación del portal y vehículos paginados

La cabecera del portal (`01-portal-del-cliente.md`) quedó cargada: marca,
nombre, «Contraseña», «Salir» y tres enlaces en una fila que en el celular se
partía en dos. Quien dirige el proyecto pidió rediseñarla desde cero y paginar
«Mis vehículos» (API en `backend/docs/planificacion/portal/02-…`).

## Qué entra y qué no

- **Entra:** barra superior única en PC (marca · Inicio, Reparaciones,
  Vehículos · menú de cuenta); en el celular, marca y menú arriba y una barra
  inferior fija con las tres secciones; «Mis órdenes» pasa a «Reparaciones»;
  «Mis vehículos» con búsqueda y 9 por página.
- **No entra:** cambiar las URLs (`/portal/work-orders` sigue igual), el inicio
  con gráficos (módulo C).

## Decisiones

| Decisión | Por qué |
|---|---|
| Barra inferior en el celular, no menú hamburguesa | Decisión de quien dirige el proyecto: el cliente entra desde el teléfono y las tres secciones quedan al alcance del pulgar, siempre a la vista |
| Contraseña y salir dentro de un menú de cuenta (avatar con iniciales) | Se usan poco; ocupaban la mitad de la cabecera |
| Los enlaces se declaran una vez (`PORTAL_NAV`) y los usan las dos barras | Que PC y celular no se desalineen |
| «Reparaciones» en vez de «Mis órdenes» | Es la palabra del cliente; «orden de trabajo» es del taller |
| La búsqueda reutiliza `DataTableToolbar` (con su espera entre teclas) | Ya resuelve la búsqueda de todos los listados |
| `initials()` pasa a `lib/initials.ts` | La usan el menú del personal y el del portal |
| La placa del filtro de reparaciones sale de `GET /portal/vehicles/:vehicleId` | Con la lista paginada, el vehículo puede no estar en la primera página |
| Paginador compartido `PortalPager` | Las dos listas del portal paginan igual |

## Avance

- [x] Navegación: `PORTAL_NAV`, `PortalHeader` con menú de cuenta,
  `PortalBottomNav`, layout y textos.
- [x] Vehículos: esquema de búsqueda, server functions, consultas, ruta con
  búsqueda, `PortalPager`, filtro de reparaciones con `getMyVehicle`.
- [x] Tests de esquemas e `initials`; typecheck, lint y 335 tests en verde.
  Tipos regenerados desde 3101.
- [x] Validado por quien dirige el proyecto (2026-10-24).
