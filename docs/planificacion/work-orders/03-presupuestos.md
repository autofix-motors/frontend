# Presupuestos en el detalle de la orden

La sección «Presupuestos» del detalle `/workshop/work-orders/$workOrderId`, el
aviso de la orden que espera aprobación y los diálogos para enviar un
presupuesto y registrar la respuesta del cliente, sobre la API del plan
`backend/docs/planificacion/work-orders/03-presupuestos.md`. No hay pantalla
nueva: todo vive en el módulo `workshop/work-orders`.

## Qué entra y qué no

- **Entra:** el historial de versiones (número, estado, total, quién y cuándo
  la envió, la respuesta con su canal y nota) con los ítems congelados de cada
  una; «Enviar presupuesto» (`SendQuoteDialog`); «Registrar respuesta del
  cliente» (`DecideQuoteDialog`) desde la versión pendiente y desde el aviso de
  la cabecera; el aviso ámbar «Esperando la respuesta del cliente…».
- **No entra:** el presupuesto en la página pública de seguimiento (Fase 3),
  imprimirlo o enviarlo por WhatsApp, aprobar ítems sueltos, editar una
  versión enviada.

## Decisiones

| Decisión | Por qué |
|---|---|
| La sección va debajo de «Servicios y repuestos», en la columna principal | El presupuesto sale de esos ítems: se arma arriba y se envía abajo |
| «Enviar presupuesto» sale solo para `ADMIN` y si `canSendQuote(estado)` (copia de `SYSTEM_TRANSITIONS.QUOTE_SENT`: diagnóstico, reparación, esperando repuestos). Sin ítems, el botón no aparece y la descripción pide agregar uno | Lo que la API rechazaría no se muestra |
| El diálogo de envío muestra lo que se congela (descripción, cantidad, subtotal, total), una «Nota para el cliente (opcional)» y avisa que la orden pasa a «Esperando aprobación» con los ítems bloqueados | Que quede claro qué ve el cliente y qué deja de poder cambiarse |
| Mientras la orden espera aprobación, la cabecera muestra un aviso ámbar con la versión, el total y la fecha (`pendingQuote`). Lo ven los dos roles; el botón «Registrar respuesta del cliente», solo `ADMIN` | Es el estado en que la orden está detenida: el mecánico tiene que saber por qué no puede tocar los ítems |
| `pendingQuote` solo cuenta la versión `PENDING` si la orden está en «Esperando aprobación» | Una pendiente en una orden cancelada ya no se responde |
| En el diálogo de la respuesta, «El cliente» (Aprobado / Rechazado) y «Respondió por» (Llamada, WhatsApp, En el taller) **empiezan vacíos** y son obligatorios; debajo se muestra qué le pasa a la orden con cada opción | Quien registra elige lo que pasó, no acepta un valor por omisión. El efecto a la vista evita sorpresas |
| Cada versión se despliega para ver sus ítems; la más nueva va primero, con su estado en color (pendiente ámbar, aprobado verde, rechazado rojo, reemplazado gris) | Es la que importa; las anteriores quedan como historial |
| Enviar y registrar la respuesta ponen en caché el detalle que devuelve la API y refrescan el listado de órdenes (`onChanged`, como los demás cambios de la orden) | Cambian el estado de la orden, que la mueve entre los filtros del listado |

### Búsqueda y filtros

No hay: son las versiones de una orden, pocas.

## Avance

- [x] Esquemas (`Quote`, etiquetas y colores de estado, canales,
  `canSendQuote`, `pendingQuote`, formularios de envío y respuesta, lo que se
  manda a la API) con su test.
- [x] Server functions (`sendQuote`, `decideQuote`) y mutaciones
  (`useSendQuote`, `useDecideQuote`).
- [x] `WorkOrderQuotesSection`, `SendQuoteDialog`, `DecideQuoteDialog` y el
  aviso en `WorkOrderView`.
- [x] Tipos de la API regenerados: `api.gen.ts` suma `Quote`, `QuoteItem`,
  `QuoteStatus`, `QuoteDecision`, `DecisionChannel` y los dos endpoints.
- [x] Typecheck, lint y 308 tests en verde.
- [x] Validación de quien dirige el proyecto (2026-10-16), contra la API real
  en los puertos de prueba: envío, rechazo, nueva versión y aprobación, como
  administrador y como mecánico.
