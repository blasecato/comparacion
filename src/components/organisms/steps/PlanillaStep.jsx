import { useState } from 'react'
import { Upload, Alert, Spin, message } from 'antd'
import { FileExcelOutlined, InboxOutlined } from '@ant-design/icons'
import { parsePlanillaExcel } from '../../../lib/planillaExcelParser'
import './step.css'

/**
 * Organismo (paso 5): carga del Excel de la planilla de asistencia
 * (documento, nombres, apellidos y estado de firma).
 */
function PlanillaStep({ data, onParsed }) {
  const [loading, setLoading] = useState(false)

  const handleFile = async (file) => {
    setLoading(true)
    try {
      const result = await parsePlanillaExcel(file)
      if (!result.records.length) {
        message.warning('No se encontraron registros en el Excel.')
      } else {
        message.success(`Excel leído: ${result.records.length} registros.`)
      }
      onParsed({ ...result, fileName: file.name })
    } catch (err) {
      console.error(err)
      message.error('No se pudo leer el Excel de la planilla.')
    } finally {
      setLoading(false)
    }
    return false
  }

  return (
    <div className="step">
      <h3 className="step__title">Paso 5: Cargar Excel de la planilla</h3>
      <p className="step__hint">
        Sube el Excel de la planilla de asistencia: número de documento,
        nombres, apellidos y estado de firma (Firmó / No firmó).
      </p>

      <Spin spinning={loading}>
        <Upload.Dragger
          accept=".xlsx,.xls"
          multiple={false}
          maxCount={1}
          beforeUpload={handleFile}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Arrastra el Excel de la planilla aquí o haz clic para seleccionarlo
          </p>
        </Upload.Dragger>
      </Spin>

      {data && (
        <Alert
          className="step__result"
          type="success"
          showIcon
          icon={<FileExcelOutlined />}
          message={`${data.fileName} — ${data.records.length} registros`}
          description={
            data.meta?.ficha
              ? `Ficha ${data.meta.ficha} · ${data.meta.programa}`
              : 'Revísalo en el siguiente paso.'
          }
        />
      )}
    </div>
  )
}

export default PlanillaStep
