# Pantalla del personal

La pantalla de `/core/users`, solo para `ADMIN`, sobre la API del plan
`backend/docs/planificacion/users/01-gestion-del-personal.md`. Sigue el patrón
de la pantalla de clientes.

## Qué entra y qué no

- **Entra:** listado con búsqueda, filtros por rol y estado, orden por nombre,
  último ingreso o fecha de registro; alta (con contraseña y su confirmación),
  edición, «Cambiar contraseña» y borrado en diálogos. El ítem «Personal» en una
  sección nueva, «Administración».
- **No entra:** «Mi perfil» para que cada usuario cambie su contraseña, ver las
  sesiones abiertas de un usuario, página de detalle con sus órdenes.

## Decisiones

| Decisión | Por qué |
|---|---|
| La contraseña se pide en el alta y después solo en «Cambiar contraseña» | La edición no la manda (la API la rechazaría) y cambiarla cierra las sesiones del usuario: es una acción aparte, con su aviso |
| La confirmación se valida en el navegador y no viaja | La API no la declara: una propiedad de más es 400 |
| En el usuario de la sesión, «Eliminar» se ve deshabilitado («No puedes eliminarte»), y en su edición el rol y «Activo» quedan bloqueados | La API los rechaza (400): no se ofrece un botón que falla. La fila lleva la marca «Tú» |
| Al editarse a sí mismo se vuelve a pedir la sesión (`router.invalidate()`) | El nombre y el correo de la barra lateral salen de la sesión del contexto del router |
| «Último ingreso» con `formatDateTime`; «Nunca» si no entró | Sirve para ver cuentas abandonadas |
| El último administrador activo no se marca en la pantalla | La API responde 409 con el porqué y el diálogo lo muestra; calcularlo aquí exigiría otra consulta |

### Búsqueda y filtros

> **Pendiente de validación de quien dirige el proyecto.** Los mismos del plan
> del backend: búsqueda por nombre y correo; filtros por rol y estado.

## Avance

- [x] Módulo `core/users` (server functions, consultas, esquemas con su test,
  tabla y diálogos) y su ruta.
- [x] Ítem «Personal» en la sección «Administración» del menú.
- [x] `SwitchField` acepta `disabled`.
- [ ] Prueba en navegador real: búsqueda, filtros, «Limpiar», alta, edición,
  cambio de contraseña, borrado y el 409, con la consola limpia. El script está
  escrito (`users-browser.mjs`) pero no se pudo correr: Postgres local no acepta
  conexiones. Los tipos de la API se generaron del backend compilado sin base
  (mismo documento OpenAPI; el diff solo agrega lo de `/users`).
- [ ] Validación de quien dirige el proyecto (funcionamiento y diseño).
