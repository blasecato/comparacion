import { useState } from 'react'
import { Upload, Alert, Spin, Progress, message } from 'antd'
import { FilePdfOutlined, InboxOutlined } from '@ant-design/icons'
import { parsePdf } from '../../../lib/pdfParser'
import './step.css'

/**
 * Organismo (paso 2): carga y lectura del PDF (planilla de asistencia).
 * Si es escaneo, hace OCR mostrando el progreso.
 */
function PdfStep({ data, onParsed }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)

  const handleFile = async (file) => {
    setLoading(true)
    setProgress({ stage: 'Abriendo PDF…', progress: 0 })
    try {
      const result = await parsePdf(file, setProgress)
      if (!result.records.length) {
        message.warning('No se detectaron participantes. Podrás agregarlos manualmente.')
      } else {
        message.success(`PDF leído: ${result.records.length} participantes.`)
      }
      onParsed({ ...result, fileName: file.name })
    } catch (err) {
      console.error(err)
      message.error('No se pudo leer el PDF. Verifica el archivo.')
    } finally {
      setLoading(false)
      setProgress(null)
    }
    return false
  }

  return (
    <div className="step">
      <h3 className="step__title">Paso 2: Cargar PDF de la planilla</h3>
      <p className="step__hint">
        Sube la planilla de asistencia (.pdf), puede tener varias páginas. Si es
        un escaneo, se aplicará OCR (puede tardar unos segundos por página).
      </p>

      <Spin
        spinning={loading}
        tip={progress ? `${progress.stage} ${progress.progress}%` : 'Procesando…'}
      >
        <Upload.Dragger
          accept=".pdf"
          multiple={false}
          maxCount={1}
          beforeUpload={handleFile}
          showUploadList={false}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Arrastra el PDF aquí o haz clic para seleccionarlo
          </p>
        </Upload.Dragger>
      </Spin>

      {loading && progress && (
        <Progress percent={progress.progress} strokeColor="#7c4dff" />
      )}

      {data && !loading && (
        <Alert
          className="step__result"
          type={data.scanned ? 'warning' : 'success'}
          showIcon
          icon={<FilePdfOutlined />}
          message={`${data.fileName} — ${data.records.length} participantes`}
          description={
            data.scanned
              ? 'PDF escaneado: extraído por OCR. Revísalo en el siguiente paso.'
              : 'Datos extraídos del PDF.'
          }
        />
      )}
    </div>
  )
}

export default PdfStep
