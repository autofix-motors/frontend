# Pantalla de movimientos de stock

La pantalla de `/inventory/stock-movements` («Movimientos», en la sección
«Inventario»), sobre la API del plan
`backend/docs/planificacion/stock-movements/01-movimientos-de-stock.md`.

## Qué entra y qué no

- **Entra:** el kardex con búsqueda, filtros por producto, tipo y rango de
  fechas, orden por fecha (por defecto, lo más reciente primero) o cantidad;
  «Registrar compra» y «Registrar ajuste» en diálogos para `ADMIN`; el mismo
  listado en solo lectura y **sin la columna de costo** para `MECHANIC`. En
  Repuestos, el menú de cada fila suma «Ver movimientos» (los dos roles) y
  «Registrar compra» (`ADMIN`, deshabilitado si el producto está inactivo).
  Nuevos: `DataTableDateRangeFilter` (`components/data-table/`),
  `movementQuantitySchema` (`lib/quantity.ts`) e `isDateOnly`
  (`lib/dates.ts`); en `products`, `productsQueries.detail` y `.options` y
  `productOption`.
- **No entra:** los consumos en órdenes (se ven en el kardex cuando existan,
  pero los genera la orden, módulo 8), editar o borrar un movimiento, el saldo
  por fila, una página de detalle del movimiento o del kardex de un producto,
  exportar.

## Decisiones

| Decisión | Por qué |
|---|---|
| Cantidad con signo siempre y con la unidad («+12 und», «-2.50 L»): entrada en verde, salida en rojo | Que se lea de un vistazo qué entró y qué salió; el «+» evita leer una entrada como un saldo |
| El producto se elige con `ComboboxField` contra `GET /products?search&isActive=true`: «CÓDIGO · Nombre» y debajo «Stock: 4.50 L» | El stock actual es lo que se mira antes de comprar o ajustar. Solo activos: la API rechaza compras y ajustes de un inactivo |
| Al elegir el producto, la cantidad muestra su unidad y «Stock actual»; en la compra, además, «Costo actual» | Se lee del detalle del producto (`productsQueries.detail`), que se invalida después de cada movimiento |
| El ajuste explica el signo («Positiva suma al stock; negativa resta») y pide el motivo | La API no acepta un ajuste sin motivo ni de 0 |
| Desde el kardex filtrado por un producto activo, los dos diálogos lo proponen ya elegido; desde Repuestos, «Registrar compra» abre con el producto de la fila | Menos pasos para el caso de todos los días |
| Si la API rechaza (stock insuficiente, producto inactivo), el diálogo queda abierto con el mensaje y el error no se relanza | Sin eso, `handleSubmit` deja una promesa rechazada sin capturar y la consola marca un error |
| Después de un movimiento se invalidan el kardex y los productos | El stock (y en una compra, el costo) cambió en Repuestos y en las opciones del combobox |
| `DataTableDateRangeFilter`: «Del [día] al [día]» con el selector nativo, valores `AAAA-MM-DD` sin pasar por `Date`; espera 400 ms; un «del» posterior al «al» se marca en rojo y no se aplica | Reutilizable en cualquier listado con fechas (órdenes, pagos). El selector cambia su valor con cada dígito del año, por eso la espera |
| El filtro por producto muestra todos los productos, también los inactivos | Su kardex sigue ahí |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por código o nombre del producto y nota; filtros por
> tipo, producto y rango de fechas (días de Lima, «al» inclusivo).

## Avance

- [x] `movementQuantitySchema` (con `decimalError` aceptando el signo) e
  `isDateOnly`, con sus tests.
- [x] `DataTableDateRangeFilter` en `components/data-table/`.
- [x] En `products`: `getProduct`, `productsQueries.detail` y `.options`,
  `productOption` con su test; «Ver movimientos» y «Registrar compra» en el
  menú de cada fila.
- [x] Módulo `inventory/stock-movements` (server functions, consultas,
  esquemas con su test, tabla y diálogos) y su ruta; «Movimientos» en el menú
  para los dos roles, con su test.
- [x] Tipos de la API regenerados sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega
  `/stock-movements`.
- [x] Prueba en navegador contra una **API simulada en memoria**
  (`mock-api.mjs`): 29 de 29 comprobaciones (registro, validaciones, 409 en el
  diálogo, búsqueda, cada filtro, «Limpiar», orden, desde Repuestos, vista del
  mecánico) y la consola sin errores propios de esta pantalla. No reemplaza la
  prueba real.
- [ ] Prueba en navegador contra la API real (`stock-movements-browser.mjs`):
  no se pudo correr, Postgres local no acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
