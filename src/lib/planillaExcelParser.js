import * as XLSX from 'xlsx'
import { normalizeDoc, cleanName, stripAccents } from './normalize'

/**
 * Lee el Excel de la planilla de asistencia. Soporta el formato actual:
 *   Nombre Completo | Tipo de Documento | Número de Documento | Correo | Teléfono | Firma
 * y el anterior (Nombres + Apellidos por separado, con encabezado de ficha).
 *
 * La columna Firma trae "sí firmó" / "no firmó" (o "Firmó" / "No firmó").
 */
export async function parsePlanillaExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, raw: false })

  const meta = extractMeta(rows)
  const { headerIndex, cols } = findHeader(rows)
  const start = headerIndex === -1 ? 0 : headerIndex + 1

  const records = []
  let n = 0
  for (let r = start; r < rows.length; r++) {
    const row = rows[r]
    if (!row) continue

    const nombre =
      cols.nombre !== -1
        ? cleanName(row[cols.nombre])
        : cleanName(
            `${cleanName(row[cols.nombres])} ${cleanName(row[cols.apellidos])}`
          )
    const doc = normalizeDoc(row[cols.doc])
    if (!doc && !nombre) continue

    const firmaTxt = stripAccents(row[cols.firma])
    const firmo = /no\s*firm/.test(firmaTxt)
      ? 'No'
      : /firm|si|x/.test(firmaTxt)
        ? 'Sí'
        : ''

    n++
    records.push({
      doc,
      nombre,
      tipo: mapTipoDoc(row[cols.tipoDoc]),
      firmo,
      pag: String(n),
      correo: cols.correo !== -1 && row[cols.correo] ? String(row[cols.correo]).trim() : '',
      telefono: cols.telefono !== -1 && row[cols.telefono] ? String(row[cols.telefono]).trim() : '',
    })
  }
  return { meta, records }
}

const COLS_FIJAS = {
  nombre: 0,
  tipoDoc: 1,
  doc: 2,
  nombres: -1,
  apellidos: -1,
  firma: 5,
  correo: 3,
  telefono: 4,
}


function findHeader(rows) {
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r] || []
    const idx = {
      nombre: -1,
      nombres: -1,
      apellidos: -1,
      tipoDoc: -1,
      doc: -1,
      firma: -1,
      correo: -1,
      telefono: -1,
    }
    row.forEach((cell, c) => {
      const t = stripAccents(cell)
      if (idx.nombre === -1 && /nombre completo/.test(t)) idx.nombre = c
      if (idx.nombres === -1 && /^nombres/.test(t)) idx.nombres = c
      if (idx.apellidos === -1 && /apellidos?/.test(t)) idx.apellidos = c
      if (idx.tipoDoc === -1 && /tipo.*documento/.test(t)) idx.tipoDoc = c
      if (idx.doc === -1 && /(numero|n.?).*documento/.test(t)) idx.doc = c
      if (idx.firma === -1 && /firma/.test(t)) idx.firma = c
      if (idx.correo === -1 && /correo|email/.test(t)) idx.correo = c
      if (idx.telefono === -1 && /telefono|celular/.test(t)) idx.telefono = c
    })
    // encabezado válido si hay una columna de nombre y una de documento
    const tieneNombre = idx.nombre !== -1 || (idx.nombres !== -1 && idx.apellidos !== -1)
    if (tieneNombre && idx.doc !== -1) {
      return {
        headerIndex: r,
        cols: {
          nombre: idx.nombre,
          nombres: idx.nombres,
          apellidos: idx.apellidos,
          tipoDoc: idx.tipoDoc === -1 ? COLS_FIJAS.tipoDoc : idx.tipoDoc,
          doc: idx.doc,
          firma: idx.firma === -1 ? COLS_FIJAS.firma : idx.firma,
          correo: idx.correo === -1 ? COLS_FIJAS.correo : idx.correo,
          telefono: idx.telefono === -1 ? COLS_FIJAS.telefono : idx.telefono,
        },
      }
    }
  }
  return { headerIndex: -1, cols: COLS_FIJAS }
}

function mapTipoDoc(value) {
  const t = stripAccents(value)
  if (/^ti|tarjeta de identidad/.test(t)) return 'TI'
  if (/extranjeria|^ce/.test(t)) return 'CE'
  if (/pasaporte|^pa/.test(t)) return 'PA'
  if (/permiso|ppt/.test(t)) return 'PPT'
  return 'CC'
}

function extractMeta(rows) {
  const meta = { ficha: '', programa: '' }
  for (const row of rows) {
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      const label = stripAccents(row[c])
      const next = cleanName(row[c + 1])
      if (/^ficha/.test(label) && next) meta.ficha = normalizeDoc(next) || next
      if (/^progr/.test(label) && next) meta.programa = next
    }
  }
  return meta
}
