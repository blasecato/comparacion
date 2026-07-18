import { nameKey } from './normalize'

/**
 * Estados posibles de cada registro tras la comparación.
 */
export const STATUS = {
  CORRECTO: 'correcto',
  ERROR: 'error',
  SOLO_PDF: 'solo_pdf', // solo en la fuente A (planilla / cédulas según el caso)
  SOLO_EXCEL: 'solo_excel', // solo en el reporte de inscripción
  SOLO_CEDULAS: 'solo_cedulas', // solo en las cédulas (comparación triple)
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
export function compareRecords(pdfRecords = [], excelRecords = [], opts = {}) {
  const origenA = opts.origenA || 'PDF'
  const origenB = opts.origenB || 'Excel'
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
          : `El nombre no coincide entre el ${origenA} y el ${origenB}`,
        detalle: same
          ? null
          : {
              motivo: 'Nombre diferente para el mismo número de documento',
              origenA,
              origenB,
              pdfNombre: pdf.nombre,
              excelNombre: excel.nombre,
            },
      })
    } else if (pdf) {
      rows.push({
        key: doc,
        estado: STATUS.SOLO_PDF,
        origen: `Solo ${origenA}`,
        tipo: pdf.tipo || 'CC',
        numero: doc,
        nombre: pdf.nombre,
        pag: pdf.pag ?? '',
        novedad: `Presente en el ${origenA} pero no en el ${origenB}`,
      })
    } else {
      rows.push({
        key: doc,
        estado: STATUS.SOLO_EXCEL,
        origen: `Solo ${origenB}`,
        tipo: excel.tipo || 'CC',
        numero: doc,
        nombre: excel.nombre,
        pag: '',
        novedad: `Presente en el ${origenB} pero no en el ${origenA}`,
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

/**
 * Comparación de las TRES fuentes: Excel, PDF de cédulas y PDF de planilla.
 * La llave sigue siendo el número de documento.
 *
 * Además del estado, cada fila trae:
 *  - `documento`: 'OK' si la persona aparece en las tres fuentes con el mismo
 *    número; 'No coincide' si falta en alguna.
 *  - `firmo`: 'Sí' / 'No' según la firma detectada en la planilla ('—' si la
 *    persona no está en la planilla).
 */
export function compareTriple(excelRecords = [], cedulasRecords = [], planillaRecords = []) {
  const ex = indexByDoc(excelRecords)
  const ce = indexByDoc(cedulasRecords)
  const pl = indexByDoc(planillaRecords)

  const rows = []
  const docs = new Set([...ex.keys(), ...ce.keys(), ...pl.keys()])

  for (const doc of docs) {
    const e = ex.get(doc)
    const c = ce.get(doc)
    const p = pl.get(doc)

    const fuentes = []
    if (e) fuentes.push('Excel')
    if (c) fuentes.push('Cédulas')
    if (p) fuentes.push('Planilla')

    const enLasTres = Boolean(e && c && p)
    const nombres = [e?.nombre, c?.nombre, p?.nombre].filter(Boolean)
    const nombresIguales =
      nombres.length > 1 && nombres.every((n) => nameKey(n) === nameKey(nombres[0]))

    // Solo en una fuente = presente en esa y ausente en las otras dos.
    const soloExcel = e && !c && !p
    const soloCedulas = c && !e && !p
    const soloPlanilla = p && !e && !c

    let estado
    if (enLasTres && nombresIguales) estado = STATUS.CORRECTO
    else if (soloExcel) estado = STATUS.SOLO_EXCEL
    else if (soloCedulas) estado = STATUS.SOLO_CEDULAS
    else if (soloPlanilla) estado = STATUS.SOLO_PDF
    else estado = STATUS.ERROR

    const faltantes = ['Excel', 'Cédulas', 'Planilla'].filter((f) => !fuentes.includes(f))
    let novedad
    if (estado === STATUS.CORRECTO) novedad = 'Datos verificados en las tres fuentes'
    else if (!nombresIguales && fuentes.length > 1 && !faltantes.length)
      novedad = 'El nombre no coincide entre las fuentes'
    else novedad = `No aparece en: ${faltantes.join(', ')}`

    rows.push({
      key: doc,
      estado,
      origen: fuentes.join(' + ') || '—',
      tipo: c?.tipo || e?.tipo || p?.tipo || 'CC',
      numero: doc,
      nombre: e?.nombre || c?.nombre || p?.nombre || '',
      pag: p?.pag ?? c?.pag ?? '',
      documento: enLasTres ? 'OK' : 'No coincide',
      firmo: p ? p.firmo || 'No' : '—',
      correo: p ? p.correo || '' : '',
      telefono: p ? p.telefono || '' : '',
      novedad,
      detalle:
        estado === STATUS.CORRECTO
          ? null
          : {
              motivo: novedad,
              origenA: 'Cédulas',
              origenB: 'Excel',
              pdfNombre: c?.nombre || p?.nombre || '—',
              excelNombre: e?.nombre || '—',
              fuentes: fuentes.join(', ') || 'ninguna',
              faltantes: faltantes.join(', ') || 'ninguna',
              planillaNombre: p?.nombre || '—',
            },
    })
  }

  rows.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return {
    rows,
    summary: {
      correctos: rows.filter((r) => r.estado === STATUS.CORRECTO).length,
      errores: rows.filter((r) => r.estado === STATUS.ERROR).length,
      soloPdf: rows.filter((r) => r.estado === STATUS.SOLO_PDF).length,
      soloExcel: rows.filter((r) => r.estado === STATUS.SOLO_EXCEL).length,
      soloCedulas: rows.filter((r) => r.estado === STATUS.SOLO_CEDULAS).length,
    },
  }
}

function indexByDoc(records) {
  const map = new Map()
  for (const rec of records) {
    if (rec.doc && !map.has(rec.doc)) map.set(rec.doc, rec)
  }
  return map
}
