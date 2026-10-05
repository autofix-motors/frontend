import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Lo que precargó el servidor sigue fresco al hidratar. Con 0, la
        // consulta ya figura como «buscando» en el primer render del navegador
        // y la tabla se pinta atenuada (aria-busy) distinto que en el servidor:
        // un aviso de hidratación en cada listado. Las mutaciones invalidan
        // igual, así que lo que el usuario cambia se ve al momento.
        staleTime: 30_000,
      },
    },
  })

  return {
    queryClient,
  }
}
