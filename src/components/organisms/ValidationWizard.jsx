import { useState } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons'
import Stepper from '../molecules/Stepper'
import ExcelStep from './steps/ExcelStep'
import CedulasStep from './steps/CedulasStep'
import CedulasReviewStep from './steps/CedulasReviewStep'
import PdfStep from './steps/PdfStep'
import ReviewStep from './steps/ReviewStep'
import AnalyzingStep from './steps/AnalyzingStep'
import ResultsStep from './steps/ResultsStep'
import { compareRecords, compareTriple } from '../../lib/compare'
import './ValidationWizard.css'

const STEPS = [
  { title: 'Datos de Ficha', subtitle: 'Carga el Excel' },
  { title: 'Documentos', subtitle: 'Carga el PDF de cédulas' },
  { title: 'Revisar Documentos', subtitle: 'Verifica la extracción' },
  { title: 'Comparar Cédulas', subtitle: 'Excel vs cédulas' },
  { title: 'Subir PDF', subtitle: 'Carga la planilla' },
  { title: 'Revisar Datos', subtitle: 'Verifica la extracción' },
  { title: 'Comparar', subtitle: 'Excel + cédulas + planilla' },
]

const withIds = (records, prefix) =>
  records.map((r, i) => ({ id: `${prefix}-${i}`, ...r }))

/**
 * Organismo: asistente de validación de 7 pasos.
 *
 * Todo lo extraído se guarda como JSON (arrays de objetos planos,
 * serializables): `excel`, `cedulas` y `planilla` dentro del estado.
 */
function ValidationWizard() {
  const [current, setCurrent] = useState(0)

  // --- datos extraídos (JSON) ---
  const [excelData, setExcelData] = useState(null) // { meta, records[], fileName }
  const [cedulasInfo, setCedulasInfo] = useState(null) // { fileName }
  const [cedulasRecords, setCedulasRecords] = useState([]) // [{ doc, nombre, ... }]
  const [pdfInfo, setPdfInfo] = useState(null) // { meta, fileName, scanned }
  const [pdfRecords, setPdfRecords] = useState([]) // [{ doc, nombre, pag }]

  // --- resultados de comparación (JSON) ---
  const [resultCedulas, setResultCedulas] = useState(null)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const meta = {
    ficha: excelData?.meta.ficha || pdfInfo?.meta.ficha || '',
    programa: excelData?.meta.programa || pdfInfo?.meta.programa || '',
  }

  const handleCedulas = (data) => {
    setCedulasInfo({ fileName: data.fileName })
    setCedulasRecords(withIds(data.records, 'ced'))
  }

  const handlePdf = (data) => {
    setPdfInfo({ meta: data.meta, fileName: data.fileName, scanned: data.scanned })
    setPdfRecords(withIds(data.records, 'pdf'))
  }

  // Paso 4: Excel vs cédulas
  const startCompareCedulas = () => {
    setResultCedulas(
      compareRecords(cedulasRecords, excelData.records, {
        origenA: 'Cédulas',
        origenB: 'Excel',
      })
    )
    setAnalyzing(true)
    setCurrent(3)
  }

  // Paso 7: Excel + cédulas + planilla
  const startCompare = () => {
    setResult(compareTriple(excelData.records, cedulasRecords, pdfRecords))
    setAnalyzing(true)
    setCurrent(6)
  }

  const reset = () => {
    setExcelData(null)
    setCedulasInfo(null)
    setCedulasRecords([])
    setPdfInfo(null)
    setPdfRecords([])
    setResultCedulas(null)
    setResult(null)
    setAnalyzing(false)
    setCurrent(0)
  }

  const back = () => setCurrent((c) => c - 1)
  const next = () => setCurrent((c) => c + 1)

  return (
    <div className="wizard">
      <div className="wizard__stepper">
        <Stepper steps={STEPS} current={current} />
      </div>

      <div className="wizard__panel">
        {current === 0 && <ExcelStep data={excelData} onParsed={setExcelData} />}

        {current === 1 && (
          <CedulasStep
            data={cedulasInfo && { ...cedulasInfo, records: cedulasRecords }}
            onParsed={handleCedulas}
          />
        )}

        {current === 2 && (
          <CedulasReviewStep records={cedulasRecords} onChange={setCedulasRecords} />
        )}

        {current === 3 && analyzing && (
          <AnalyzingStep onDone={() => setAnalyzing(false)} />
        )}
        {current === 3 && !analyzing && resultCedulas && (
          <ResultsStep
            result={resultCedulas}
            meta={meta}
            title="Paso 4: Comparación Excel vs Cédulas"
            soloALabel="Solo en Cédulas"
            soloBLabel="Solo en Excel"
            filePrefix="comparacion_cedulas"
          />
        )}

        {current === 4 && (
          <PdfStep
            data={pdfInfo && { ...pdfInfo, records: pdfRecords }}
            onParsed={handlePdf}
          />
        )}

        {current === 5 && (
          <ReviewStep
            records={pdfRecords}
            scanned={pdfInfo?.scanned}
            onChange={setPdfRecords}
          />
        )}

        {current === 6 && analyzing && (
          <AnalyzingStep onDone={() => setAnalyzing(false)} />
        )}
        {current === 6 && !analyzing && result && (
          <ResultsStep
            result={result}
            meta={meta}
            title="Paso 7: Resultados de la Validación (Excel + Cédulas + Planilla)"
            soloALabel="Solo en PDFs"
            soloBLabel="Solo en Excel"
            filePrefix="validacion"
          />
        )}

        <div className="wizard__footer">
          {current > 0 && !analyzing && current !== 6 && (
            <Button icon={<LeftOutlined />} onClick={back}>
              Atrás
            </Button>
          )}

          {current === 0 && (
            <Button
              type="primary"
              disabled={!excelData}
              onClick={next}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Siguiente
            </Button>
          )}

          {current === 1 && (
            <Button
              type="primary"
              disabled={!cedulasInfo}
              onClick={next}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Revisar documentos
            </Button>
          )}

          {current === 2 && (
            <Button
              type="primary"
              disabled={!cedulasRecords.length}
              onClick={startCompareCedulas}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Comparar con Excel
            </Button>
          )}

          {current === 3 && !analyzing && (
            <Button
              type="primary"
              onClick={next}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Continuar con la planilla
            </Button>
          )}

          {current === 4 && (
            <Button
              type="primary"
              disabled={!pdfInfo}
              onClick={next}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Revisar datos
            </Button>
          )}

          {current === 5 && (
            <Button
              type="primary"
              disabled={!pdfRecords.length}
              onClick={startCompare}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Comparar
            </Button>
          )}

          {current === 6 && !analyzing && (
            <Button icon={<ReloadOutlined />} onClick={reset}>
              Nueva validación
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ValidationWizard
