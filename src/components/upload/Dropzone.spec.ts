import { ErrorCode } from 'react-dropzone'
import { formatBytes, rejectionMessage } from './Dropzone'

const options = { maxSize: 2 * 1024 * 1024, typesLabel: 'PNG, JPG o WEBP' }
const rejected = (code: string) => ({
  errors: [{ code, message: 'en inglés' }],
})

describe('rejectionMessage', () => {
  it('dice qué tipos se aceptan', () => {
    expect(rejectionMessage(rejected(ErrorCode.FileInvalidType), options)).toBe(
      'El archivo tiene que ser PNG, JPG o WEBP',
    )
  })

  it('dice el tamaño máximo en MB', () => {
    expect(rejectionMessage(rejected(ErrorCode.FileTooLarge), options)).toBe(
      'El archivo pesa más de 2 MB',
    )
  })

  it('pide un solo archivo', () => {
    expect(rejectionMessage(rejected(ErrorCode.TooManyFiles), options)).toBe(
      'Suelta un solo archivo',
    )
  })

  it('nunca muestra el mensaje en inglés de react-dropzone', () => {
    expect(rejectionMessage(rejected('otro-codigo'), options)).toBe(
      'No se pudo usar ese archivo',
    )
  })
})

describe('formatBytes', () => {
  it.each([
    [2 * 1024 * 1024, '2 MB'],
    [500 * 1024, '500 KB'],
  ])('%i → %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text)
  })
})
