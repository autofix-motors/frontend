import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  head: () => ({ meta: [{ title: 'Inicio · AutoFix Motors' }] }),
  component: HomePage,
})

function HomePage() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold">Hola, {session.name}</h1>
      <p className="text-sm text-muted-foreground">
        Bienvenido a AutoFix Motors.
      </p>
    </div>
  )
}
