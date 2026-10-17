# Login compartido, acceso de clientes y contraseñas temporales

Las pantallas del acceso, sobre la API del plan
`backend/docs/planificacion/auth/01-login-compartido-y-contrasenas.md`.

## Qué entra y qué no

- **Entra:** `/login` para todos (cliente por omisión, «Soy interno» para el
  personal), `/change-password` (obligatoria con la temporal, y por gusto
  desde el menú de la cuenta), el DNI y «Restablecer contraseña» en Personal,
  dar, restablecer y quitar el acceso al portal desde Clientes, el diálogo de
  la contraseña temporal con el mensaje para WhatsApp, y un portal mínimo
  (`/portal`) para comprobar la sesión del cliente.
- **No entra:** el portal en sí (vehículos, órdenes, presupuestos: módulo B)
  ni los inicios con gráficos (módulo C).

## Decisiones

| Decisión | Por qué |
|---|---|
| Un solo `/login` con `?audience=staff` para el personal; el formulario se vuelve a montar al cambiar | Son dos endpoints (un DNI puede ser de un mecánico y de un cliente), pero un solo lugar donde entrar |
| `homeFor(session)` decide a dónde va cada uno: `/change-password` con la temporal, `/portal` el cliente, `/` el personal. `afterLogin` respeta `redirect` solo si corresponde a quien entró | Un cliente no vuelve a una página del personal ni al revés |
| `_app` deja pasar solo sesiones del personal sin cambio pendiente y las tipa como `StaffSession`; `/portal` hace lo mismo con el cliente | Las páginas del personal no tienen que preguntar si la sesión es de un cliente |
| `/change-password` está fuera de los dos layouts y sirve para el cambio obligatorio y el voluntario | Con la temporal, la API no deja hacer nada más; un solo formulario para las dos cosas |
| `TemporaryPasswordDialog` (global, `components/credentials/`) muestra la temporal una vez, con «Enviar por WhatsApp» (`wa.me`, sin API) y «Copiar mensaje». La contraseña vive solo en el resultado de la mutación, nunca en la caché de consultas | La API no la guarda: si se cierra, hay que generar otra |
| `whatsappUrl`: a un celular peruano de 9 dígitos le pone el 51; con «+» se respeta; un fijo no tiene enlace y solo se ofrece copiar | No abrir un chat con un número que no es de WhatsApp |
| Al registrar un cliente se puede activar «Dar acceso al portal»: se registra y después se genera la temporal; si eso falla, el cliente queda registrado y un aviso pide reintentar desde su menú | El acceso es un segundo paso, no un campo del cliente |
| Columna «Portal» en Clientes: «Sin acceso», «Por activar» (temporal sin cambiar) o «Activo» con su último ingreso | Saber a quién falta enviarle o recordarle el acceso |

## Avance

- [x] Esquemas de sesión y login (`StaffSession`, `CustomerSession`,
  `homeFor`, `afterLogin`, cambio de contraseña) con su test.
- [x] Login con los dos accesos, `/change-password`, layouts que separan al
  personal del cliente, «Cambiar contraseña» en el menú de la cuenta.
- [x] Personal: DNI, alta sin contraseña, «Restablecer contraseña», marca de
  contraseña temporal.
- [x] Clientes: columna «Portal», dar, restablecer y quitar acceso, switch al
  registrar; módulo `core/customer-accounts`.
- [x] `TemporaryPasswordDialog` y `lib/whatsapp.ts` con su test. Ajuste de
  ancho tras revisión: las acciones apiladas, el pie solo con «Listo».
- [x] Tipos regenerados desde el backend de prueba; typecheck, lint y 322
  tests en verde.
- [ ] Validación completa de quien dirige el proyecto: revisó el alta de
  personal y el diálogo de credenciales (2026-10-16); falta el acceso del
  cliente de punta a punta.
