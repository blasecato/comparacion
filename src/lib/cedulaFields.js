import { cleanName, stripAccents } from './normalize'

/** Utilidades puras para leer los campos de una cédula / tarjeta de identidad
 *  a partir del texto OCR. Sin dependencias de pdfjs ni del navegador. */

const MESES = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', SET: '09', OCT: '10', NOV: '11', DIC: '12',
}

// Fechas tipo "10-FEB-2010". El OCR cambia guiones por = . _ ~ y a veces
// mete espacios dentro del mes ("02-SE P-2010").
const DATE_RE =
  /(\d\s?\d?)\s*[-–=_.~]\s*([A-ZÑ]\s?[A-ZÑ]\s?[A-ZÑ])[A-ZÑ]*\s*[-–=_.~]\s*(\d\s?\d\s?\d\s?\d)/
const DATE_RE_G = new RegExp(DATE_RE.source, 'g')

/** "10-FEB-2010" (con o sin espacios sueltos del OCR) -> "10/02/2010" */
function toDate(match) {
  const [, dRaw, mesRaw, yRaw] = match
  const mes = MESES[stripAccents(mesRaw).replace(/\s/g, '').toUpperCase()]
  if (!mes) return null
  const d = dRaw.replace(/\s/g, '')
  const y = yRaw.replace(/\s/g, '')
  const dia = Number(d)
  if (!dia || dia > 31) return null
  return `${d.padStart(2, '0')}/${mes}/${y}`
}

/** Todas las fechas presentes en un texto, en orden de aparición. */
function allDates(text) {
  const out = []
  for (const m of text.matchAll(DATE_RE_G)) {
    const v = toDate(m)
    if (v) out.push(v)
  }
  return out
}

/** Elige la fecha de nacimiento: la más antigua con edad plausible (0-100). */
function pickNacimiento(dates) {
  const hoy = Date.now()
  const cand = dates
    .map((v) => ({ v, t: parseDMY(v)?.getTime() }))
    .filter(({ t }) => {
      if (!t || t > hoy) return false
      const edad = (hoy - t) / (365.25 * 24 * 3600 * 1000)
      return edad >= 0 && edad <= 100
    })
    .sort((a, b) => a.t - b.t)
  return cand.length ? cand[0].v : null
}

function parseDMY(value) {
  if (!value) return null
  const [d, m, y] = value.split('/').map(Number)
  return new Date(y, m - 1, d)
}

/** Mayor/Menor: por fecha de nacimiento si existe; si no, por tipo (TI = menor). */
export function mayoriaDeEdad(fechaNacimiento, tipo) {
  const nac = parseDMY(fechaNacimiento)
  if (nac && !Number.isNaN(nac.getTime())) {
    const hoy = new Date()
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad >= 18 ? 'Mayor' : 'Menor'
  }
  return /ti/i.test(tipo || '') ? 'Menor' : 'Mayor'
}

function detectTipo(norm) {
  if (/tarjeta de identidad/.test(norm)) return 'TI'
  if (/cedula de extranjeria/.test(norm)) return 'CE'
  if (/pasaporte/.test(norm)) return 'PA'
  if (/permiso.*(permanencia|proteccion)|ppt/.test(norm)) return 'PPT'
  if (/cedula de ciudadania|identificacion personal/.test(norm)) return 'CC'
  return 'CC'
}

/** Línea que parece un nombre (no una etiqueta impresa de la tarjeta). */
function looksLikeName(line) {
  const norm = stripAccents(line)
  if (norm.replace(/[^a-z]/g, '').length < 3) return false
  if (/apellido|nombre|numero|republica|colombia|identificacion|tarjeta|cedula|firma|fecha|lugar|vencimiento|expedicion|registrador|sexo|indice/.test(norm))
    return false
  return /[A-Za-zÑñÁÉÍÓÚáéíóú]/.test(line)
}

/** Deja solo letras y espacios: el OCR agrega basura como "; ... — » |". */
function sanitizeName(line) {
  return cleanName(line.replace(/[^A-Za-zÑñÁÉÍÓÚÜáéíóúü ]+/g, ' '))
}

