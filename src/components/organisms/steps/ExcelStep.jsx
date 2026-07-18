import { useState } from 'react'
import { Upload, Alert, Spin, Input, Button, message } from 'antd'
import { FileExcelOutlined, InboxOutlined } from '@ant-design/icons'
import { parseExcel } from '../../../lib/excelParser'
import './step.css'

const POBLACIONES = ['PV', 'CAMPESINA', 'REGULAR', 'TECNOACADEMIA']

/**
 * Organismo (paso 1): datos de la ficha. Nombre del docente + tipo de
 * población + carga y lectura del Excel de inscripciones.
 */
function ExcelStep({ data, docente, poblacion, onDocente, onPoblacion, onParsed }) {
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
      <h3 className="step__title">Paso 1: Datos de la Ficha</h3>

      <div className="field">
        <label className="field__label">
          Nombre del docente <span className="field__req">*</span>
        </label>
        <Input
          placeholder="Escribe el nombre del instructor"
          value={docente}
          onChange={(e) => onDocente(e.target.value)}
          allowClear
        />
      </div>

      <div className="field">
        <label className="field__label">
          Tipo de población <span className="field__req">*</span>
        </label>
        <div className="poblacion-group">
          {POBLACIONES.map((p) => (
            <Button
              key={p}
              type={poblacion === p ? 'primary' : 'default'}
              className="poblacion-group__btn"
              onClick={() => onPoblacion(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field__label">
          Excel de inscripciones <span className="field__req">*</span>
        </label>
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
      </div>

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
