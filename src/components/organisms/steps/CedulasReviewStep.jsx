import { useState } from 'react'
import { Table, Input, Select, Button, Tag, Popconfirm, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { mayoriaDeEdad } from '../../../lib/cedulaFields'
import './step.css'

let seq = 0
const newRow = () => ({
  id: `ced-new-${seq++}`,
  tipo: 'CC',
  doc: '',
  nombre: '',
  fechaNacimiento: '',
  lugarNacimiento: '',
  fechaExpedicion: '',
  tipoSangre: '',
  pag: '',
})

const PAGE_SIZE = 10
const TIPOS = ['CC', 'TI', 'CE', 'PA', 'PPT']

/**
 * Organismo (paso 3): revisión editable de los datos extraídos del PDF de
 * documentos de identidad. "Mayor/Menor" se calcula solo (fecha de
 * nacimiento, o el tipo de documento si no hay fecha).
 */
function CedulasReviewStep({ records, onChange }) {
  const [page, setPage] = useState(1)

  const update = (id, field, value) =>
    onChange(records.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const remove = (id) => onChange(records.filter((r) => r.id !== id))
  const add = () => onChange([...records, newRow()])

  const text = (field, placeholder, width) => (v, r) => (
    <Input
      size="small"
      value={v}
      placeholder={placeholder}
      style={width ? { width } : undefined}
      onChange={(e) => update(r.id, field, e.target.value)}
    />
  )

  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 48,
      fixed: 'left',
      render: (_, __, i) => (page - 1) * PAGE_SIZE + i + 1,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 90,
      render: (v, r) => (
        <Select
          size="small"
          value={v}
          style={{ width: 78 }}
          options={TIPOS.map((t) => ({ value: t, label: t }))}
          onChange={(val) => update(r.id, 'tipo', val)}
        />
      ),
    },
    {
      title: 'Número',
      dataIndex: 'doc',
      width: 150,
      render: (v, r) => (
        <Input
          size="small"
          value={v}
          placeholder="Documento"
          status={v && !/^\d{6,12}$/.test(v) ? 'warning' : ''}
          onChange={(e) => update(r.id, 'doc', e.target.value.replace(/\D/g, ''))}
        />
      ),
    },
    {
      title: 'Nombre completo',
      dataIndex: 'nombre',
      width: 240,
      render: text('nombre', 'Nombres y apellidos'),
    },
    {
      title: 'Fecha nacimiento',
      dataIndex: 'fechaNacimiento',
      width: 140,
      render: text('fechaNacimiento', 'DD/MM/AAAA'),
    },
    {
      title: 'Lugar nacimiento',
      dataIndex: 'lugarNacimiento',
      width: 190,
      render: text('lugarNacimiento', 'Ciudad (Depto)'),
    },
    {
      title: 'Fecha expedición',
      dataIndex: 'fechaExpedicion',
      width: 140,
      render: text('fechaExpedicion', 'DD/MM/AAAA'),
    },
    {
      title: 'Sangre',
      dataIndex: 'tipoSangre',
      width: 90,
      render: text('tipoSangre', 'O+'),
    },
    {
      title: 'Mayor/Menor',
      key: 'mayoria',
      width: 110,
      render: (_, r) => {
        const cat = mayoriaDeEdad(r.fechaNacimiento, r.tipo)
        return (
          <Tag color={cat === 'Menor' ? 'orange' : 'blue'} bordered={false}>
            {cat}
          </Tag>
        )
      },
    },
    { title: 'Pág.', dataIndex: 'pag', width: 64 },
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
      <h3 className="step__title">Paso 3: Revisar documentos de identidad</h3>
      <p className="step__hint">
        Verifica y corrige los datos extraídos de cada documento. Son
        fotocopias, así que el OCR puede fallar — revisa sobre todo el número
        de documento, las fechas y el tipo de sangre.
      </p>

      <Alert
        type="warning"
        showIcon
        message="Extracción automática (OCR) sobre fotocopias: revisa antes de continuar."
      />

      <div className="review__toolbar">
        <Tag>{records.length} documentos</Tag>
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

export default CedulasReviewStep
