import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseCedulaText, parseBackFields } from './cedulaFields'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Recorre TODAS las páginas del PDF de cédulas, hace OCR de cada una y
 * extrae los datos de la persona.
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

      // 1) página completa: nombres, tipo y número de documento
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        tessedit_char_whitelist: '',
      })
      const { data } = await worker.recognize(canvas)

      // 2) pasada dirigida a la franja derecha del reverso: ahí van siempre
      //    las fechas. Aislada y con whitelist se leen mucho mejor.
      const back = await ocrBackStrip(worker, canvas)

      const rec = parseCedulaText(data.text, p, back)
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

/**
 * OCR de la franja derecha de la página (donde va el bloque de fechas del
 * reverso), con PSM 4 y whitelist de fecha. Devuelve los campos del reverso.
 */
async function ocrBackStrip(worker, canvas) {
  const x0 = Math.floor(canvas.width * 0.38)
  const w = canvas.width - x0
  const h = canvas.height
  const strip = document.createElement('canvas')
  strip.width = w * 2 // ampliar ayuda al OCR de las fechas
  strip.height = h * 2
  strip.getContext('2d').drawImage(canvas, x0, 0, w, h, 0, 0, w * 2, h * 2)

  await worker.setParameters({
    tessedit_pageseg_mode: '4',
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÑ+-.() ',
  })
  const { data } = await worker.recognize(strip)
  return parseBackFields(data.text)
}
