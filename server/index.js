import express from 'express'
import cors from 'cors'
import { extractCedula, GeminiError, MODEL } from './gemini.js'

/**
 * Servidor Express SOLO para desarrollo local (`npm run server`).
 * En Vercel no se usa: allá corre la función serverless api/extraer-cedula.js
 * con el mismo núcleo (server/gemini.js). Así dev y prod se comportan igual.
 */

const PORT = process.env.PORT || 3001

if (!process.env.GEMINI_API_KEY) {
  console.error('\n[server] Falta GEMINI_API_KEY. Crea un archivo .env con:')
  console.error('  GEMINI_API_KEY=tu_key_de_google_ai_studio\n')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '25mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }))

app.post('/api/extraer-cedula', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {}
    const data = await extractCedula(imageBase64, mimeType)
    res.json(data)
  } catch (err) {
    if (err instanceof GeminiError) return res.status(err.status).json(err.body)
    console.error('[server] fallo:', err)
    res.status(500).json({ error: 'No se pudo contactar a Gemini' })
  }
})

app.listen(PORT, () => {
  console.log(`[server] proxy Gemini en http://localhost:${PORT} (modelo ${MODEL})`)
})
