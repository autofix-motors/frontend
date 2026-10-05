# Pantalla de vehículos

La pantalla de `/customer/vehicles`, solo para `ADMIN`, sobre la API del plan
`backend/docs/planificacion/vehicles/01-gestion-de-vehiculos.md`. Sigue el
patrón de la pantalla de clientes.

## Qué entra y qué no

- **Entra:** listado con búsqueda, filtros por cliente y por marca, orden por
  placa, marca o fecha, y alta, edición y borrado en diálogos. El ítem
  «Vehículos» en la sección «Clientes» del menú. En el listado de clientes, el
  número de vehículos lleva al listado de vehículos filtrado por ese cliente.
- **No entra:** página de detalle del vehículo con su historial de órdenes
  (llega con las órdenes de trabajo), crear un cliente desde el formulario del
  vehículo, autocompletar marcas o modelos.

## Decisiones

| Decisión | Por qué |
|---|---|
| El cliente se elige con `ComboboxField`, que busca en la API (`GET /customers?search&isActive=true&pageSize=20`) | Con cientos de clientes no caben en una lista; se reutiliza el listado de clientes en vez de un endpoint nuevo |
| Al asignar solo se ofrecen clientes activos; el filtro ofrece todos | La API rechaza asignar un vehículo a un cliente inactivo, pero sus vehículos siguen existiendo y se tienen que poder encontrar |
| Al editar, el dueño actual se muestra aunque no salga en la primera página | El combobox recibe la opción guardada (`selectedOption`) desde el cliente resumido que trae el vehículo |
| Filtro por cliente: `DataTableComboboxFilter`, con la misma búsqueda | La URL guarda solo el `customerId`; el nombre se pide a `GET /customers/:customerId` y la ruta lo precarga |
| Filtro por marca: lista con las marcas registradas y su cantidad (`GET /vehicles/brands`) | La API filtra la marca exacta: elegirla de una lista evita adivinar cómo se escribió. Buscar una marca a medias ya lo hace la búsqueda libre |
| El combobox es un `Popover` de Radix con el `Combobox` de Base UI en modo `inline` | El popup propio de Base UI no es una capa de Radix: dentro del diálogo, su clic se tomaría como «afuera» y lo cerraría |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por placa, marca, modelo y nombre del cliente; filtros
> por cliente y por marca.

## Avance

- [x] `AsyncCombobox`, `ComboboxField` (registrado en `form.ts`) y
  `DataTableComboboxFilter`, documentados en la skill `estructura-frontend`.
- [x] Módulo `customer/vehicles` (server functions, consultas, esquemas con su
  test, tabla y diálogos) y su ruta.
- [x] Ítem del menú y enlace desde el listado de clientes.
- [ ] Prueba en navegador real: búsqueda, filtros, «Limpiar», alta, edición,
  borrado y el 409, con la consola limpia. El script está escrito
  (`vehicles-browser.mjs`) pero no se pudo correr: Postgres local dejó de
  aceptar conexiones. En particular falta confirmar que el combobox funciona
  dentro del diálogo.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