/** Valor de la línea anterior no vacía a la etiqueta dada. */
function valueAbove(lines, labelIdx) {
  for (let i = labelIdx - 1; i >= 0 && i >= labelIdx - 3; i--) {
    const l = cleanName(lines[i])
    if (l && looksLikeName(l)) {
      const clean = sanitizeName(l)
      if (clean.replace(/\s/g, '').length >= 3) return clean
    }
  }
  return ''
}

/**
 * Segunda pasada, dirigida a la franja derecha del reverso del documento,
 * donde siempre van las fechas (nacimiento arriba, luego vencimiento y
 * expedición). El OCR de esa zona aislada conserva las etiquetas, así que
 * cada fecha se asigna por su etiqueta y no por adivinanza.
 *
 * Recibe el texto OCR de la franja derecha (PSM 4).
 */
export function parseBackFields(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const norm = lines.map((l) => stripAccents(l))

  const dateAt = (i) => {
    if (i < 0 || i >= lines.length) return null
    const m = lines[i].match(DATE_RE)
    return m ? toDate(m) : null
  }
  // La fecha puede estar en la misma línea de la etiqueta o justo encima.
  const dateFor = (test) => {
    const i = norm.findIndex(test)
    if (i === -1) return null
    return dateAt(i) || dateAt(i - 1) || dateAt(i + 1)
  }

  const fechaNacimiento = dateFor((l) => /fecha de naci/.test(l))
  const fechaVencimiento = dateFor((l) => /vencimiento/.test(l))
  const fechaExpedicion = dateFor((l) => /expedici/.test(l))

  // Lugar de nacimiento: líneas entre la fecha de nacimiento y su etiqueta.
  let lugarNacimiento = ''
  const lugarIdx = norm.findIndex((l) => /lugar de naci/.test(l))
  if (lugarIdx !== -1) {
    const partes = []
    for (let i = lugarIdx - 1; i >= 0 && i >= lugarIdx - 3; i--) {
      const l = cleanName(lines[i])
      if (!l || DATE_RE.test(l) || /fecha de naci/.test(stripAccents(l))) break
      partes.unshift(l)
    }
    lugarNacimiento = cleanName(partes.join(' '))
  }

  // Tipo de sangre: junto a la etiqueta "G S RH".
  let tipoSangre = ''
  const rhIdx = norm.findIndex((l) => /g\s*s\s*rh/.test(l))
  const rhSource = rhIdx !== -1 ? `${lines[rhIdx - 1] || ''} ${lines[rhIdx]}` : text
  const rh = rhSource.match(/\b(AB|A|B|O)\s*([+-])/) || rhSource.match(/\b(AB|A|B|O)\b/)
  if (rh) tipoSangre = `${rh[1]}${rh[2] || ''}`

  return {
    fechaNacimiento,
    fechaVencimiento,
    fechaExpedicion,
    lugarNacimiento,
    tipoSangre,
    dates: allDates(text),
    raw: text,
  }
}

/**
 * Extrae los datos de una cédula / tarjeta de identidad a partir del texto
 * OCR de la página. Devuelve un borrador: el OCR sobre fotocopias es
 * imperfecto y el usuario corrige en el paso de revisión.
 *
 * @param {string} text  OCR de la página completa
 * @param {number} page
 * @param {object} [back] resultado de parseBackFields (pasada dirigida)
 */
