/**
 * Núcleo compartido de extracción con Gemini. Sin dependencias de framework:
 * lo usan el Express local (server/index.js) y la función serverless de Vercel
 * (api/extraer-cedula.js). La API key se lee de process.env.
 *
 * Procesa VARIAS imágenes en una sola llamada (batch) para gastar mucha menos
 * cuota del free tier: un PDF de 25 páginas usa ~6 llamadas en vez de 25.
 */

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const DOC_SCHEMA = {
  type: 'object',
  properties: {
    presente: {
      type: 'boolean',
      description: 'true si la imagen contiene un documento de identidad',
    },
    tipo: {
      type: 'string',
      enum: ['CC', 'TI', 'CE', 'PA', 'PPT'],
      description:
        'CC=cédula de ciudadanía, TI=tarjeta de identidad, CE=cédula de extranjería, PA=pasaporte, PPT=permiso por protección temporal',
    },
    numeroDocumento: { type: 'string' },
    nombreCompleto: { type: 'string' },
    fechaNacimiento: { type: 'string', description: 'formato DD/MM/AAAA' },
    lugarNacimiento: { type: 'string' },
    fechaExpedicion: { type: 'string', description: 'formato DD/MM/AAAA' },
    tipoSangre: { type: 'string', description: 'ej: O+, A-, AB+' },
  },
  required: ['presente'],
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    documentos: { type: 'array', items: DOC_SCHEMA },
  },
  required: ['documentos'],
}

const PROMPT = `Eres un extractor de datos de documentos de identidad colombianos (cédula de ciudadanía, tarjeta de identidad, cédula de extranjería, pasaporte o PPT). Recibes VARIAS imágenes; cada una es una página distinta (fotocopia escaneada, puede estar inclinada o con manchas).

Devuelve un objeto { "documentos": [...] } con EXACTAMENTE un elemento por imagen, en el MISMO ORDEN en que llegan.
Para cada imagen:
- numeroDocumento: solo dígitos, sin puntos ni espacios.
- fechaNacimiento y fechaExpedicion: formato DD/MM/AAAA. Ojo: las tarjetas de identidad muestran las fechas como "02 NOV 2004" o "10-FEB-2010".
- lugarNacimiento: ciudad y departamento, ej: "LA MONTAÑITA (CAQUETA)".
- nombreCompleto: nombres y apellidos juntos.
- tipoSangre: como aparece junto a "G S RH".
- Si un campo no es legible, déjalo como cadena vacía "".
- Si esa imagen NO tiene documento de identidad, pon {"presente": false} en su lugar del arreglo.
No inventes datos: si no estás seguro, deja el campo vacío.`

/** Error con código HTTP para propagar al cliente. */
export class GeminiError extends Error {
  constructor(status, body) {
    super(typeof body === 'string' ? body : 'Gemini error')
    this.status = status
    this.body = body
  }
}

/**
 * Extrae los documentos de un lote de imágenes en una sola llamada a Gemini.
 * @param {Array<{imageBase64:string, mimeType?:string}>} images
 * @returns {Promise<object[]>} un objeto por imagen, en el mismo orden
 */
export async function extractCedulas(images) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new GeminiError(500, { error: 'Falta GEMINI_API_KEY en el servidor' })
  if (!Array.isArray(images) || !images.length) {
    throw new GeminiError(400, { error: 'Falta el arreglo images' })
  }

  const parts = [{ text: PROMPT }]
  for (const img of images) {
    parts.push({
      inline_data: { mime_type: img.mimeType || 'image/jpeg', data: img.imageBase64 },
    })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    throw new GeminiError(r.status, { error: 'Gemini error', detail: await r.text() })
  }
  const data = await r.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  try {
    return JSON.parse(text).documentos || []
  } catch {
    throw new GeminiError(502, { error: 'Respuesta no-JSON de Gemini', text })
  }
}

export { MODEL }
