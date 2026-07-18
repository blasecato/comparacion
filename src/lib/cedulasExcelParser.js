import * as XLSX from 'xlsx'
import { normalizeDoc, cleanName, stripAccents } from './normalize'
import { fechaADMY, mayoriaDeEdad } from './cedulaFields'

/**
 * Lee el Excel de "cédulas" (imagen 1). Columnas esperadas:
 *   Nombre | Fecha de Nacimiento | Tipo de Sangre | Mayor/Menor |
 *   Tipo de Documento | Número de Documento
 *
 * Si hay fila de encabezado se detecta por palabras clave; si no, se asume
 * ese orden de columnas.
 */
export async function parseCedulasExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false })

  const { headerIndex, cols } = findHeader(rows)
  const start = headerIndex === -1 ? 0 : headerIndex + 1

  const records = []
  for (let r = start; r < rows.length; r++) {
    const row = rows[r]
    if (!row) continue
    const doc = normalizeDoc(row[cols.doc])
    const nombre = cleanName(row[cols.nombre])
    if (!doc && !nombre) continue

    const tipo = mapTipoDoc(row[cols.tipoDoc])
    const fechaNacimiento = fechaADMY(row[cols.fechaNac])
    const mayoriaExcel = cleanName(row[cols.mayoria])
    records.push({
      doc,
      nombre,
      tipo,
      fechaNacimiento,
      tipoSangre: cleanName(row[cols.sangre]),
      mayoria: /mayor/i.test(mayoriaExcel)
        ? 'Mayor'
        : /menor/i.test(mayoriaExcel)
          ? 'Menor'
          : mayoriaDeEdad(fechaNacimiento, tipo),
    })
  }
  return { records }
}

const COLS_FIJAS = { nombre: 0, fechaNac: 1, sangre: 2, mayoria: 3, tipoDoc: 4, doc: 5 }

function findHeader(rows) {
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r] || []
    const idx = { nombre: -1, fechaNac: -1, sangre: -1, mayoria: -1, tipoDoc: -1, doc: -1 }
    row.forEach((cell, c) => {
      const t = stripAccents(cell)
      if (idx.nombre === -1 && /^nombre/.test(t)) idx.nombre = c
      if (idx.fechaNac === -1 && /nacimiento/.test(t)) idx.fechaNac = c
      if (idx.sangre === -1 && /sangre/.test(t)) idx.sangre = c
      if (idx.mayoria === -1 && /mayor|menor/.test(t)) idx.mayoria = c
      if (idx.tipoDoc === -1 && /tipo.*documento/.test(t)) idx.tipoDoc = c
      if (idx.doc === -1 && /(numero|n.?).*documento/.test(t)) idx.doc = c
    })
    if (idx.nombre !== -1 && idx.doc !== -1) {
      return {
        headerIndex: r,
        cols: {
          nombre: idx.nombre,
          fechaNac: idx.fechaNac === -1 ? COLS_FIJAS.fechaNac : idx.fechaNac,
          sangre: idx.sangre === -1 ? COLS_FIJAS.sangre : idx.sangre,
          mayoria: idx.mayoria === -1 ? COLS_FIJAS.mayoria : idx.mayoria,
          tipoDoc: idx.tipoDoc === -1 ? COLS_FIJAS.tipoDoc : idx.tipoDoc,
          doc: idx.doc,
        },
      }
    }
  }
  return { headerIndex: -1, cols: COLS_FIJAS }
}

function mapTipoDoc(value) {
  const t = stripAccents(value)
  if (/tarjeta de identidad/.test(t)) return 'TI'
  if (/extranjeria/.test(t)) return 'CE'
  if (/pasaporte/.test(t)) return 'PA'
  if (/permiso|ppt/.test(t)) return 'PPT'
  return 'CC'
}
