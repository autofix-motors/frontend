/**
 * Corrige el tipo de los campos que el OpenAPI del backend declara sin tipo.
 * Un campo opcional que puede ser null (`promisedDate`, `notes`) sale en
 * `api.gen.ts` como `Record<string, never> | null`, aunque la API manda una
 * cadena. Aquí se dice qué es de verdad, campo por campo:
 *
 *   type WorkOrder = WithNullable<Generated, 'promisedDate' | 'notes', string>
 *
 * Es un puente: muere cuando el backend declare el tipo de esos campos en sus
 * entidades. Ese día el tipo generado ya sale bien y se usa directo.
 */
export type WithNullable<T, K extends keyof T, V> = Omit<T, K> & {
  [P in K]: V | null
}
