# Alcance del MVP — pantallas

El alcance completo —módulos, estados de la orden de trabajo, roles, decisiones y
exclusiones— está en el backend:
`backend/docs/planificacion/hoja-de-ruta/01-alcance-del-mvp.md`. El vocabulario,
en `backend/docs/planificacion/convenciones/01-glosario.md`. Aquí va lo que toca
al frontend: qué pantallas hay, dónde viven y quién las ve.

## Pantallas con sesión (`routes/_app/`)

| Sección del menú | Pantalla | Ruta | Rol |
|---|---|---|---|
| — | Inicio (dashboard) | `/` | Todos; los ingresos del mes solo `ADMIN` |
| Taller | Órdenes de trabajo | `/services/work-orders` | `ADMIN` ve todas; `MECHANIC` solo las suyas |
| Taller | Detalle de una OT | `/services/work-orders/$workOrderId` | Ídem |
| Taller | Catálogo de servicios | `/services/service-catalog` | `ADMIN` |
| Clientes | Clientes | `/customers/customers` | `ADMIN` |
| Clientes | Vehículos | `/customers/vehicles` | `ADMIN` |
| Inventario | Repuestos e insumos | `/inventory/products` | Todos; costo y margen solo `ADMIN` |
| Inventario | Movimientos | `/inventory/stock-movements` | `ADMIN` |
| Inventario | Herramientas | `/inventory/tools` | Todos (consulta); `ADMIN` edita |
| Finanzas | Pagos | `/finance/payments` | `ADMIN` |
| Finanzas | Reportes | `/finance/reports` | `ADMIN` |
| Administración | Personal | `/core/users` | `ADMIN` |

El menú se arma en `components/layout/navigation.ts` con `roles` por ítem: a un
mecánico no le aparece lo que no puede abrir. Ocultarlo es experiencia, no
seguridad: la API lo vuelve a comprobar con `@Roles()`.

### El detalle de la OT, la pantalla más usada

- Cabecera: código de seguimiento, cliente, vehículo, estado, mecánico, fecha
  prometida. Botones **Copiar enlace de seguimiento** y **Enviar por WhatsApp**
  (`wa.me` con el texto prellenado).
- Línea de tiempo con los cambios de estado y sus notas, marcando cuáles ve el
  cliente.
- Ítems (servicios y repuestos) y presupuestos con sus versiones. El
  `ADMIN` registra la decisión del cliente (aprobado o rechazado, canal y nota).
- Pagos y saldo pendiente (solo `ADMIN`).
- Constancia de ingreso imprimible, con el código de seguimiento.

## Pantalla pública (sin sesión)

| Pantalla | Ruta |
|---|---|
| Buscar por código | `/seguimiento` |
| Seguimiento de una OT | `/seguimiento/$trackingCode` |

- Fuera de `_app/`: no exige sesión ni muestra la barra lateral. Como `login.tsx`,
  es una ruta suelta.
- **Solo informa**, no tiene acciones: estado actual, línea de tiempo con las
  notas públicas, fecha prometida y el presupuesto vigente (solo lectura).
- Placa enmascarada y sin datos personales del cliente.
- La ruta va en español (`/seguimiento`) porque es la URL que el cliente ve y
  comparte; las rutas internas siguen en inglés.

## Hoja de ruta

Cada fase tiene su plan detallado en `docs/planificacion/<módulo>/` y su rama
`feature/...` con PR, en paralelo con la misma fase del backend.

- [ ] **Fase 1 — Personal, clientes y vehículos.**
- [ ] **Fase 2 — Servicios.** Catálogo, órdenes de trabajo y su detalle,
  presupuestos.
- [ ] **Fase 3 — Seguimiento público.**
- [ ] **Fase 4 — Inventario.**
- [ ] **Fase 5 — Ingresos.** Pagos, reportes y dashboard de inicio.
