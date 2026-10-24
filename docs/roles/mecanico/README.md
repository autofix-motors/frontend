# Mecánico (`MECHANIC`)

Quien repara: trabaja solo las órdenes que el administrador le asigna, las
mueve de estado, escribe el diagnóstico y registra los servicios y repuestos
que usa. Consulta el catálogo, el stock y las herramientas, sin costos ni
márgenes.

> **Base de este documento.** Lo construido en la rama `feature/presupuestos`
> de backend y frontend al 2026-10-16. En `main` todavía solo están el inicio
> de sesión y el modelo de datos: estas funciones llegan a `main` cuando se
> fusionen sus PR.

## 1. Menú

| Sección | Pantalla | Ruta |
|---|---|---|
| — | Inicio | `/` |
| Taller | Órdenes de trabajo («Mis órdenes») | `/workshop/work-orders` |
| Taller | Catálogo de servicios | `/workshop/service-catalog` |
| Inventario | Repuestos e insumos | `/inventory/products` |
| Inventario | Movimientos | `/inventory/stock-movements` |
| Inventario | Herramientas | `/inventory/tools` |

No ve las secciones Clientes ni Administración. Si escribe esas rutas a mano,
vuelve al Inicio. Al pie del menú: su nombre, correo, el rol «Mecánico» y
«Cerrar sesión».

## 2. Qué puede hacer

### Inicio
Un saludo («Hola, {nombre}»). Todavía no hay indicadores.

### Mis órdenes

**Listado**: **solo las órdenes asignadas a él.** Si no tiene ninguna, ve «No
tienes órdenes asignadas».
- Columnas: orden y código de seguimiento, vehículo, cliente y teléfono,
  estado (con aviso de vencida), motivo, mecánico, fecha prometida, ingreso y
  total.
- Busca por número, placa, cliente o código de seguimiento.
- Filtra por estado (con el atajo «Abiertas»), «Vencidas» y rango de fechas de
  ingreso.
- No crea órdenes.

**Detalle de una orden suya.** Una orden de otro mecánico aparece como «no
encontrada».
- **Cambiar de estado**, solo hacia «En diagnóstico», «En reparación»,
  «Esperando repuestos» y «Listo para recoger»:

  | Desde | Puede pasar a |
  |---|---|
  | Recibido | En diagnóstico, En reparación |
  | En diagnóstico | En reparación |
  | En reparación | Esperando repuestos, Listo para recoger |
  | Esperando repuestos | En reparación |
  | Listo para recoger | En reparación (retrabajo) |
  | Esperando aprobación | Nada: espera la respuesta del cliente |

  **No entrega ni cancela**: eso es del administrador. Cada cambio admite una
  nota y se marca si «Lo ve el cliente».
- **Diagnóstico**: escribirlo o editarlo en «Recibido», «En diagnóstico», «En
  reparación» o «Esperando repuestos».
- **Notas** en la línea de tiempo, internas o **públicas** («Lo ve el
  cliente»). La nota nace interna.
- **Servicios y repuestos**, en «Recibido», «En diagnóstico», «En reparación» o
  «Esperando repuestos»:
  - **Agregar** un servicio del catálogo o un repuesto, eligiendo solo el ítem y
    la cantidad. Ve el precio y el stock disponible como referencia. **El
    precio y la descripción los pone el sistema**; ajustarlos es del
    administrador.
  - El repuesto **descuenta el stock al agregarse** y lo devuelve al quitarse.
    Sin stock suficiente no se agrega.
  - **Editar** solo la cantidad de un servicio.
  - **Quitar** cualquier ítem.
  - Ve precio unitario, subtotales y totales (mano de obra, repuestos, total).
- **Presupuestos**:
  - Ve todas las versiones con su estado, total, ítems y la respuesta del
    cliente.
  - Mientras la orden espera aprobación, ve el aviso «Esperando la respuesta
    del cliente…» con la versión y el monto. No puede tocar ítems ni
    diagnóstico hasta que haya respuesta.
  - **No envía presupuestos ni registra la respuesta del cliente**: eso es del
    administrador.

### Catálogo de servicios (solo lectura)
Servicio, descripción, precio de mano de obra y estado. Busca por nombre o
descripción; filtra por estado y rango de precio. Sirve para saber qué agregar
a una orden.

### Repuestos e insumos (solo lectura)
Código, producto y marca, tipo, stock (con aviso de «Stock bajo»), precio de
venta y estado. Busca y filtra por tipo, estado y stock. Desde cada producto,
«Ver movimientos».

### Movimientos (solo lectura)
El kardex: fecha, producto, tipo, cantidad, nota y quién lo registró. Filtra
por producto, tipo y fechas. No registra compras ni ajustes.

### Herramientas (solo lectura)
Todas las herramientas del taller, su estado y quién las tiene. Con el botón
**«Mis herramientas»** ve solo las que tiene asignadas. No las crea, edita ni
asigna.

## 3. Qué no ve o no puede hacer

| No puede | Por qué / quién lo hace |
|---|---|
| Ver órdenes de otros mecánicos | Solo ve las asignadas a él |
| Crear, editar, reasignar o eliminar órdenes | Administrador |
| Entregar o cancelar una orden | Administrador |
| Fijar el precio o la descripción de un ítem | Administrador; el mecánico usa el precio del catálogo o del producto |
| Cambiar la cantidad de un repuesto ya agregado | Nadie: se quita y se vuelve a agregar |
| Enviar presupuestos o registrar la respuesta del cliente | Administrador |
| Ver costos y márgenes (productos, kardex, repuestos de la orden) | La API no se los envía |
| Clientes, Vehículos y Personal | Administrador |
| Registrar compras, ajustes, productos, servicios o herramientas | Administrador |
| Cambiar su propia contraseña | No existe todavía; se la cambia el administrador |

Lo que **sí ve** aunque no gestione: precios de venta y totales, el nombre y
teléfono del cliente y los datos del vehículo dentro de sus órdenes, y las
notas internas de la línea de tiempo.

## 4. Lo que todavía no existe

- **Inicio con indicadores** de sus órdenes.
- **«Mi cuenta»** para cambiar su contraseña.
- **Seguimiento público** por código (Fase 3). Las notas que marca «Lo ve el
  cliente» ya quedan listas para cuando exista.

---

Ver también: [Administrador](../administrador/README.md) ·
[Alcance del MVP](../../planificacion/hoja-de-ruta/01-alcance-del-mvp.md)
