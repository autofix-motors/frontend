# Administrador (`ADMIN`)

Quien lleva el taller: da de alta al personal, registra clientes, vehículos y
órdenes, fija precios, controla el inventario y registra la respuesta del
cliente a cada presupuesto. Ve todo, incluidos costos y márgenes.

> **Base de este documento.** Lo construido en la rama `feature/presupuestos`
> de backend y frontend al 2026-10-16. En `main` todavía solo están el inicio
> de sesión y el modelo de datos: estas funciones llegan a `main` cuando se
> fusionen sus PR.

## 1. Menú

| Sección | Pantalla | Ruta |
|---|---|---|
| — | Inicio | `/` |
| Taller | Órdenes de trabajo | `/workshop/work-orders` |
| Taller | Catálogo de servicios | `/workshop/service-catalog` |
| Clientes | Clientes | `/customer/customers` |
| Clientes | Vehículos | `/customer/vehicles` |
| Inventario | Repuestos e insumos | `/inventory/products` |
| Inventario | Movimientos | `/inventory/stock-movements` |
| Inventario | Herramientas | `/inventory/tools` |
| Administración | Personal | `/core/users` |

Al pie del menú: su nombre, correo, el rol «Administrador» y «Cerrar sesión».

## 2. Qué puede hacer

### Inicio
Un saludo («Hola, {nombre}»). Todavía no hay indicadores.

### Personal
- **Listado** con nombre y correo, teléfono, rol, órdenes asignadas, estado,
  último ingreso y fecha de registro. Busca por nombre o correo; filtra por rol
  y estado.
- **«Nuevo usuario»**: nombre, correo, teléfono (opcional), rol y contraseña
  (mínimo 8 caracteres).
- **Editar**: datos, rol y si está activo.
- **Cambiar contraseña** de cualquiera, incluida la suya. Cierra las sesiones
  de esa persona.
- **Eliminar**, solo si el usuario no tiene historial (órdenes, notas,
  presupuestos, movimientos, herramientas). Si lo tiene, se desactiva.

Límites, para que el taller no se quede sin administrador:
- No puede eliminarse, desactivarse ni cambiarse el rol a sí mismo.
- Siempre tiene que quedar al menos un `ADMIN` activo.

### Clientes
- **Listado** con documento, nombre, teléfono, correo, número de vehículos,
  estado y registro. Busca por nombre o documento; filtra por tipo de
  documento (DNI, RUC, CE, pasaporte) y estado.
- **Crear y editar**: tipo y número de documento (no se repiten), nombre o
  razón social, teléfono, y correo, dirección y notas opcionales.
- **«Ver órdenes»** del cliente y enlace a sus vehículos.
- **Eliminar** solo si no tiene vehículos ni órdenes.

### Vehículos
- **Listado** con placa, marca y modelo (año y color), cliente, VIN y número de
  órdenes. Busca por placa, marca, modelo o cliente; filtra por cliente y por
  marca.
- **Crear y editar**: cliente (tiene que estar activo), placa y VIN únicos,
  marca, modelo, y año, color y notas opcionales.
- **«Ver órdenes»** del vehículo.
- **Eliminar** solo si no tiene órdenes.

### Catálogo de servicios
- **Listado** con servicio, descripción, precio de mano de obra y estado.
  Busca por nombre o descripción; filtra por estado y rango de precio.
- **Crear, editar y eliminar**. Un servicio que ya se usó en una orden no se
  elimina: se desactiva.

### Órdenes de trabajo

**Listado («Órdenes de trabajo»)**: todas las órdenes del taller.
- Columnas: orden y código de seguimiento, vehículo, cliente y teléfono,
  estado (con aviso de vencida), motivo, mecánico, fecha prometida, ingreso y
  total.
- Busca por número, placa, cliente o código de seguimiento.
- Filtra por estado (con el atajo «Abiertas»), mecánico, «Vencidas» y rango de
  fechas de ingreso.

**«Nueva orden»**: vehículo, kilometraje, motivo, y fecha prometida y mecánico
opcionales.
- El dueño del vehículo tiene que estar activo.
- Un vehículo no puede tener dos órdenes abiertas.
- La fecha prometida no puede ser anterior a hoy.
- La orden nace en «Recibido» con su código de seguimiento (ej. `AFM-7K3Q9X`).

**Detalle de la orden**
- **Cambiar de estado** con los botones de la cabecera. Cada cambio admite una
  nota y se marca si «Lo ve el cliente».

  | Desde | Puede pasar a |
  |---|---|
  | Recibido | En diagnóstico, En reparación, Cancelado |
  | En diagnóstico | En reparación, Cancelado |
  | Esperando aprobación | Cancelado (lo demás lo mueve el presupuesto) |
  | En reparación | Esperando repuestos, Listo para recoger, Cancelado |
  | Esperando repuestos | En reparación, Cancelado |
  | Listo para recoger | Entregado, En reparación (retrabajo), Cancelado |
  | Entregado / Cancelado | Ninguno: la orden está cerrada |

  **Entregar y cancelar son solo del administrador.** Cancelar pide el motivo.
- **«Editar o asignar»**: kilometraje, fecha prometida, motivo y mecánico. El
  vehículo no se cambia. No se edita una orden cerrada. Cambiar el mecánico
  queda como nota interna.
