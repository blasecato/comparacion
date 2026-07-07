/** Utilidades de normalización compartidas por los parsers y el comparador. */

const ACCENTS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Deja solo los dígitos de un número de documento ("CC - 26.620.337" -> "26620337"). */
export function normalizeDoc(value) {
  if (value == null) return ''
  return String(value).replace(/\D/g, '')
}

/** Quita tildes y pasa a minúsculas. */
export function stripAccents(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(ACCENTS, '')
    .toLowerCase()
}

/** Nombre normalizado para mostrar/comparar (una sola línea de espacios). */
export function cleanName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clave de nombre independiente del orden: ordena las palabras para que
 * "AGRIPINA AVENDAÑO" y "AVENDAÑO AGRIPINA" comparen igual.
 */
export function nameKey(value) {
  return stripAccents(cleanName(value))
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ')
}
