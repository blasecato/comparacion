import { extractCedula, GeminiError } from '../server/gemini.js'

/**
 * Función serverless de Vercel: POST /api/extraer-cedula
 * Recibe { imageBase64, mimeType } y devuelve los datos del documento.
 * La key vive en la variable de entorno GEMINI_API_KEY del proyecto Vercel.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  try {
    const { imageBase64, mimeType } = req.body || {}
    const data = await extractCedula(imageBase64, mimeType)
    res.status(200).json(data)
  } catch (err) {
    if (err instanceof GeminiError) return res.status(err.status).json(err.body)
    console.error('[api] fallo:', err)
    res.status(500).json({ error: 'No se pudo contactar a Gemini' })
  }
}
