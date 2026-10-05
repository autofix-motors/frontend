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

## 2026-10-04

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
