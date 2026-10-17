# CHANGELOG

Qué se cambió, quién lo cambió y dónde mirarlo en detalle. Lo escribe quien hace
el cambio, **antes de abrir el Pull Request**.

No reemplaza a `git log`: lo traduce. El historial dice qué líneas cambiaron;
esto dice qué pasó y qué hay que mirar antes de desplegar.

## Cómo se escribe una entrada

Lo más nuevo arriba. Una sección por día, y dentro una entrada por cambio:

```markdown
## 2026-09-15

### Título corto de lo que se hizo — Nombre · HH:MM
PR [#12](../../pull/12) · commits [`abc1234`](../../commit/abc1234)

Dos o tres líneas: qué cambió y por qué. En castellano, sin jerga.

> **IMPORTANTE** — Lo que quien despliega o revisa tiene que saber sí o sí.
```

Los enlaces son relativos al propio repositorio (`../../pull/12`,
`../../commit/abc1234`), así no hay que reescribirlos si el repositorio cambia de
nombre, de organización o de servidor.

Reglas:

- **Conciso.** Dos o tres líneas. El detalle está en el PR y en los commits, y
  para eso se enlazan.
- **Enlaza los commits**, no solo el PR: es lo que permite revisar a fondo sin
  reconstruir nada.
- **Hora local del equipo.** Sirve para cruzar una entrada con un incidente.
- **`IMPORTANTE` solo cuando lo es.** Si todo es importante, nada lo es.

### Cuándo marcar IMPORTANTE

- Una **variable de entorno** nueva, renombrada o eliminada.
- Un **cambio de flujo**: algo que se hacía de una manera y ahora se hace de
  otra.
- Algo que hay que **configurar fuera del repositorio** —un servicio externo, un
  proveedor, una cuenta— para que funcione.
- Un cambio que exige una **versión nueva del backend** para funcionar.
- Un **borrado** o una reversión.


---

## 2026-10-16

### Tema visual del preset de shadcn — Eduardo Huarcaya · 23:55
commits [`acf8f07`](../../commit/acf8f07)

Nuevo tema con el preset `b5AxWq7dEu`: estilo `radix-nova`, color base
neutral con el primario en azul índigo, Inter para el texto y Noto Serif para
los títulos. Se regeneraron los componentes de `components/ui/` y se quitó la
importación de Fraunces y Manrope, que no se usaban.

> **IMPORTANTE** — Dependencia nueva `@fontsource-variable/noto-serif`
> (instalada por el preset): correr `pnpm install`.

### Funcionalidades por rol — Eduardo Huarcaya · 23:30
commits [`f1b20d2`](../../commit/f1b20d2)

Dos README en `docs/roles/` con lo que el administrador y el mecánico ven y
pueden hacer hoy, pantalla por pantalla, lo que todavía no existe y las
observaciones del análisis para decidir.

### Presupuestos en el detalle de la orden — Eduardo Huarcaya · 23:30
commits [`00b6685`](../../commit/00b6685)

Sección «Presupuestos» en el detalle de la orden: historial de versiones con
sus ítems congelados y la respuesta del cliente; «Enviar presupuesto» y
«Registrar respuesta del cliente» para `ADMIN`; aviso en la cabecera mientras
la orden espera aprobación. Validado contra la API real.

> **IMPORTANTE** — Necesita el backend con presupuestos (`35f6e2c`): los tipos
> de `api.gen.ts` ya incluyen `quotes` en el detalle de la orden.

## 2026-10-04

### Servicios y repuestos en el detalle de la orden — Eduardo Huarcaya · 22:30
commits [`4eed703`](../../commit/4eed703) · [`ebde910`](../../commit/ebde910)

Sección «Servicios y repuestos» en el detalle de la orden: tabla con
subtotales, mano de obra, repuestos y total (costo y margen solo para
`ADMIN`); agregar servicio o repuesto con precio sugerido y stock a la vista,
editar y quitar (el repuesto vuelve al stock), mientras la orden se diagnostica
o se repara. Columna «Total» en el listado. Una orden lista para recoger ya
muestra «Cancelar orden».

> **IMPORTANTE** — Necesita el backend del PR `feature/items-orden`
> (`/work-orders/:workOrderId/items`, `total`, `items` y `totals`). Probado en
> navegador solo contra una API simulada: Postgres local no acepta conexiones.

### Pantallas de órdenes de trabajo — Eduardo Huarcaya · 21:55
commits [`566edf3`](../../commit/566edf3) · [`e6cd491`](../../commit/e6cd491)

Listado «Órdenes de trabajo» (`/workshop/work-orders`, primero en «Taller»;
«Mis órdenes» para el mecánico) con búsqueda, estados, mecánico, vencidas y
días de ingreso, y la primera página de detalle (`$workOrderId`): datos del
ingreso, diagnóstico, botones de estado según el rol, línea de tiempo con notas
públicas e internas, edición, asignación y borrado. «Ver órdenes» desde
Vehículos y Clientes.

> **IMPORTANTE** — Necesita el backend del PR `feature/ordenes-trabajo`
> (`/work-orders`). Probado en navegador solo contra una API simulada: Postgres
> local no acepta conexiones.

### Pantalla de herramientas — Eduardo Huarcaya · 21:10
commits [`61d064e`](../../commit/61d064e)

