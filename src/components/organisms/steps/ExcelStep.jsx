import { useState } from 'react'
import { Upload, Alert, Spin, message } from 'antd'
import { FileExcelOutlined, InboxOutlined } from '@ant-design/icons'
import { parseExcel } from '../../../lib/excelParser'
import './step.css'

/**
 * Organismo (paso 1): carga y lectura del Excel de inscripciones.
 */
function ExcelStep({ data, onParsed }) {
  const [loading, setLoading] = useState(false)

  const handleFile = async (file) => {
    setLoading(true)
    try {
      const result = await parseExcel(file)
      if (!result.records.length) {
        message.warning('No se encontraron registros en el Excel.')
      } else {
        message.success(`Excel leído: ${result.records.length} registros.`)
      }
      onParsed({ ...result, fileName: file.name })
    } catch (err) {
      console.error(err)
      message.error('No se pudo leer el Excel. Verifica el archivo.')
    } finally {
      setLoading(false)
    }
    return false
  }

  return (
    <div className="step">
      <h3 className="step__title">Paso 1: Cargar Excel de inscripciones</h3>
      <p className="step__hint">
        Sube el reporte de inscripciones (.xlsx / .xls). Leeremos la tabla de
        participantes (identificación, nombre y estado).
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
            Arrastra el Excel aquí o haz clic para seleccionarlo
          </p>
        </Upload.Dragger>
      </Spin>

      {data && (
        <Alert
          className="step__result"
          type="success"
          showIcon
          icon={<FileExcelOutlined />}
          message={`${data.fileName} — ${data.records.length} participantes`}
          description={
            data.meta.ficha || data.meta.programa
              ? `Ficha ${data.meta.ficha} · ${data.meta.programa}`
              : 'Datos de participantes cargados.'
          }
        />
      )}
    </div>
  )
}

export default ExcelStep