export function parseCedulaText(text, page, back = null) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const normLines = lines.map((l) => stripAccents(l))
  const fullNorm = normLines.join(' ')

  const tipo = detectTipo(fullNorm)

  // --- número: la línea del código de barras es la más confiable. El OCR
  //     confunde el 1 inicial con 4 al leer "1.119.215.202" en el frente. ---
  let doc = ''
  const barcode = `${text}\n${back?.raw || ''}`.match(/F[-\s.]?(\d{8,12})/)
  if (barcode) doc = barcode[1]
  if (!doc) {
    const idx = normLines.findIndex((l) => /numero|nuvero|nro/.test(l))
    if (idx !== -1) {
      const digits = lines[idx].replace(/\D/g, '')
      if (digits.length >= 6) doc = digits
    }
  }
  if (!doc) {
    const any = lines.map((l) => l.replace(/\D/g, '')).find((d) => d.length >= 8 && d.length <= 12)
    doc = any || ''
  }

  // --- nombres y apellidos (la etiqueta va debajo del valor) ---
  const apeIdx = normLines.findIndex((l) => /^apell/.test(l) || /apellido/.test(l))
  const nomIdx = normLines.findIndex((l) => /^nombres?\b/.test(l))
  const apellidos = apeIdx !== -1 ? valueAbove(lines, apeIdx) : ''
  const nombres = nomIdx !== -1 ? valueAbove(lines, nomIdx) : ''

  // --- fechas ---
  const dates = []
  lines.forEach((l, i) => {
    const m = l.match(DATE_RE)
    const val = m && toDate(m)
    if (val) dates.push({ val, i })
  })

  const findDateFor = (test) => {
    const idx = normLines.findIndex(test)
    if (idx === -1) return null
    const same = dates.find((d) => d.i === idx)
    if (same) return same.val
    const near = dates.find((d) => Math.abs(d.i - idx) === 1)
    return near ? near.val : null
  }

  let fechaNacimiento = findDateFor((l) => /fecha de naci/.test(l))
  let fechaExpedicion = findDateFor((l) => /expedicion/.test(l))
  const fechaVencimiento = findDateFor((l) => /vencimiento/.test(l))

  // Fallback: con 3 fechas el orden natural es nacimiento < expedición < vencimiento
  if ((!fechaNacimiento || !fechaExpedicion) && dates.length >= 3) {
    const orden = [...dates]
      .map((d) => ({ ...d, t: parseDMY(d.val).getTime() }))
      .sort((a, b) => a.t - b.t)
    if (!fechaNacimiento) fechaNacimiento = orden[0].val
    if (!fechaExpedicion) fechaExpedicion = orden[1].val
  }

  // --- lugar de nacimiento: líneas entre la fecha de nacimiento y su etiqueta ---
  let lugarNacimiento = ''
  const lugarIdx = normLines.findIndex((l) => /lugar/.test(l) && !/expedi/.test(l))
  if (lugarIdx !== -1) {
    const partes = []
    for (let i = lugarIdx - 1; i >= 0 && i >= lugarIdx - 2; i--) {
      const l = cleanName(lines[i])
      if (!l || DATE_RE.test(l)) break
      partes.unshift(l.replace(/fecha de naci\w*/i, '').trim())
    }
    lugarNacimiento = cleanName(partes.join(' '))
  }

  // --- tipo de sangre (G S RH). El OCR falla seguido: queda editable. ---
  let tipoSangre = ''
  const rh = text.match(/\b(AB|A|B|O)\s*([+-])/)
  if (rh) tipoSangre = `${rh[1]}${rh[2]}`

  const nombre = cleanName(`${nombres} ${apellidos}`)
  if (!doc && !nombre) return null

  // La pasada dirigida al reverso es más confiable para fechas, lugar y RH.
  // Si aun así no hay fecha de nacimiento, se busca entre TODAS las fechas
  // vistas en cualquiera de las dos pasadas (la más antigua plausible).
  const union = [...allDates(text), ...(back?.dates || [])]
  const nacimiento =
    back?.fechaNacimiento || fechaNacimiento || pickNacimiento(union) || ''
  const expedicion = back?.fechaExpedicion || fechaExpedicion || ''

  return {
    pag: page,
    nombre,
    nombres,
    apellidos,
    tipo,
    doc,
    fechaNacimiento: nacimiento,
    lugarNacimiento: back?.lugarNacimiento || lugarNacimiento,
    fechaExpedicion: expedicion,
    fechaVencimiento: back?.fechaVencimiento || fechaVencimiento || '',
    tipoSangre: back?.tipoSangre || tipoSangre,
    mayoria: mayoriaDeEdad(nacimiento, tipo),
  }
}
