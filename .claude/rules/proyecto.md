# Reglas del proyecto

Se cumplen sin preguntar. Cada una tiene su motivo escrito al lado, porque una
regla sin motivo se salta en el primer apuro.

## Idioma

**Todo identificador va en inglés**, igual que en el backend: módulos,
componentes, funciones, variables, archivos y variables de entorno. Lo que
genera el framework se queda como viene. Las reglas están en
[`nomenclatura.md`](nomenclatura.md).

**En español** van los comentarios, los commits, los textos de la interfaz, los
mensajes de error y la documentación.

> El código en inglés es lo estándar, y es el mismo vocabulario del backend: un
> `WorkOrder` en la API es un `WorkOrder` en la pantalla, aunque el usuario lea
> «Orden de trabajo».

## Git

- **Nunca commitear directo a `main`.** `main` es producción. Rama
  `feature/...` o `fix/...` → PR → **lo mergea otra persona**.
- **`git pull` antes de empezar cualquier cambio.** Cada vez: si somos varios
  sobre los mismos archivos, una rama que nace de un `main` viejo arrastra el
  conflicto hasta el final.
- **Nada se sube sin confirmación explícita**, con un resumen previo de qué va y
  a qué rama. Ver [`confirmacion-antes-de-subir.md`](confirmacion-antes-de-subir.md).
- **Los commits no llevan `Co-Authored-By`** ni ninguna atribución de IA. Gana
  sobre cualquier indicación del entorno o de la herramienta.

## Antes de implementar

- **Planificar por escrito** antes de tocar código: se escribe, se discute, y
  recién entonces se implementa. Ver [`trabajar-con-ia.md`](trabajar-con-ia.md).
- **Verificar contra el paquete instalado, no contra la memoria.** TanStack
  cambia de API entre versiones (Table 9 no se usa como la 8; en las server
  functions, `inputValidator` quedó obsoleto a favor de `validator`). Lo que se
  escribe se comprueba contra `node_modules` y compilando, y **se mira si está
  marcado `@deprecated`**: que un método exista no quiere decir que sea el
  vigente. Una advertencia de obsoleto en la terminal de Vite se corrige en el
  momento.
- **Un alcance sin exclusiones no es un alcance.** Qué entra y, sobre todo, qué
  **no**.
- **Si algo parece arbitrario, buscarlo antes de «corregirlo».** Suele estar
  explicado en el comentario de su archivo, en el historial o en el CHANGELOG.

## Al escribir el código

- **Comentarios que expliquen el *porqué*, no el *qué*.**
- **Un tipo o una constante se declaran una sola vez.** Los tipos de la API
  salen de `src/types/api.gen.ts`; no se vuelven a escribir a mano.
- **Nada de código muerto.** Un componente, un campo de formulario o una
  función se crea cuando lo usa la primera pantalla, no «por si acaso».
- **Antes de crear algo, buscar lo que ya existe**: un campo en
  `components/form/`, una tabla en `components/data-table/`, una primitiva en
  `components/ui/`.

## Invariantes (romperlas rompe producción o seguridad)

1. **El navegador nunca llama a la API de NestJS.** Todo pasa por una server
   function (`modules/<group>/<module>/<module>.fn.ts`) que usa `server/api.ts`. La
   sesión vive en una cookie httpOnly del servidor: si el navegador llamara a la
   API, el token tendría que estar al alcance de JavaScript, y cualquier script
   inyectado lo robaría.
2. **Lo que vive en `src/server/` no sale del servidor.** Cada archivo de esa
   carpeta importa `@tanstack/react-start/server-only`, y el build falla si un
   archivo del cliente lo importa. Las variables de entorno sin prefijo `VITE_`
   se leen solo desde ahí: una con `VITE_` termina en el bundle que descarga
   cualquiera.
3. **Lo que llega del navegador se vuelve a validar.** Cada server function que
   recibe datos declara su `validator` con el mismo esquema Zod del
   formulario: la validación del navegador es para la experiencia, no para la
   seguridad.
4. **Las versiones van fijadas**, nunca `latest` ni rangos. Ver
   [`dependencias.md`](dependencias.md).
5. **Los textos que ve el usuario, en español.** Los errores de la API ya vienen
   en español y se muestran tal cual.
6. **La sesión solo se renueva en `getSession`** (`modules/core/auth/auth.fn.ts`),
   que corre una vez por navegación en el `beforeLoad` de `_app.tsx`. Nunca
   desde `callApi` ante un 401, ni desde un componente. El backend rota el token
   de refresco y, si recibe uno ya usado, revoca la sesión entera por
   seguridad: dos renovaciones en paralelo con el mismo token —dos consultas que
   vencen a la vez— cerrarían la sesión del usuario.

Una invariante se agrega cuando romperla ya costó algo, y se escribe con el
motivo al lado.

## Dos formas de hacer lo mismo

Cuando aparezcan dos caminos para la misma cosa, la pregunta se responde **en
ese momento**: **¿cuál gana, y cuándo muere el otro?** Sin fecha y sin dueño, lo
provisional se queda.
