import {
  defaultPortalVehiclesSearch,
  defaultPortalWorkOrdersSearch,
  pendingQuote,
  portalDecisionRequestSchema,
  portalVehiclesSearchSchema,
  portalWorkOrdersSearchSchema,
} from './portal.schemas'
import type { PortalQuote } from './portal.schemas'

const quote = (overrides: Partial<PortalQuote> = {}): PortalQuote => ({
  presupuestoId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
  version: 1,
  estado: 'PENDIENTE',
  total: '200.00',
  enviadoEn: '2026-10-18T15:30:00.000Z',
  decididoEn: null,
  canalDecision: null,
  notaDecision: null,
  detalles: [],
  ...overrides,
})

describe('portalWorkOrdersSearchSchema', () => {
  it('por omisión, la pestaña «En curso» en la primera página', () => {
    expect(defaultPortalWorkOrdersSearch).toStrictEqual({
      estado: 'EN_CURSO',
      page: 1,
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      portalWorkOrdersSearchSchema.parse({
        estado: 'TODAS',
        vehiculoId: 'no-es-uuid',
        page: 0,
      }),
    ).toMatchObject({ estado: 'EN_CURSO', vehiculoId: undefined, page: 1 })
  })
})

describe('portalVehiclesSearchSchema', () => {
  it('por omisión, sin búsqueda y en la primera página', () => {
    expect(defaultPortalVehiclesSearch).toStrictEqual({ search: '', page: 1 })
  })

  it('recorta la búsqueda y corrige una página inválida', () => {
    expect(
      portalVehiclesSearchSchema.parse({ search: '  abc-1 ', page: '-3' }),
    ).toStrictEqual({ search: 'abc-1', page: 1 })
  })

  it('descarta una búsqueda demasiado larga', () => {
    expect(
      portalVehiclesSearchSchema.parse({ search: 'x'.repeat(101), page: 2 }),
    ).toStrictEqual({ search: '', page: 2 })
  })
})

describe('pendingQuote', () => {
  it('es la versión PENDIENTE mientras la orden espera aprobación', () => {
    const pending = quote()
    expect(
      pendingQuote({
        estado: 'ESPERANDO_APROBACION',
        presupuestos: [pending, quote({ version: 0, estado: 'RECHAZADO' })],
      }),
    ).toBe(pending)
  })

  it('no hay respuesta que dar si la orden ya no espera (la cancelaron)', () => {
    expect(
      pendingQuote({ estado: 'CANCELADO', presupuestos: [quote()] }),
    ).toBeUndefined()
  })
})

describe('portalDecisionRequestSchema', () => {
  it('manda la decisión y la nota vacía como null', () => {
    expect(
      portalDecisionRequestSchema.parse({
        ordenTrabajoId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
        presupuestoId: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
        decision: 'APROBADO',
        nota: '   ',
      }),
    ).toMatchObject({ decision: 'APROBADO', nota: null })
  })

  it('solo aprobado o rechazado', () => {
    expect(
      portalDecisionRequestSchema.safeParse({
        ordenTrabajoId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
        presupuestoId: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
        decision: 'REEMPLAZADO',
        nota: '',
      }).success,
    ).toBe(false)
  })
})
