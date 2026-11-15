# Pantallas sobre la API en español

El backend pasó su dominio al español (plan
`backend/docs/planificacion/modelo/01-modelo-en-espanol.md`): campos, enums y el
JSON de la API. Aquí, el frontend se adapta.

## Decisiones

| Decisión | Por qué |
|---|---|
| Tipos, esquemas Zod, formularios, columnas y search params con los nombres de la API (`placa`, `estado`, `ordenarPor`, `sentido`) | Se mandan tal cual a la API; un solo nombre de punta a punta |
| Componentes, archivos, funciones, hooks y URL de pantalla en inglés (`WorkOrderTable`, `/workshop/work-orders/$workOrderId`) | Es estructura, no dominio |
| Mapas de etiquetas por valor de enum con las claves nuevas (`EN_REPARACION`, `ADMINISTRADOR`, `CLIENTE`); los textos visibles no cambian | El usuario ya leía todo en español |
| `DataTable` ordena con `{ ordenarPor, sentido }` | Son los parámetros de la API |

## Avance

- [x] Tipos regenerados desde la API en español (3101).
- [x] Sesión, menú, usuarios, clientes, vehículos e inventario.
- [x] Catálogo, órdenes, presupuestos y portal.
- [x] typecheck, lint, 335 pruebas y build en verde. Punta a punta contra la
  API: 24 de 24, con limpieza.
- [x] Validado por quien dirige el proyecto (2026-11-15).
- [x] Sin herramientas; panel de inicio, «Mi perfil», menú en azul pastel y
  detalle de la OT rediseñado (validado el 2026-11-15).
