import { useState } from 'react'
import { Table, Input, Select, Button, Tag, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import './step.css'

let seq = 0
const newRow = () => ({
  id: `new-${seq++}`,
  doc: '',
  nombre: '',
  tipo: 'CC',
  pag: '',
  firmo: 'No',
  correo: '',
  telefono: '',
})

const PAGE_SIZE = 15

/**
 * Organismo (paso 6): "Revisar Planilla". Tabla editable con los datos del
 * Excel de la planilla. El usuario corrige antes de comparar.
 */
function ReviewStep({ records, onChange }) {
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
      title: 'Correo',
      dataIndex: 'correo',
      width: 200,
      render: (v, r) => (
        <Input
          size="small"
          value={v || ''}
          placeholder="Correo electrónico"
          onChange={(e) => update(r.id, 'correo', e.target.value)}
        />
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      width: 140,
      render: (v, r) => (
        <Input
          size="small"
          value={v || ''}
          placeholder="Teléfono"
          onChange={(e) => update(r.id, 'telefono', e.target.value)}
        />
      ),
    },
    {
      title: 'Firmó',
      dataIndex: 'firmo',
      width: 90,
      render: (v, r) => (
        <Select
          size="small"
          value={v || 'No'}
          style={{ width: 74 }}
          options={[
            { value: 'Sí', label: 'Sí' },
            { value: 'No', label: 'No' },
          ]}
          onChange={(val) => update(r.id, 'firmo', val)}
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
      <h3 className="step__title">Paso 6: Revisar Planilla</h3>
      <p className="step__hint">
        Verifica y corrige los datos del Excel de la planilla antes de
        comparar. Puedes editar cualquier celda, agregar o eliminar filas.
      </p>

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
