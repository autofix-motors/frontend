# Pantalla del catálogo de servicios

La pantalla de `/workshop/service-catalog`, sobre la API del plan
`backend/docs/planificacion/service-catalog/01-catalogo-de-servicios.md`. Es la
primera del grupo `workshop` y sigue el patrón de la pantalla de clientes.

## Qué entra y qué no

- **Entra:** listado con búsqueda, filtro por estado, rango de precio («desde» y
  «hasta»), orden por nombre, precio o fecha; alta, edición y borrado en
  diálogos para `ADMIN`; el mismo listado en solo lectura para `MECHANIC`. La
  sección nueva «Taller» del menú (icono `WrenchIcon`) con el ítem «Catálogo de
  servicios». `formatMoney` (`lib/money.ts`) y `MoneyField`
  (`components/form/`), que reusarán repuestos y pagos.
- **No entra:** página de detalle de un servicio, elegir servicios del catálogo
  al armar una orden (llega con las órdenes de trabajo), exportar.

## Decisiones

| Decisión | Por qué |
|---|---|
| El mecánico ve el catálogo sin «Nuevo servicio» ni el menú de acciones por fila | Lo consulta para armar sus órdenes; la API le rechazaría los cambios (403). La ruta no tiene `beforeLoad` de rol: los dos roles la abren |
| Precio «S/ 1,250.00»: miles con coma, dos decimales, agrupado a mano | El formato de los montos en el Perú. Sin `Intl` para que el servidor y el navegador rendericen el mismo texto al hidratar |
| `MoneyField`: texto con teclado numérico (`inputMode="decimal"`), prefijo «S/», y la coma se toma como punto | Con `type="number"` el valor queda vacío mientras se escribe «12.» y el navegador valida a su manera; el texto conserva «120.50» tal como lo manda la API |
| El formulario valida el precio con las mismas reglas que la API (`moneyError`) | El error sale al momento y con el mismo mensaje |
| El rango de precio se aplica al dejar de escribir (400 ms); un monto mal escrito o un «desde» mayor que el «hasta» se marcan en rojo y no se aplican | La API respondería 400 y la página mostraría un error en vez del listado |
| En la URL el rango va como número (`?minPrice=50&maxPrice=100`) | El router guarda los números como números; un texto saldría entre comillas. Un valor que la API rechazaría cae a «sin filtro» |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por nombre y descripción; filtros por estado y rango de
> precio.

## Avance

- [x] `formatMoney` y `moneyError` en `lib/money.ts`, con su test.
- [x] `MoneyField` en `components/form/`, registrado en `useAppForm`.
- [x] Módulo `workshop/service-catalog` (server functions, consultas, esquemas
  con su test, tabla, filtro de rango y diálogos) y su ruta.
- [x] Sección «Taller» en el menú, con su test por rol.
- [x] Tipos de la API regenerados. Sin base, desde el backend compilado
  (`openapi-offline.mjs`); el diff de `api.gen.ts` solo agrega
  `/service-catalog`.
- [ ] Prueba en navegador real: búsqueda, filtros, rango, «Limpiar», orden,
  alta, edición, borrado, el 409 y la vista del mecánico, con la consola
  limpia. El script está escrito (`service-catalog-browser.mjs`) pero no se
  pudo correr: Postgres local no acepta conexiones.
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
