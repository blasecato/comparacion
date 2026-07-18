import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { mayoriaDeEdad } from './cedulaFields'
import { normalizeDoc, cleanName } from './normalize'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Extrae los documentos de un PDF de cédulas usando Gemini (visión) a través
 * del backend proxy (/api/extraer-cedula). Cada página se rasteriza a imagen
 * JPEG y se envía; el backend responde con los datos estructurados.
 *
 * Requiere el backend corriendo: `npm run server` (con la key en .env).
 *
 * @param {File} file
 * @param {(info:{stage:string, progress:number}) => void} [onProgress]
 */
export async function parseCedulasGemini(file, onProgress) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const records = []
  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.({
      stage: `Analizando documento ${p} de ${pdf.numPages} con IA…`,
      progress: Math.round(((p - 1) / pdf.numPages) * 99),
    })

    const imageBase64 = await renderPageToJpeg(pdf, p)
    const data = await callGemini(imageBase64, (segundos) =>
      onProgress?.({
        stage: `Límite del free tier alcanzado — esperando ${segundos}s (documento ${p}/${pdf.numPages})…`,
        progress: Math.round(((p - 1) / pdf.numPages) * 99),
      })
    )

    if (data && data.presente !== false && (data.numeroDocumento || data.nombreCompleto)) {
      const tipo = (data.tipo || 'CC').toUpperCase()
      const fechaNacimiento = cleanName(data.fechaNacimiento)
      records.push({
        pag: p,
        tipo,
        doc: normalizeDoc(data.numeroDocumento),
        nombre: cleanName(data.nombreCompleto),
        fechaNacimiento,
        lugarNacimiento: cleanName(data.lugarNacimiento),
        fechaExpedicion: cleanName(data.fechaExpedicion),
        tipoSangre: cleanName(data.tipoSangre),
        mayoria: mayoriaDeEdad(fechaNacimiento, tipo),
      })
    }
  }

  onProgress?.({ stage: 'Listo', progress: 100 })
  return { records }
}

/** Rasteriza una página del PDF a JPEG base64 (sin el prefijo data:). */
async function renderPageToJpeg(pdf, p) {
  const page = await pdf.getPage(p)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
    canvas,
  }).promise
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.split(',')[1]
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Llama al backend. Reintenta con espera creciente cuando Gemini responde 429
 * (límite del free tier) o 503 (saturado). onWait(segundos) avisa a la UI.
 */
async function callGemini(imageBase64, onWait) {
  const MAX_INTENTOS = 6
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const res = await fetch('/api/extraer-cedula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
    })
    if (res.ok) return res.json()

    if ((res.status === 429 || res.status === 503) && intento < MAX_INTENTOS - 1) {
      const espera = Math.min(5 * 2 ** intento, 60) // 5,10,20,40,60s
      onWait?.(espera)
      await sleep(espera * 1000)
      continue
    }

    const detail = await res.text().catch(() => '')
    throw new Error(`Backend/Gemini falló (${res.status}). ${detail.slice(0, 200)}`)
  }
}
