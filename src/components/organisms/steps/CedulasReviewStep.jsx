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
  tipoSangre: '',
  mayoria: '',
})

const PAGE_SIZE = 10
const TIPOS = ['CC', 'TI', 'CE', 'PA', 'PPT']

const okDoc = (v) => /^\d{6,11}$/.test(v || '')
const okFecha = (v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v || '')
const okTexto = (v) => (v || '').trim().length >= 3

/** Campos que faltan o están mal en una fila (para resaltar y contar). */
function issuesDe(r) {
  const bad = []
  if (!okDoc(r.doc)) bad.push('doc')
  if (!okTexto(r.nombre)) bad.push('nombre')
  if (!okFecha(r.fechaNacimiento)) bad.push('fechaNacimiento')
  return bad
}

/**
 * Organismo (paso 3): revisión editable de los datos del Excel de cédulas.
 * "Mayor/Menor" viene del Excel o se calcula desde la fecha de nacimiento.
 */
function CedulasReviewStep({ records, onChange }) {
  const [page, setPage] = useState(1)

  const update = (id, field, value) =>
    onChange(records.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const remove = (id) => onChange(records.filter((r) => r.id !== id))
  const add = () => onChange([...records, newRow()])

  const totalIssues = records.reduce((n, r) => n + issuesDe(r).length, 0)
  const filasConIssues = records.filter((r) => issuesDe(r).length > 0).length

  // validator opcional: si el valor no pasa, el input se resalta.
  const text = (field, placeholder, validator) => (v, r) => (
    <Input
      size="small"
      value={v}
      placeholder={placeholder}
      status={validator && !validator(v) ? 'warning' : ''}
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
          status={okDoc(v) ? '' : 'warning'}
          onChange={(e) => update(r.id, 'doc', e.target.value.replace(/\D/g, ''))}
        />
      ),
    },
    {
      title: 'Nombre completo',
      dataIndex: 'nombre',
      width: 240,
      render: text('nombre', 'Nombres y apellidos', okTexto),
    },
    {
      title: 'Fecha nacimiento',
      dataIndex: 'fechaNacimiento',
      width: 140,
      render: text('fechaNacimiento', 'DD/MM/AAAA', okFecha),
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
        const cat = /menor/i.test(r.mayoria)
          ? 'Menor'
          : /mayor/i.test(r.mayoria)
            ? 'Mayor'
            : mayoriaDeEdad(r.fechaNacimiento, r.tipo)
        return (
          <Tag color={cat === 'Menor' ? 'orange' : 'blue'} bordered={false}>
            {cat}
          </Tag>
        )
      },
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
      <h3 className="step__title">Paso 3: Revisar cédulas</h3>
      <p className="step__hint">
        Verifica y corrige los datos del Excel de cédulas antes de comparar.
        Puedes editar cualquier celda, agregar o eliminar filas.
      </p>

      {filasConIssues > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`${filasConIssues} de ${records.length} documentos tienen campos por revisar (${totalIssues} en total).`}
          description="Los campos vacíos o inválidos aparecen resaltados en amarillo. Corrígelos antes de comparar."
        />
      ) : (
        <Alert
          type="success"
          showIcon
          message="Todos los campos están completos y con formato válido."
        />
      )}

      <div className="review__toolbar">
        <Tag>{records.length} documentos</Tag>
        {filasConIssues > 0 && (
          <Tag color="warning">{totalIssues} campos por revisar</Tag>
        )}
        <Button size="small" icon={<PlusOutlined />} onClick={add}>
          Agregar fila
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={records}
        size="small"
        rowClassName={(r) => (issuesDe(r).length ? 'row--revisar' : '')}
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
