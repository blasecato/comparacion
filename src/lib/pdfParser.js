import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { normalizeDoc, cleanName, stripAccents } from './normalize'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Extrae la tabla de participantes de una planilla PDF.
 *
 * - PDF digital (con capa de texto): lectura directa por posiciones.
 * - PDF escaneado (imagen): se detecta la grilla de la tabla (líneas
 *   horizontales = filas) y se hace OCR fila por fila. OCR-ear cada fila
 *   aislada da mucha mejor calidad que OCR-ear la página entera, y garantiza
 *   que aparezcan TODAS las filas (aunque algún dato salga con error, que el
 *   usuario corrige en "Revisar Datos").
 *
 * @param {File} file
 * @param {(info:{stage:string, progress:number}) => void} [onProgress]
 */
export async function parsePdf(file, onProgress) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const meta = { ficha: '', programa: '' }
  const records = []
  const scannedPages = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] }))

    if (items.length > 20) {
      extractFromText(items, records, meta, p) // PDF digital
    } else {
      scannedPages.push(page) // escaneo -> OCR después
    }
  }

  if (scannedPages.length) {
    await ocrPages(scannedPages, records, onProgress)
  }

  return { meta, records, scanned: scannedPages.length > 0 }
}

/* ------------------------- Camino PDF digital ------------------------- */

function extractFromText(items, records, meta, page) {
  const rows = groupRows(items)
  readMeta(rows, meta)
  const cols = findColumns(rows)
  if (!cols) return
  for (const row of rows) {
    const joined = stripAccents(row.items.map((i) => i.str).join(' '))
    if (!/cedula|c\.c|\bcc\b/.test(joined)) continue
    const doc = normalizeDoc(
      row.items.filter((i) => i.x >= cols.docL && i.x < cols.docR).map((i) => i.str).join('')
    )
    if (doc.length < 6) continue
    const nombre = cleanName(
      row.items
        .filter((i) => i.x >= cols.nameL && i.x < cols.nameR)
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(' ')
    )
    records.push({ doc, nombre, tipo: 'CC', pag: page })
  }
}

function groupRows(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows = []
  let current = null
  for (const item of sorted) {
    if (!current || Math.abs(current.y - item.y) > 3) {
      current = { y: item.y, items: [item] }
      rows.push(current)
    } else current.items.push(item)
  }
  return rows
}

function findColumns(rows) {
  for (const row of rows) {
    const find = (re) => row.items.find((i) => re.test(stripAccents(i.str)))
    const nombres = find(/nombres/)
    const apellidos = find(/apellidos/)
    if (!nombres || !apellidos) continue
    const numero =
      find(/numero|documento/) ||
      row.items.filter((i) => i.x < nombres.x).sort((a, b) => b.x - a.x)[0]
    const direccion =
      find(/direccion|dependencia/) ||
      row.items.filter((i) => i.x > apellidos.x).sort((a, b) => a.x - b.x)[0]
    const nameStart = Math.min(nombres.x, apellidos.x)
    return {
      docL: (numero ? numero.x : nameStart - 60) - 6,
      docR: nameStart - 2,
      nameL: nameStart - 2,
      nameR: direccion ? direccion.x - 2 : nameStart + 220,
    }
  }
  return null
}

function readMeta(rows, meta) {
  for (const row of rows) {
    const text = row.items.map((i) => i.str).join(' ')
    const ficha = stripAccents(text).match(/ficha(?:\s*de\s*caracterizacion)?\s*:?\s*(\d{5,})/)
    if (ficha && !meta.ficha) meta.ficha = ficha[1]
    const prog = text.match(/PROGRAMA DE FORMACI[ÓO]N:\s*([^\n]+)/i)
    if (prog && !meta.programa) meta.programa = cleanName(prog[1])
  }
}

/* ---------------------------- Camino OCR ----------------------------- */

const SCALE = 3

/** Rasteriza una página del PDF a un canvas. */
async function renderPage(page) {
  const viewport = page.getViewport({ scale: SCALE })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas
}

/** Máscara de píxeles oscuros (tinta / líneas de la tabla). */
function darkMask(ctx, W, H) {
  const { data: px } = ctx.getImageData(0, 0, W, H)
  const dark = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const lum = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
    dark[i] = lum < 150 ? 1 : 0
  }
  return dark
}

