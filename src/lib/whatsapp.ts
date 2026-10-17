/**
 * El enlace `wa.me` que abre WhatsApp con el mensaje escrito, listo para
 * enviar. No usa ninguna API: lo envía quien hace clic, desde su propio
 * WhatsApp.
 *
 * El número va con código de país y sin «+» ni separadores. Un celular peruano
 * (9 dígitos que empiezan en 9) recibe el 51; uno con «+» ya lo trae. Un fijo o
 * un número que no se reconoce no tiene WhatsApp seguro: devuelve null y la
 * pantalla ofrece solo copiar.
 */
export function whatsappUrl(phone: string, text: string): string | null {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  let number: string | null = null
  if (trimmed.startsWith('+') && digits.length >= 8) number = digits
  else if (/^9\d{8}$/.test(digits)) number = `51${digits}`
  else if (/^519\d{8}$/.test(digits)) number = digits
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : null
}

/**
 * El mensaje con el acceso de alguien: con qué entra, su contraseña temporal,
 * dónde, y que tiene que cambiarla.
 */
export function temporaryPasswordMessage({
  name,
  loginIdentifier,
  temporaryPassword,
  loginUrl,
  isStaff,
}: {
  name: string
  loginIdentifier: string
  temporaryPassword: string
  loginUrl: string
  /** El personal entra con «Soy interno»; el cliente, directo. */
  isStaff: boolean
}): string {
  const firstName = name.trim().split(/\s+/)[0] ?? name
  return [
    `Hola, ${firstName}. Este es tu acceso a AutoFix Motors:`,
    '',
    `Ingresa en: ${loginUrl}${isStaff ? ' (botón «Soy interno»)' : ''}`,
    `Usuario: ${loginIdentifier}`,
    `Contraseña temporal: ${temporaryPassword}`,
    '',
    'Al entrar te pediremos cambiarla por una tuya. La temporal vence en unos días; si se vence, pídenos una nueva.',
  ].join('\n')
}
