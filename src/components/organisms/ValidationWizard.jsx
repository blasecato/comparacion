import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons'
import Stepper from '../molecules/Stepper'
import ExcelStep from './steps/ExcelStep'
import CedulasStep from './steps/CedulasStep'
import CedulasReviewStep from './steps/CedulasReviewStep'
import PlanillaStep from './steps/PlanillaStep'
import ReviewStep from './steps/ReviewStep'
import AnalyzingStep from './steps/AnalyzingStep'
import ResultsStep from './steps/ResultsStep'
import { compareRecords, compareTriple } from '../../lib/compare'
import './ValidationWizard.css'

const STEPS = [
  { title: 'Datos de Ficha', subtitle: 'Carga el Excel' },
  { title: 'Cédulas', subtitle: 'Carga el Excel de cédulas' },
  { title: 'Revisar Cédulas', subtitle: 'Verifica los datos' },
  { title: 'Comparar Cédulas', subtitle: 'Excel vs cédulas' },
  { title: 'Planilla', subtitle: 'Carga el Excel de planilla' },
  { title: 'Revisar Planilla', subtitle: 'Verifica los datos' },
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
  const [maxReached, setMaxReached] = useState(0)

  // Recuerda el paso más lejano alcanzado (para poder volver clickeando).
  useEffect(() => {
    setMaxReached((m) => Math.max(m, current))
  }, [current])

  // --- datos de la ficha (paso 1) ---
  const [docente, setDocente] = useState('')
  const [poblacion, setPoblacion] = useState('')

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
    instructor: docente || '',
    poblacion,
  }

  const fichaLista = Boolean(excelData && docente.trim() && poblacion)

  const handleCedulas = (data) => {
    setCedulasInfo({ fileName: data.fileName })
    setCedulasRecords(withIds(data.records, 'ced'))
  }

  const handlePlanilla = (data) => {
    setPdfInfo({ meta: data.meta, fileName: data.fileName })
    setPdfRecords(withIds(data.records, 'pla'))
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
    setDocente('')
    setPoblacion('')
    setExcelData(null)
    setCedulasInfo(null)
    setCedulasRecords([])
    setPdfInfo(null)
    setPdfRecords([])
    setResultCedulas(null)
    setResult(null)
    setAnalyzing(false)
    setCurrent(0)
    setMaxReached(0)
  }

  const back = () => setCurrent((c) => c - 1)
  const next = () => setCurrent((c) => c + 1)

  // Salta a un paso ya visitado (conservando todo lo registrado).
  const goToStep = (i) => {
    if (i <= maxReached) {
      setAnalyzing(false)
      setCurrent(i)
    }
  }

  return (
    <div className="wizard">
      <div className="wizard__stepper">
        <Stepper
          steps={STEPS}
          current={current}
          maxReached={maxReached}
          onStepClick={goToStep}
        />
      </div>

      <div className="wizard__panel">
        {current === 0 && (
          <ExcelStep
            data={excelData}
            docente={docente}
            poblacion={poblacion}
            onDocente={setDocente}
            onPoblacion={setPoblacion}
            onParsed={setExcelData}
          />
        )}

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
            title="Paso 4: Comparación Reporte de Inscripción vs Cédulas"
            soloALabel="Solo en Cédulas"
            soloBLabel="Solo en Reporte de Inscripción"
            filePrefix="comparacion_cedulas"
          />
        )}

        {current === 4 && (
          <PlanillaStep
            data={pdfInfo && { ...pdfInfo, records: pdfRecords }}
            onParsed={handlePlanilla}
          />
        )}

        {current === 5 && (
          <ReviewStep records={pdfRecords} onChange={setPdfRecords} />
        )}

        {current === 6 && analyzing && (
          <AnalyzingStep onDone={() => setAnalyzing(false)} />
        )}
        {current === 6 && !analyzing && result && (
          <ResultsStep
            result={result}
            meta={meta}
            title="Paso 7: Resultados de la Validación (Reporte + Cédulas + Planilla)"
            soloALabel="Solo en la Planilla"
            soloCLabel="Solo en las Cédulas"
            soloBLabel="Solo en Reporte de Inscripción"
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
              disabled={!fichaLista}
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
