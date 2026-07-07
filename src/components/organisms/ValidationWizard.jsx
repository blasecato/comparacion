import { useState } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons'
import Stepper from '../molecules/Stepper'
import ExcelStep from './steps/ExcelStep'
import PdfStep from './steps/PdfStep'
import ReviewStep from './steps/ReviewStep'
import AnalyzingStep from './steps/AnalyzingStep'
import ResultsStep from './steps/ResultsStep'
import { compareRecords } from '../../lib/compare'
import './ValidationWizard.css'

const STEPS = [
  { title: 'Datos de Ficha', subtitle: 'Carga el Excel' },
  { title: 'Subir PDF', subtitle: 'Carga tu documento' },
  { title: 'Revisar Datos', subtitle: 'Verifica la extracción' },
  { title: 'Comparar', subtitle: 'Valida con Excel' },
]

const withIds = (records) =>
  records.map((r, i) => ({ id: `pdf-${i}`, ...r }))

/**
 * Organismo: asistente de validación de 4 pasos. Gestiona el estado
 * (Excel, PDF/OCR, revisión editable, resultado) y la navegación.
 */
function ValidationWizard() {
  const [current, setCurrent] = useState(0)
  const [excelData, setExcelData] = useState(null)
  const [pdfInfo, setPdfInfo] = useState(null)
  const [pdfRecords, setPdfRecords] = useState([])
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const meta = {
    ficha: excelData?.meta.ficha || pdfInfo?.meta.ficha || '',
    programa: excelData?.meta.programa || pdfInfo?.meta.programa || '',
  }

  const handlePdf = (data) => {
    setPdfInfo({ meta: data.meta, fileName: data.fileName, scanned: data.scanned })
    setPdfRecords(withIds(data.records))
  }

  const startCompare = () => {
    setResult(compareRecords(pdfRecords, excelData.records))
    setAnalyzing(true)
    setCurrent(3)
  }

  const reset = () => {
    setExcelData(null)
    setPdfInfo(null)
    setPdfRecords([])
    setResult(null)
    setAnalyzing(false)
    setCurrent(0)
  }

  return (
    <div className="wizard">
      <div className="wizard__stepper">
        <Stepper steps={STEPS} current={current} />
      </div>

      <div className="wizard__panel">
        {current === 0 && <ExcelStep data={excelData} onParsed={setExcelData} />}
        {current === 1 && <PdfStep data={pdfInfo && { ...pdfInfo, records: pdfRecords }} onParsed={handlePdf} />}
        {current === 2 && (
          <ReviewStep
            records={pdfRecords}
            scanned={pdfInfo?.scanned}
            onChange={setPdfRecords}
          />
        )}
        {current === 3 && analyzing && (
          <AnalyzingStep onDone={() => setAnalyzing(false)} />
        )}
        {current === 3 && !analyzing && result && (
          <ResultsStep result={result} meta={meta} />
        )}

        <div className="wizard__footer">
          {current === 0 && (
            <Button
              type="primary"
              disabled={!excelData}
              onClick={() => setCurrent(1)}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Siguiente
            </Button>
          )}

          {current === 1 && (
            <>
              <Button icon={<LeftOutlined />} onClick={() => setCurrent(0)}>
                Atrás
              </Button>
              <Button
                type="primary"
                disabled={!pdfInfo}
                onClick={() => setCurrent(2)}
                icon={<RightOutlined />}
                iconPosition="end"
              >
                Revisar datos
              </Button>
            </>
          )}

          {current === 2 && (
            <>
              <Button icon={<LeftOutlined />} onClick={() => setCurrent(1)}>
                Atrás
              </Button>
              <Button
                type="primary"
                disabled={!pdfRecords.length}
                onClick={startCompare}
                icon={<RightOutlined />}
                iconPosition="end"
              >
                Comparar
              </Button>
            </>
          )}

          {current === 3 && !analyzing && (
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
