import * as XLSX from 'xlsx'
import { STATUS } from './compare'
import { ageCategory } from './normalize'

const ESTADO_LABEL = {
  [STATUS.CORRECTO]: 'Correcto',
  [STATUS.ERROR]: 'Con Error',
  [STATUS.SOLO_PDF]: 'Solo en PDF',
  [STATUS.SOLO_EXCEL]: 'Solo en Excel',
}

/**
 * Exporta filas de resultados a un archivo Excel (.xlsx) y dispara la
 * descarga en el navegador.
 *
 * @param {Array} rows   filas ya filtradas (lo que ve el usuario)
 * @param {string} filename  nombre de archivo sin extensión
 */
export function exportRowsToExcel(rows, filename = 'validacion') {
  const data = rows.map((r, i) => ({
    '#': i + 1,
    Estado: ESTADO_LABEL[r.estado] || r.estado,
    Origen: r.origen,
    Tipo: r.tipo,
    'Mayor/Menor': ageCategory(r.tipo),
    Numero: r.numero,
    Nombre: r.nombre,
    'Nombre PDF': r.detalle?.pdfNombre || '',
    'Nombre Excel': r.detalle?.excelNombre || '',
    'Correo': r.correo || '',
    'Teléfono': r.telefono || '',
    Documento: r.documento || '',
    'Firmó': r.firmo || '',
    'Pag.': r.pag || '',
    Novedad: r.novedad,
  }))

  const sheet = XLSX.utils.json_to_sheet(data)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Resultados')
  XLSX.writeFile(book, `${filename}.xlsx`)
}
