import * as XLSX from 'xlsx'
import { normalizeDoc, cleanName, stripAccents } from './normalize'

/**
 * Lee un archivo Excel de "Reporte de Inscripciones" y extrae la tabla
 * de participantes (Identificación / Nombre / Estado) más los metadatos
 * de la ficha (código y programa).
 *
 * El encabezado del reporte ocupa varias filas antes de la tabla, por eso
 * se busca dinámicamente la fila de cabeceras.
 */
export async function parseExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })

  const meta = extractMeta(rows)
  const { headerIndex, cols } = findHeader(rows)

  const records = []
  if (headerIndex !== -1) {
    for (let r = headerIndex + 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row) continue
      const doc = normalizeDoc(row[cols.id])
      const nombre = cleanName(row[cols.nombre])
      if (!doc) continue
      records.push({
        doc,
        nombre,
        estado: cleanName(row[cols.estado]),
        tipo: 'CC',
      })
    }
  }

  return { meta, records }
}

function findHeader(rows) {
  const cols = { id: 0, nombre: 1, estado: 2 }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || []
    const idx = { id: -1, nombre: -1, estado: -1 }
    row.forEach((cell, c) => {
      const text = stripAccents(cell).trim()
      if (idx.id === -1 && /identificacion|documento|cedula/.test(text))
        idx.id = c
      if (idx.nombre === -1 && /nombre/.test(text)) idx.nombre = c
      if (idx.estado === -1 && /estado/.test(text)) idx.estado = c
    })
    if (idx.id !== -1 && idx.nombre !== -1) {
      return {
        headerIndex: r,
        cols: {
          id: idx.id,
          nombre: idx.nombre,
          estado: idx.estado === -1 ? idx.nombre + 1 : idx.estado,
        },
      }
    }
  }
  return { headerIndex: -1, cols }
}

function extractMeta(rows) {
  const meta = { ficha: '', programa: '' }
  for (const row of rows) {
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      const label = stripAccents(row[c])
      const next = cleanName(row[c + 1])
      if (/codigo\s*ficha/.test(label) && next) meta.ficha = next
      if (/programa\s*de\s*formacion/.test(label) && next) meta.programa = next
    }
  }
  return meta
}
