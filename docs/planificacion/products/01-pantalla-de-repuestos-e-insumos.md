# Pantalla de repuestos e insumos

La pantalla de `/inventory/products`, sobre la API del plan
`backend/docs/planificacion/products/01-repuestos-e-insumos.md`. Es la primera
del grupo `inventory` y sigue el patrón de la del catálogo de servicios.

## Qué entra y qué no

- **Entra:** listado con búsqueda, filtros por tipo, estado y stock, orden por
  nombre, código, stock o precio; alta, edición y borrado en diálogos para
  `ADMIN`; el mismo listado en solo lectura y **sin las columnas de costo y
  margen** para `MECHANIC`. La sección nueva «Inventario» del menú (icono
  `PackageIcon`) con «Repuestos e insumos». `QuantityField`
  (`components/form/`) y `formatQuantity` / `quantitySchema`
  (`lib/quantity.ts`), que reusarán los movimientos y las órdenes.
- **No entra:** registrar compras ni ajustes (pantalla «Movimientos», módulo
  5), el kardex de un producto, página de detalle, exportar, el aviso de stock
  bajo en el inicio (llega con el dashboard).

## Decisiones

| Decisión | Por qué |
|---|---|
| El mecánico ve el listado sin «Nuevo producto», sin acciones por fila y sin las columnas «Costo» y «Margen» | Alcance del MVP: no ve costos ni márgenes. La API tampoco se los manda; la pantalla solo deja de pintar columnas vacías |
| El formulario no tiene stock. En el alta dice que el producto empieza en 0 y que el stock entra con una compra en «Movimientos»; en la edición, que solo lo cambian los movimientos | El stock es la suma del kardex: la API no lo acepta en el cuerpo |
| Stock con su unidad: «12 und», «4.50 L», «2 gal», «1 kit», «15.25 m». Sin decimales si es entero, con dos si tiene fracción; miles con coma | Como lo diría alguien en el almacén: nadie tiene «12.00» filtros, pero los litros sí se fraccionan. Las abreviaturas viven en `UNIT_OF_MEASURE_SYMBOLS` |
| Debajo del stock, el mínimo («Mín. 4 und»), y un badge rojo «Stock bajo» cuando `isLowStock` | La alerta del alcance, a la vista sin abrir nada |
| El margen negativo (precio menor que el costo) sale en rojo | La API lo acepta (decisión a validar); que al menos salte a la vista |
| `QuantityField`: texto con teclado numérico, la coma se toma como punto, y la unidad elegida a la derecha («L») | Igual que `MoneyField`: conserva «4.50» tal como lo manda la API |
| Las reglas de los decimales (`lib/decimal.ts`) y el esquema Zod de un monto (`moneySchema`) se comparten | Montos y cantidades validan igual que `IsMoney` e `IsQuantity` del backend, con sus propios mensajes; el catálogo pasa a usar `moneySchema` |
| Filtro «Stock»: «Stock bajo» (`lowStock=true`) y «Stock suficiente» (`false`) | Mientras no haya movimientos, todo está en 0: «Stock suficiente» sale vacío |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por código, nombre y marca; filtros por tipo, estado y
> stock bajo.

## Avance

- [x] `lib/decimal.ts` (reglas y agrupado de miles), `lib/money.ts` sobre él
  con `moneySchema`, y `lib/quantity.ts` con su test.
- [x] `QuantityField` en `components/form/`, registrado en `useAppForm`.
- [x] Módulo `inventory/products` (server functions, consultas, esquemas con
  su test, tabla y diálogos) y su ruta.
- [x] Sección «Inventario» en el menú, con su test por rol.
- [x] Tipos de la API regenerados. Sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega `/products`.
- [ ] Prueba en navegador real: búsqueda, filtros, «Limpiar», orden, alta,
  edición, borrado, el 409 y la vista del mecánico, con la consola limpia. El
  script está escrito (`products-browser.mjs`) pero no se pudo correr:
  Postgres local no acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
