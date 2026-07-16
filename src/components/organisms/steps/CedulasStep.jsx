import { useState } from 'react'
import { Upload, Alert, Spin, Progress, message } from 'antd'
import { IdcardOutlined, InboxOutlined } from '@ant-design/icons'
import { parseCedulas } from '../../../lib/cedulaParser'
import './step.css'

/**
 * Organismo (paso 2): carga del PDF de documentos de identidad (cédulas,
 * tarjetas de identidad, pasaportes). Recorre todas las páginas con OCR.
 */
function CedulasStep({ data, onParsed }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)

  const handleFile = async (file) => {
    setLoading(true)
    setProgress({ stage: 'Abriendo PDF…', progress: 0 })
    try {
      const result = await parseCedulas(file, setProgress)
      if (!result.records.length) {
        message.warning('No se detectaron documentos. Podrás agregarlos manualmente.')
      } else {
        message.success(`PDF leído: ${result.records.length} documentos.`)
      }
      onParsed({ ...result, fileName: file.name })
    } catch (err) {
      console.error(err)
      message.error('No se pudo leer el PDF de documentos.')
    } finally {
      setLoading(false)
      setProgress(null)
    }
    return false
  }

  return (
    <div className="step">
      <h3 className="step__title">Paso 2: Cargar PDF de documentos de identidad</h3>
      <p className="step__hint">
        Sube el PDF con las cédulas, tarjetas de identidad o pasaportes. Se
        recorren todas las páginas con OCR para extraer los datos de cada
        persona. Puede tardar unos segundos por documento.
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
            Arrastra el PDF de documentos aquí o haz clic para seleccionarlo
          </p>
        </Upload.Dragger>
      </Spin>

      {loading && progress && (
        <Progress percent={progress.progress} strokeColor="#7c4dff" />
      )}

      {data && !loading && (
        <Alert
          className="step__result"
          type="warning"
          showIcon
          icon={<IdcardOutlined />}
          message={`${data.fileName} — ${data.records.length} documentos`}
          description="Extraído por OCR sobre fotocopias. Revísalo en el siguiente paso."
        />
      )}
    </div>
  )
}

export default CedulasStep
