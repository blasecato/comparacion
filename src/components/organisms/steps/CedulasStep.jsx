import { useState } from 'react'
import { Upload, Alert, Spin, message } from 'antd'
import { IdcardOutlined, InboxOutlined } from '@ant-design/icons'
import { parseCedulasExcel } from '../../../lib/cedulasExcelParser'
import './step.css'

/**
 * Organismo (paso 2): carga del Excel de cédulas (nombre, fecha de
 * nacimiento, tipo de sangre, mayor/menor, tipo y número de documento).
 */
function CedulasStep({ data, onParsed }) {
  const [loading, setLoading] = useState(false)

  const handleFile = async (file) => {
    setLoading(true)
    try {
      const result = await parseCedulasExcel(file)
      if (!result.records.length) {
        message.warning('No se encontraron registros en el Excel.')
      } else {
        message.success(`Excel leído: ${result.records.length} registros.`)
      }
      onParsed({ ...result, fileName: file.name })
    } catch (err) {
      console.error(err)
      message.error('No se pudo leer el Excel de cédulas.')
    } finally {
      setLoading(false)
    }
    return false
  }

  return (
    <div className="step">
      <h3 className="step__title">Paso 2: Cargar Excel de cédulas</h3>
      <p className="step__hint">
        Sube el Excel con los datos de los documentos: nombre, fecha de
        nacimiento, tipo de sangre, mayor/menor, tipo y número de documento.
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
            Arrastra el Excel de cédulas aquí o haz clic para seleccionarlo
          </p>
        </Upload.Dragger>
      </Spin>

      {data && (
        <Alert
          className="step__result"
          type="success"
          showIcon
          icon={<IdcardOutlined />}
          message={`${data.fileName} — ${data.records.length} documentos`}
          description="Revísalo en el siguiente paso."
        />
      )}
    </div>
  )
}

export default CedulasStep
