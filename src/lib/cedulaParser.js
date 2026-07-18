import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseCedulaText, parseBackFields, mergeRecords } from './cedulaFields'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const DATE_WHITELIST = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÑ+-.() '

/**
 * Recorre TODAS las páginas del PDF de cédulas y hace VARIAS pasadas de OCR
 * por página, combinando lo mejor de cada una (multi-pasada). Es más lento,
 * pero recupera muchos más campos que una sola pasada.
 *
 * Pasadas por página:
 *   1. Página completa, PSM 3  → nombres, tipo, número.
 *   2. Página completa, PSM 6  → alternativa (a veces mejores nombres/fechas).
 *   3. Franja derecha, PSM 4   → bloque de fechas del reverso.
 *   4. Franja derecha, PSM 6   → alternativa del bloque de fechas.
 * Se arman registros parciales con cada combinación y se fusionan.
 *
 * @param {File} file
 * @param {(info:{stage:string, progress:number}) => void} [onProgress]
 */
export async function parseCedulas(file, onProgress) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const { createWorker } = await import('tesseract.js')

  onProgress?.({ stage: 'Preparando OCR…', progress: 1 })
  const worker = await createWorker('spa')

  const records = []
  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      const canvas = await renderPage(pdf, p)

      // Pasadas de página completa (dos modos de segmentación).
      const full3 = await ocr(worker, canvas, '3', '')
      const full6 = await ocr(worker, canvas, '6', '')

      // Pasadas dirigidas a la franja derecha del reverso (las fechas).
      const strip = rightStrip(canvas)
      const back4 = parseBackFields(await ocr(worker, strip, '4', DATE_WHITELIST))
      const back6 = parseBackFields(await ocr(worker, strip, '6', DATE_WHITELIST))

      // Registros parciales cruzando fuentes de frente y reverso.
      const parciales = [
        parseCedulaText(full3, p, back4),
        parseCedulaText(full6, p, back6),
        parseCedulaText(full3, p, back6),
        parseCedulaText(full6, p, back4),
      ]

      const rec = mergeRecords(parciales, p)
      if (rec) records.push(rec)

      onProgress?.({
        stage: `Leyendo documento ${p} de ${pdf.numPages}…`,
        progress: Math.round((p / pdf.numPages) * 99),
      })
    }
  } finally {
    await worker.terminate()
  }

  return { records }
}

/** Rasteriza una página del PDF a un canvas (escala 3). */
async function renderPage(pdf, p) {
  const page = await pdf.getPage(p)
  const viewport = page.getViewport({ scale: 3 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
    canvas,
  }).promise
  return canvas
}

/** Franja derecha del reverso (donde va el bloque de fechas), ampliada 2x. */
function rightStrip(canvas) {
  const x0 = Math.floor(canvas.width * 0.38)
  const w = canvas.width - x0
  const h = canvas.height
  const strip = document.createElement('canvas')
  strip.width = w * 2
  strip.height = h * 2
  strip.getContext('2d').drawImage(canvas, x0, 0, w, h, 0, 0, w * 2, h * 2)
  return strip
}

/** Una pasada de OCR con PSM y whitelist dados. */
async function ocr(worker, canvas, psm, whitelist) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    tessedit_char_whitelist: whitelist,
  })
  const { data } = await worker.recognize(canvas)
  return data.text
}
