# Portal del cliente

Las pantallas del portal, sobre la API del plan
`backend/docs/planificacion/portal/01-portal-del-cliente.md`. Reemplaza el
`/seguimiento` público por código del alcance original: el cliente entra con su
cuenta (módulo A, `auth/01-…`).

## Qué entra y qué no

- **Entra:** `/portal` (lo que espera su respuesta y lo que está en el taller),
  `/portal/work-orders` (pestañas «En curso» y «Anteriores», filtro por
  vehículo, paginación), `/portal/work-orders/$workOrderId` (detalle con
  presupuestos, servicios y repuestos, avance, datos, motivo y diagnóstico),
  `/portal/vehicles`, y aprobar o rechazar el presupuesto con una nota. Del
  lado del personal: el canal «Portal del cliente» y el autor «El cliente
  (portal)».
- **No entra:** gráficos del inicio (módulo C), pagos, editar sus datos.

## Decisiones

| Decisión | Por qué |
|---|---|
| Módulo `modules/workshop/portal/` con sus propios tipos (`PortalWorkOrder`, `PortalWorkOrderDetail`…) del OpenAPI; reutiliza del módulo de órdenes solo lo visual sin datos del personal (`WorkOrderStatusBadge`, etiquetas de estado y canal, `formatItemQuantity`) | Lo que ve el cliente lo define su propio contrato |
| Cabecera propia (`PortalHeader`) con Inicio · Mis órdenes · Mis vehículos, y la cuenta (contraseña, salir) como íconos en el celular | El cliente entra desde el teléfono, por el enlace del WhatsApp |
| El aviso ámbar del presupuesto pendiente va arriba del detalle con «Aprobar» y «Rechazar»; el diálogo confirma con una nota opcional y dice qué pasa después | Es lo que el cliente vino a hacer |
| Pestaña, vehículo y página en la URL (`portalWorkOrdersSearchSchema`, con `.catch`); «Mis vehículos» enlaza a las órdenes filtradas | Se puede recargar y volver atrás |
| La orden ajena es «no encontrada» (`notFound()` + `PortalWorkOrderNotFound`) | La API responde 404 y no se revela que existe |
| La línea de tiempo del cliente va de la más reciente a la más antigua y sin autor | Viene a ver qué pasó último; quién lo hizo no le importa |
| Al responder, la orden devuelta va a la caché del detalle y se refrescan las listas | Su estado y el aviso cambian al instante |

## Avance

- [x] Esquemas (búsqueda, `pendingQuote`, decisión) con su test.
- [x] Server functions y consultas (`portal.fn.ts`, `portal.queries.ts`).
- [x] Componentes y rutas del portal; cabecera con navegación.
- [x] Personal: canal «Portal del cliente» y autor «El cliente (portal)», con test.
- [x] Tipos regenerados desde el backend de prueba; typecheck, lint y 329
  tests en verde.
- [x] Validado por quien dirige el proyecto (2026-10-24).
