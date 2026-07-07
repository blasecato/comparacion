import { nameKey } from './normalize'

/**
 * Estados posibles de cada registro tras la comparación.
 */
export const STATUS = {
  CORRECTO: 'correcto',
  ERROR: 'error',
  SOLO_PDF: 'solo_pdf',
  SOLO_EXCEL: 'solo_excel',
}

/**
 * Compara los participantes del PDF contra los del Excel usando el número
 * de documento como llave. Devuelve la lista unificada de filas y un
 * resumen por estado.
 *
 * - correcto:    documento en ambos y nombre coincide.
 * - error:       documento en ambos pero el nombre no coincide.
 * - solo_pdf:    documento presente solo en el PDF.
 * - solo_excel:  documento presente solo en el Excel.
 */
export function compareRecords(pdfRecords = [], excelRecords = []) {
  const pdfByDoc = indexByDoc(pdfRecords)
  const excelByDoc = indexByDoc(excelRecords)

  const rows = []
  const docs = new Set([...pdfByDoc.keys(), ...excelByDoc.keys()])

  for (const doc of docs) {
    const pdf = pdfByDoc.get(doc)
    const excel = excelByDoc.get(doc)

    if (pdf && excel) {
      const same = nameKey(pdf.nombre) === nameKey(excel.nombre)
      rows.push({
        key: doc,
        estado: same ? STATUS.CORRECTO : STATUS.ERROR,
        origen: 'Ambos',
        tipo: excel.tipo || pdf.tipo || 'CC',
        numero: doc,
        nombre: excel.nombre || pdf.nombre,
        pag: pdf.pag ?? '',
        novedad: same
          ? 'Datos verificados correctamente'
          : 'El nombre no coincide entre el PDF y el Excel',
        detalle: same
          ? null
          : {
              motivo: 'Nombre diferente para el mismo número de documento',
              pdfNombre: pdf.nombre,
              excelNombre: excel.nombre,
            },
      })
    } else if (pdf) {
      rows.push({
        key: doc,
        estado: STATUS.SOLO_PDF,
        origen: 'Solo PDF',
        tipo: pdf.tipo || 'CC',
        numero: doc,
        nombre: pdf.nombre,
        pag: pdf.pag ?? '',
        novedad: 'Presente en el PDF pero no en el Excel',
      })
    } else {
      rows.push({
        key: doc,
        estado: STATUS.SOLO_EXCEL,
        origen: 'Solo Excel',
        tipo: excel.tipo || 'CC',
        numero: doc,
        nombre: excel.nombre,
        pag: '',
        novedad: 'Presente en el Excel pero no en el PDF',
      })
    }
  }

  rows.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const summary = {
    correctos: rows.filter((r) => r.estado === STATUS.CORRECTO).length,
    errores: rows.filter((r) => r.estado === STATUS.ERROR).length,
    soloPdf: rows.filter((r) => r.estado === STATUS.SOLO_PDF).length,
    soloExcel: rows.filter((r) => r.estado === STATUS.SOLO_EXCEL).length,
  }

  return { rows, summary }
}

function indexByDoc(records) {
  const map = new Map()
  for (const rec of records) {
    if (rec.doc && !map.has(rec.doc)) map.set(rec.doc, rec)
  }
  return map
}