/**
 * Detecta las filas de la tabla usando las líneas horizontales (proyección
 * de píxeles oscuros) y la extensión horizontal de la tabla.
 */
function detectRows(ctx, W, H) {
  const dark = darkMask(ctx, W, H)
  const rowDark = new Int32Array(H)
  for (let y = 0; y < H; y++) {
    let c = 0
    for (let x = 0; x < W; x++) c += dark[y * W + x]
    rowDark[y] = c
  }
  let maxRow = 0
  for (let y = 0; y < H; y++) if (rowDark[y] > maxRow) maxRow = rowDark[y]

  const hth = maxRow * 0.5
  const lines = []
  for (let y = 1; y < H; y++) {
    if (rowDark[y] > hth) {
      if (lines.length && y - lines[lines.length - 1] < 12) continue
      lines.push(y)
    }
  }
  if (lines.length < 2) return { bands: [], xL: 0, xR: W }

  const yTop = lines[0]
  const yBot = lines[lines.length - 1]
  const colDark = new Int32Array(W)
  for (let x = 0; x < W; x++) {
    let c = 0
    for (let y = yTop; y <= yBot; y++) c += dark[y * W + x]
    colDark[x] = c
  }
  const vth = (yBot - yTop) * 0.3
  let xL = W
  let xR = 0
  for (let x = 0; x < W; x++) {
    if (colDark[x] > vth) {
      if (x < xL) xL = x
      if (x > xR) xR = x
    }
  }

  const bands = []
  for (let i = 0; i < lines.length - 1; i++) {
    const h = lines[i + 1] - lines[i]
    if (h >= 22 && h <= 80) bands.push([lines[i], lines[i + 1]])
  }
  return { bands, xL, xR }
}

/** Recorta una banda (fila) al 58% izquierdo de la tabla y la escala x2. */
function cropBand(canvas, xL, xR, y0, y1) {
  const cut = xL + (xR - xL) * 0.58
  const w = Math.max(1, Math.round(cut - xL))
  const h = y1 - y0
  const out = document.createElement('canvas')
  out.width = w * 2
  out.height = h * 2
  out.getContext('2d').drawImage(canvas, xL, y0, w, h, 0, 0, w * 2, h * 2)
  return out
}

/**
 * Interpreta la línea OCR de una fila: primer número de 6-11 dígitos = doc;
 * el texto tras la última aparición de ese número (hasta la dirección) = nombre.
 */
function parseBandLine(line, page) {
  const clean = cleanName(line)
  const m = clean.match(/\b(\d{6,11})\b/)
  if (!m) return null
  const doc = m[0]
  const idx = clean.lastIndexOf(doc)
  let rest = clean.slice(idx + doc.length)
  rest = rest.split(/mpio|municipio|monta|@|gmail|hotmail|\.com/i)[0]
  const nombre = cleanName(rest.replace(/[^A-Za-zÁÉÍÓÚÑñáéíóú ]+/g, ' '))
  return { doc, nombre, tipo: 'CC', pag: page }
}

/** OCR de todas las páginas escaneadas, fila por fila. */
async function ocrPages(pages, records, onProgress) {
  const { createWorker } = await import('tesseract.js')

  onProgress?.({ stage: 'Preparando OCR…', progress: 2 })

  // 1) render + detección de filas por página
  const jobs = []
  for (let p = 0; p < pages.length; p++) {
    const canvas = await renderPage(pages[p])
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const { bands, xL, xR } = detectRows(ctx, canvas.width, canvas.height)
    for (const [y0, y1] of bands) {
      jobs.push({ canvas, xL, xR, y0, y1, page: p + 1 })
    }
  }

  // 2) OCR fila por fila
  const worker = await createWorker('spa')
  await worker.setParameters({ tessedit_pageseg_mode: '7' }) // línea única
  try {
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i]
      const { data } = await worker.recognize(cropBand(j.canvas, j.xL, j.xR, j.y0, j.y1))
      const rec = parseBandLine(data.text, j.page)
      if (rec) records.push(rec)
      onProgress?.({
        stage: `Leyendo filas… (${i + 1}/${jobs.length})`,
        progress: Math.round(5 + (i / jobs.length) * 93),
      })
    }
  } finally {
    await worker.terminate()
  }
}