- **Eliminar**: para la orden registrada por error. Si ya tiene ítems o
  presupuestos, se cancela en vez de eliminarse.
- **Diagnóstico**: escribirlo o editarlo en «Recibido», «En diagnóstico», «En
  reparación» o «Esperando repuestos».
- **Notas** en la línea de tiempo, públicas («Lo ve el cliente») o internas.
- **Servicios y repuestos**, en «Recibido», «En diagnóstico», «En reparación» o
  «Esperando repuestos»:
  - Agregar un servicio del catálogo o un repuesto. El precio y la descripción
    vienen prellenados y el administrador los puede ajustar; al elegir un
    repuesto ve su costo.
  - El repuesto **descuenta el stock al agregarse** y lo devuelve al quitarse.
    Sin stock suficiente no se agrega.
  - Editar precio y descripción de cualquier ítem; la cantidad, solo en
    servicios (un repuesto se quita y se vuelve a agregar).
  - Ve los totales (mano de obra, repuestos, total) y **el costo y el margen
    de los repuestos**.
- **Presupuestos**:
  - **«Enviar presupuesto»** en «En diagnóstico», «En reparación» o «Esperando
    repuestos», si la orden tiene ítems. Congela los ítems y el total en una
    versión nueva (v1, v2…), la orden pasa a «Esperando aprobación» y sus ítems
    quedan bloqueados. Admite una nota para el cliente.
  - **«Registrar respuesta del cliente»**: aprobado o rechazado (todo o nada),
    por dónde respondió (llamada, WhatsApp o en el taller) y una nota.
    Aprobado lleva la orden a «En reparación»; rechazado, de vuelta a «En
    diagnóstico».
  - Mientras una versión espera respuesta no se envía otra: para corregirla se
    registra el rechazo, se ajustan los ítems y se envía la siguiente. El
    historial muestra cada versión con su estado (Pendiente, Aprobado,
    Rechazado, Reemplazado), sus ítems, quién la envió y quién registró la
    respuesta.

### Repuestos e insumos
- **Listado** con código, producto y marca, tipo (repuesto o insumo), stock
  (con aviso de «Stock bajo»), **costo**, precio de venta, **margen** y estado.
  Busca por código, nombre o marca; filtra por tipo, estado y stock.
- **Crear y editar**: código único, nombre, tipo, unidad, marca, stock mínimo,
  costo y precio de venta. **El stock no se edita a mano**: solo lo mueven
  compras, ajustes y órdenes.
- **«Registrar compra»** y **«Ver movimientos»** desde cada producto.
- **Eliminar** solo si no tiene movimientos ni se usó en órdenes.

### Movimientos (kardex)
- **Listado** con fecha, producto, tipo (compra, orden de trabajo, ajuste),
  cantidad, **costo unitario**, nota y quién lo registró. Busca por producto o
  nota; filtra por producto, tipo y rango de fechas.
- **«Registrar compra»**: producto, cantidad, costo unitario y nota. **Actualiza
  el costo del producto.**
- **«Registrar ajuste»**: cantidad con signo y motivo obligatorio. No deja el
  stock en negativo.
- Un movimiento no se edita ni se elimina: un error se corrige con un ajuste.
  Los de tipo «orden de trabajo» los generan solo las órdenes.

### Herramientas
- **Listado** con código, herramienta y marca, estado (Operativa, En
  reparación, De baja), a quién está asignada y notas. Filtra por estado,
  ubicación (almacén o asignadas) y persona.
- **Crear y editar.**
- **Asignar o reasignar** a una persona activa, solo si la herramienta está
  operativa. **«Devolver al almacén»** con un clic.
- **Eliminar** solo si nadie la tiene.

## 3. Lo que todavía no existe

- **Inicio con indicadores**: órdenes abiertas por estado, listas para entregar,
  vencidas, ingresos del mes, stock bajo.
- **Pagos, reportes e ingresos** (Fase 5).
- **Seguimiento público** por código, «Enviar por WhatsApp» y la constancia
  imprimible (Fase 3).
- **«Mi cuenta»**: no hay una pantalla para cambiar la propia contraseña; el
  administrador lo hace desde Personal. Tampoco hay «olvidé mi contraseña».

## 4. Observaciones del análisis

Para decidir si se dejan así o se ajustan:

- **«Movimientos» está abierto al mecánico** (solo lectura y sin costos). El
  alcance del MVP lo marca solo para `ADMIN`.
- **El mecánico ve la nota de las compras.** Si ahí se anota proveedor o
  factura, también lo ve.
- **Desactivar a alguien o cambiarle el rol no corta su acceso al instante**:
  conserva el que tenía hasta unos 15 minutos, cuando vence su sesión.
- **Se pueden agregar notas a una orden entregada o cancelada**, en la pantalla
  y en la API.
- **El mecánico no puede cambiar su contraseña**: depende del administrador.
- **Las casillas de fases del alcance siguen sin marcar**, aunque las fases 1,
  2 y 4 ya están construidas.

---

Ver también: [Mecánico](../mecanico/README.md) ·
[Alcance del MVP](../../planificacion/hoja-de-ruta/01-alcance-del-mvp.md)
