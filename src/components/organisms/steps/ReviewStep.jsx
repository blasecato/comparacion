import { useState } from 'react'
import { Table, Input, Button, Tag, Popconfirm, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import './step.css'

let seq = 0
const newRow = () => ({ id: `new-${seq++}`, doc: '', nombre: '', tipo: 'CC', pag: '' })

const PAGE_SIZE = 15

/**
 * Organismo (paso 3): "Revisar Datos". Tabla editable con lo extraído del
 * PDF. El usuario corrige el borrador del OCR antes de comparar.
 */
function ReviewStep({ records, scanned, onChange }) {
  const [page, setPage] = useState(1)

  const update = (id, field, value) =>
    onChange(records.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  const remove = (id) => onChange(records.filter((r) => r.id !== id))
  const add = () => onChange([...records, newRow()])

  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 48,
      render: (_, __, i) => (page - 1) * PAGE_SIZE + i + 1,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 90,
      render: (v, r) => (
        <Input
          size="small"
          value={v}
          onChange={(e) => update(r.id, 'tipo', e.target.value)}
        />
      ),
    },
    {
      title: 'Número documento',
      dataIndex: 'doc',
      width: 180,
      render: (v, r) => (
        <Input
          size="small"
          value={v}
          placeholder="Cédula"
          status={v && !/^\d{6,11}$/.test(v) ? 'warning' : ''}
          onChange={(e) => update(r.id, 'doc', e.target.value.replace(/[^\d]/g, ''))}
        />
      ),
    },
    {
      title: 'Nombre completo',
      dataIndex: 'nombre',
      render: (v, r) => (
        <Input
          size="small"
          value={v}
          placeholder="Nombres y apellidos"
          onChange={(e) => update(r.id, 'nombre', e.target.value)}
        />
      ),
    },
    {
      title: 'Pág.',
      dataIndex: 'pag',
      width: 70,
      render: (v, r) => (
        <Input
          size="small"
          value={v}
          onChange={(e) => update(r.id, 'pag', e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'del',
      width: 48,
      render: (_, r) => (
        <Popconfirm title="¿Eliminar fila?" onConfirm={() => remove(r.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className="step">
      <h3 className="step__title">Paso 3: Revisar Datos</h3>
      <p className="step__hint">
        Verifica y corrige lo extraído del PDF antes de comparar contra el
        Excel. Puedes editar cualquier celda, agregar o eliminar filas.
      </p>

      {scanned && (
        <Alert
          type="warning"
          showIcon
          message="PDF escaneado: la extracción es automática (OCR) y puede tener errores."
          description="Revisa especialmente los números de documento."
        />
      )}

      <div className="review__toolbar">
        <Tag>{records.length} registros</Tag>
        <Button size="small" icon={<PlusOutlined />} onClick={add}>
          Agregar fila
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        size="small"
        pagination={{
          pageSize: PAGE_SIZE,
          current: page,
          onChange: setPage,
          showSizeChanger: false,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default ReviewStep
