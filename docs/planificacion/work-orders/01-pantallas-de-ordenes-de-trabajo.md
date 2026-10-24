# Pantallas de órdenes de trabajo

El listado `/workshop/work-orders` («Órdenes de trabajo», primero en la
sección «Taller») y el detalle `/workshop/work-orders/$workOrderId`, sobre la
API del plan `backend/docs/planificacion/work-orders/01-ordenes-de-trabajo.md`.
Es la primera pantalla de detalle de la app.

## Qué entra y qué no

- **Entra:** el listado con búsqueda, estados (varios a la vez, con el atajo
  «Abiertas»), mecánico (solo `ADMIN`), «Vencidas» y rango de días de ingreso,
  y orden por número, fecha prometida o ingreso; el alta en un diálogo
  (`ADMIN`) que lleva al detalle. El detalle: cabecera (OT-000123, código de
  seguimiento, estado, «Vencida»), vehículo, cliente con teléfono, mecánico,
  km, fechas, motivo, diagnóstico editable, botones de los cambios de estado
  que el rol puede usar (con un diálogo para la nota, y el motivo obligatorio
  al cancelar), línea de tiempo con lo público y lo interno, formulario de
  nota, y edición/asignación y borrado para `ADMIN`. El mecánico ve «Mis
  órdenes». «Ver órdenes» desde Vehículos (también el número de la columna
  «Órdenes») y desde Clientes.
- **No entra:** ítems, presupuestos, el seguimiento público, pagos, imprimir
  la constancia, el enlace de WhatsApp. Ninguna sección vacía para ellos.

## Decisiones

| Decisión | Por qué |
|---|---|
| Estados en español con un color cada uno: lo que espera a alguien de afuera (aprobación, repuestos) en ámbar o naranja, «Listo para recoger» en verde, lo cerrado apagado y «Cancelado» en rojo; «Vencida» como marca aparte y la fecha prometida en rojo | Se lee de un vistazo qué está trabado, qué está listo y qué se pasó de fecha |
| Los botones de estado salen de `allowedTransitions(estado, rol)`, **una copia de la tabla de la API** en `work-orders.schemas.ts`, con el mismo test par por par que el backend | Lo que el usuario no puede hacer no se le muestra; si las dos copias se separan, falla un test |
| El cambio de estado pide confirmación en un diálogo con una nota opcional y «Lo ve el cliente» encendido; al cancelar, el motivo es obligatorio y el aviso nace **interno** | El cambio de estado es lo que sigue el cliente; el motivo de una cancelación suele hablar de plata o del cliente |
| La nota del detalle nace **interna** | Que el cliente la vea es una decisión, no un descuido |
| El filtro de estado es un menú con casillas (`WorkOrderStatusFilter`, en el módulo) y el atajo «Abiertas»; en la URL es una lista, y a la API viaja separada por coma | Es el único listado con un filtro de varios valores; se generaliza a `components/data-table/` cuando aparezca un segundo |
| El alta elige el vehículo con `ComboboxField` sobre `GET /vehicles?search` (placa, marca y modelo, con el dueño debajo) y, al elegirlo, muestra «Cliente de la orden» con su documento | El cliente se congela del dueño actual: quien registra ve a nombre de quién queda |
| El mecánico se elige con `ComboboxField` sobre `/users?isActive=true`, opcional («Dejarla sin asignar») | Como exige la API: solo activos |
| La edición y la asignación son un solo diálogo («Editar o asignar», en el menú «⋯» del detalle), deshabilitado en una orden cerrada; la fecha prometida que ya tenía se puede dejar aunque haya pasado | La API no edita una orden cerrada, y deja una vencida sin moverle la fecha |
| Una orden que no existe, o que es de otro mecánico, muestra «No se encontró la orden de trabajo» con un 404 (`notFound()` desde la server function), no la pantalla de error | La API responde 404 a los dos casos para no revelar la orden; tampoco es una falla que haya que reintentar |
| Breadcrumb del detalle: «Taller › Órdenes de trabajo › Detalle», derivado del menú (`breadcrumbFor` reconoce un parámetro debajo de un módulo) | El breadcrumb sigue saliendo de `navigation.ts`, sin declararlo en la ruta |
| Los filtros por vehículo o cliente que llegan desde «Ver órdenes» se muestran como un botón «Vehículo: ABK582 ✕» que los quita | Se llega a ellos desde el registro, no se eligen en el listado |
| `TextareaField` y `SwitchField` aceptan un `id` propio | El detalle tiene dos formularios con un campo `note` (la nota y el diálogo de estado): con el mismo id, la etiqueta del diálogo apuntaba al campo de atrás |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por número, placa, cliente y código de seguimiento;
> filtros por estados, mecánico (solo `ADMIN`), vencidas, días de ingreso, y
> vehículo o cliente desde «Ver órdenes»; orden por ingreso (por defecto, lo
> más reciente primero), fecha prometida o número.

## Avance

- [x] En `vehicles`: `getVehicle`, `vehiclesQueries.detail` y `.options`,
  `vehicleOption` con su test.
- [x] `limaToday()` en `lib/dates.ts`; `id` opcional en `TextareaField` y
  `SwitchField`; `breadcrumbFor` con el detalle de un módulo, con su test.
- [x] Módulo `workshop/work-orders` (server functions, consultas, esquemas con
  su test —147 casos, la mayoría la tabla de transiciones—, tabla, filtro de
  estados, diálogos, detalle y línea de tiempo) y sus dos rutas; «Órdenes de
  trabajo» primero en «Taller» para los dos roles; «Ver órdenes» en Vehículos
  y Clientes.
- [x] Tipos de la API regenerados sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega `/work-orders`.
- [x] Prueba en navegador contra una **API simulada en memoria**
  (`work-orders-mock-api.mjs`, con las mismas reglas que `WorkOrdersService`):
  53 de 53 comprobaciones (menú, estados en español, búsqueda por placa,
  número y código, cada filtro, «Limpiar», orden, alta con validación y 409,
  detalle, diagnóstico, cambios de estado, nota interna, reasignación, vista y
  botones del mecánico, orden ajena «no encontrada», entrega, cancelación,
  borrado y su 409, «Ver órdenes» desde Vehículos y Clientes) y la consola
  limpia. No reemplaza la prueba real.
- [ ] Prueba en navegador contra la API real (`work-orders-browser.mjs`): no
  se pudo correr, Postgres local no acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
