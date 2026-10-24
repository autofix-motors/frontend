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
  quoteId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
  version: 1,
  status: 'PENDING',
  total: '200.00',
  sentAt: '2026-10-18T15:30:00.000Z',
  decidedAt: null,
  decisionChannel: null,
  decisionNote: null,
  items: [],
  ...overrides,
})

describe('portalWorkOrdersSearchSchema', () => {
  it('por omisión, la pestaña «En curso» en la primera página', () => {
    expect(defaultPortalWorkOrdersSearch).toStrictEqual({
      state: 'OPEN',
      page: 1,
    })
  })

  it('cae al valor por defecto si alguien edita la URL a mano', () => {
    expect(
      portalWorkOrdersSearchSchema.parse({
        state: 'TODAS',
        vehicleId: 'no-es-uuid',
        page: 0,
      }),
    ).toMatchObject({ state: 'OPEN', vehicleId: undefined, page: 1 })
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
  it('es la versión PENDING mientras la orden espera aprobación', () => {
    const pending = quote()
    expect(
      pendingQuote({
        status: 'WAITING_APPROVAL',
        quotes: [pending, quote({ version: 0, status: 'REJECTED' })],
      }),
    ).toBe(pending)
  })

  it('no hay respuesta que dar si la orden ya no espera (la cancelaron)', () => {
    expect(
      pendingQuote({ status: 'CANCELLED', quotes: [quote()] }),
    ).toBeUndefined()
  })
})

describe('portalDecisionRequestSchema', () => {
  it('manda la decisión y la nota vacía como null', () => {
    expect(
      portalDecisionRequestSchema.parse({
        workOrderId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
        quoteId: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
        decision: 'APPROVED',
        note: '   ',
      }),
    ).toMatchObject({ decision: 'APPROVED', note: null })
  })

  it('solo aprobado o rechazado', () => {
    expect(
      portalDecisionRequestSchema.safeParse({
        workOrderId: '0b6f4a8e-3c1d-4e2f-9a7b-5c8d1e2f3a4b',
        quoteId: '7b1e4c8a-2f3d-4e5f-8a9b-0c1d2e3f4a5b',
        decision: 'SUPERSEDED',
        note: '',
      }).success,
    ).toBe(false)
  })
})
