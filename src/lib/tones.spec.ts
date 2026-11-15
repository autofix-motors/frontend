import { TONES } from './tones'
import type { Tone } from './tones'

const KEYS = ['soft', 'border', 'text', 'chip', 'active'] as const

describe('TONES', () => {
  it.each(Object.keys(TONES) as Tone[])(
    '%s trae todas sus clases, y solo de su color',
    (tone) => {
      for (const key of KEYS) {
        const classes = TONES[tone][key].split(' ')
        expect(classes.length).toBeGreaterThan(0)
        // Una clase copiada de otro tono pintaría la mitad de otro color.
        for (const name of classes) {
          expect(name).toContain(`-${tone}-`)
        }
      }
    },
  )
})
