# Servicios y repuestos en el detalle de la orden

La sección «Servicios y repuestos» del detalle `/workshop/work-orders/$workOrderId`
y la columna «Total» del listado, sobre la API del plan
`backend/docs/planificacion/work-orders/02-servicios-y-repuestos.md`. No hay
pantalla nueva: todo vive en el módulo `workshop/work-orders`.

## Qué entra y qué no

- **Entra:** la tabla de ítems (tipo, descripción, cantidad con su unidad en
  los repuestos, precio unitario y subtotal) con el pie de mano de obra,
  repuestos y total, y para `ADMIN` el costo y el margen de los repuestos;
  «Agregar servicio» y «Agregar repuesto» (diálogos con combobox), editar y
  quitar desde el menú de cada fila; la columna «Total» en el listado. En
  `service-catalog`: `getServiceCatalogItem`, `serviceCatalogQueries.detail` y
  `.options` (solo activos) y `serviceCatalogItemOption`.
- **No entra:** presupuestos, descuentos, impuestos, pagos ni saldo, reordenar
  ítems, cambiar la cantidad de un repuesto (se quita y se vuelve a agregar).

## Decisiones

| Decisión | Por qué |
|---|---|
| La sección va primera en la columna principal del detalle, antes del motivo y el diagnóstico | Es lo que más se toca mientras la orden está en el taller |
| Los botones de agregar y el menú de cada fila salen solo si `canChangeItems(estado)` (copia de `ITEM_STATUSES` de la API); fuera de esos estados, la tabla es de solo lectura y la descripción lo dice | Lo que la API rechazaría no se muestra |
| En un repuesto el mecánico solo ve «Quitar»; en un servicio, «Editar» (la cantidad) y «Quitar» (`canEditItem`). El administrador edita además precio y descripción | Como la API: precio y descripción son del administrador y la cantidad de un repuesto no se edita |
| Al elegir el servicio o el repuesto, el administrador ve **el precio y la descripción del original ya escritos** para ajustarlos (`listeners.onChange` del combobox con `queryClient.fetchQuery` del detalle); el mecánico no ve esos campos, solo «Precio: S/ …» debajo del combobox, y la API copia los del original | «Precio sugerido; ADMIN puede ajustarlo». Vacíos no viajan: la API usa los del original |
| El diálogo del repuesto muestra la unidad en la cantidad y «Stock disponible: 21 und»; el 409 «Stock insuficiente: quedan X de CÓDIGO» queda en el diálogo, que sigue abierto | Se mira el stock antes de pedir; si no alcanza, se corrige la cantidad sin volver a empezar |
| Quitar pide confirmación; si es un repuesto, dice «Su cantidad (2 und) vuelve al stock» | Que se entienda que el stock se mueve |
| Al agregar o quitar un repuesto se invalidan también Repuestos y el kardex | Su stock y sus movimientos cambiaron |
| Costo y margen en una línea debajo de la tabla, con el margen negativo en rojo, solo si la API los manda (`ADMIN`) | Un dato que la API no manda a un rol no tiene lugar en su pantalla |
| Montos con `formatMoney` y cantidades con `formatStock`/`formatQuantity` («2 und», «1.25 L», «1»), sin pasar por `number` | Los montos y cantidades llegan como texto con dos decimales |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** La sección no tiene
> búsqueda ni filtros (son los ítems de una orden, pocos). El combobox de
> servicios busca por nombre en `GET /service-catalog?isActive=true` y el de
> repuestos por código, nombre o marca en `GET /products?isActive=true`, 20
> por vez. «Total» del listado no se ordena ni se filtra.

## Avance

- [x] Copia de la tabla de estados con `READY → CANCELLED` y su test (commit
  aparte, «Cancelar orden» aparece en una orden lista).
- [x] `service-catalog`: detalle, opciones y `serviceCatalogItemOption`, con
  su test.
- [x] Esquemas de ítems (`canChangeItems`, `canEditItem`,
  `formatItemQuantity`, formularios de alta y edición, lo que se manda a la
  API) con su test; server functions y mutaciones; `WorkOrderItemsSection`,
  `AddItemDialog`, `EditItemDialog`, `RemoveItemDialog`; columna «Total».
- [x] Tipos de la API regenerados sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega lo de los
  ítems (y mueve de lugar el enum `UnitOfMeasure`, que ahora usa también la
  orden).
- [x] Prueba en navegador contra una **API simulada en memoria**
  (`work-order-items-mock-api.mjs`, con las reglas de
  `WorkOrderItemsService`): 27 de 27 comprobaciones (columna «Total»,
  sección vacía, alta de servicio con precio sugerido y ajustado, alta de
  repuesto con unidad y stock, cantidad 0, pie de totales, costo y margen,
  stock que baja, 409 sin stock en el diálogo, edición de la cantidad de un
  servicio, repuesto sin cantidad editable, quitar con aviso de stock y stock
  que vuelve, línea de tiempo, vista del mecánico sin precios ni costos, menú
  del mecánico en un repuesto, orden lista de solo lectura y «Cancelar
  orden») y la consola limpia. No reemplaza la prueba real.
- [ ] Prueba en navegador contra la API real
  (`work-order-items-browser.mjs`): no se pudo correr, Postgres local no
  acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