Pantalla «Herramientas» (`/inventory/tools`, sección «Inventario»): búsqueda
por código, nombre y marca, filtros por estado, ubicación y persona; alta,
edición, borrado y, desde cada fila, «Asignar» y «Devolver al almacén» para el
administrador. El mecánico la ve en solo lectura, con «Mis herramientas».
Estados en español con badge. `ComboboxField` acepta `clearLabel`.

> **IMPORTANTE** — Necesita el backend del PR `feature/herramientas`
> (`/tools`). Probado en navegador solo contra una API simulada: Postgres
> local no acepta conexiones.

### Pantalla de movimientos de stock — Eduardo Huarcaya · 20:45
commits [`46d7dea`](../../commit/46d7dea) · [`045a0f9`](../../commit/045a0f9) · [`0998a68`](../../commit/0998a68)

Pantalla «Movimientos» (`/inventory/stock-movements`, sección «Inventario»):
el kardex con búsqueda, filtros por producto, tipo y rango de fechas, y
«Registrar compra» y «Registrar ajuste» para el administrador; el mecánico lo
ve en solo lectura y sin costo. Cantidades con signo y color. En Repuestos,
«Ver movimientos» y «Registrar compra» en cada fila. Nuevo filtro
`DataTableDateRangeFilter`.

> **IMPORTANTE** — Necesita el backend del PR `feature/movimientos-stock`
> (`/stock-movements`). Probado en navegador solo contra una API simulada:
> Postgres local no acepta conexiones.

### Pantalla de repuestos e insumos — Eduardo Huarcaya · 20:05
commits [`b027b58`](../../commit/b027b58) · [`d4d4935`](../../commit/d4d4935)

Pantalla «Repuestos e insumos» (`/inventory/products`, sección nueva
«Inventario»): búsqueda por código, nombre y marca, filtros por tipo, estado y
stock bajo, y alta, edición y borrado para el administrador; el mecánico la ve
en solo lectura y sin costo ni margen. Stock con su unidad («4.50 L») y badge
«Stock bajo». Nuevo campo `QuantityField`; el formulario no tiene stock.

> **IMPORTANTE** — Necesita el backend del PR `feature/repuestos`
> (`/products`). No se probó en navegador: Postgres local no acepta
> conexiones.

### Pantalla del catálogo de servicios — Eduardo Huarcaya · 19:50
commits [`3ad0ae6`](../../commit/3ad0ae6)

Pantalla «Catálogo de servicios» (`/workshop/service-catalog`, sección nueva
«Taller»): búsqueda, filtros por estado y rango de precio, orden por precio, y
alta, edición y borrado para el administrador; el mecánico la ve en solo
lectura. Precios con `formatMoney` («S/ 120.00») y el campo `MoneyField`.

> **IMPORTANTE** — Necesita el backend del PR `feature/catalogo-servicios`
> (`/service-catalog`). No se probó en navegador: Postgres local no acepta
> conexiones.

### Pantalla del personal — Eduardo Huarcaya · 19:35
commits [`885eddb`](../../commit/885eddb)

Pantalla «Personal» (`/core/users`, sección «Administración»): búsqueda,
filtros por rol y estado, orden por último ingreso, alta con contraseña y
confirmación, edición, «Cambiar contraseña» y borrado. En la fila del usuario de
la sesión no se ofrece borrarse, desactivarse ni quitarse el rol.

> **IMPORTANTE** — Necesita el backend del PR `feature/personal` (`/users`). Los
> tipos se regeneraron del backend compilado, sin base; no se probó en el
> navegador porque Postgres local no acepta conexiones.

### Pantalla de vehículos — Eduardo Huarcaya · 19:15
commits [`6935e4b`](../../commit/6935e4b) · [`c9fe91b`](../../commit/c9fe91b)

Pantalla de vehículos con búsqueda, filtros por cliente y marca, y alta,
edición y borrado. Nuevo `ComboboxField` (y `DataTableComboboxFilter`) para
elegir un registro buscándolo en la API. En Clientes, el número de vehículos
abre el listado filtrado por ese cliente.

> **IMPORTANTE** — Necesita el backend del PR `feature/vehiculos`
> (`/vehicles`). Los tipos de la API se regeneraron.

### Pantalla de clientes y listados en la API — Eduardo Huarcaya · 18:30

Pantalla de clientes con búsqueda, filtros, orden y paginación guardados en la
URL, y alta, edición y borrado en diálogos. `DataTable` pasa a paginar, buscar y
ordenar en la API, y el cliente de la API lee el formato `BaseResponseDto`.

> **IMPORTANTE** — Necesita el backend del PR `feature/clientes` (cambió el
> formato de todas las respuestas).

### Base del proyecto a partir de la plantilla — Eduardo Huarcaya · 12:10

Arranque de AutoFix Motors con la base técnica de un proyecto anterior, sin su
historial: TanStack Start como BFF sobre la API, login, layout con barra
lateral y menú filtrable por rol (`ADMIN`, `MECHANIC`). Se aplicó el preset de
shadcn `beEhwcwy` (estilo `radix-luma`, base `zinc`).

> **IMPORTANTE** — Necesita `API_URL` apuntando al backend de AutoFix Motors.
