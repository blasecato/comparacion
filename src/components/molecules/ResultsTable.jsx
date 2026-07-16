import { useState } from 'react'
import { Table, Tag, Button, Modal, Descriptions } from 'antd'
import { EyeOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import StatusTag from '../atoms/StatusTag'
import { STATUS } from '../../lib/compare'
import { ageCategory } from '../../lib/normalize'

const ORIGEN_COLOR = {
  Ambos: 'green',
  'Solo PDF': 'gold',
  'Solo Excel': 'blue',
}

/**
 * Molécula: tabla de resultados. Las filas con error muestran un botón (ojo)
 * que abre un modal con el detalle de por qué falló la validación.
 */
function ResultsTable({ rows }) {
  const [detail, setDetail] = useState(null)

  const columns = [
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => <StatusTag status={estado} />,
    },
    {
      title: 'Origen',
      dataIndex: 'origen',
      key: 'origen',
      render: (origen) => (
        <Tag color={ORIGEN_COLOR[origen]} bordered={false}>
          {origen}
        </Tag>
      ),
    },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    {
      title: 'Mayor/Menor',
      key: 'edad',
      render: (_, row) => {
        const cat = ageCategory(row.tipo)
        return (
          <Tag color={cat === 'Menor' ? 'orange' : 'blue'} bordered={false}>
            {cat}
          </Tag>
        )
      },
    },
    { title: 'Numero', dataIndex: 'numero', key: 'numero' },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Pag.', dataIndex: 'pag', key: 'pag', render: (v) => v || '—' },
    { title: 'Novedad', dataIndex: 'novedad', key: 'novedad' },
    {
      title: '',
      key: 'acciones',
      width: 56,
      align: 'center',
      render: (_, row) =>
        row.estado === STATUS.ERROR ? (
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            aria-label="Ver detalle del error"
            onClick={() => setDetail(row)}
          />
        ) : null,
    },
  ]

  return (
    <>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={rows}
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={!!detail}
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="Entendido"
        cancelButtonProps={{ style: { display: 'none' } }}
        title={
          <span style={{ color: '#dc2626' }}>
            <ExclamationCircleFilled /> Detalle del error
          </span>
        }
      >
        {detail && (
          <>
            <p style={{ marginBottom: 12 }}>
              {detail.detalle?.motivo || detail.novedad}
            </p>
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                { key: 'doc', label: 'Documento', children: detail.numero },
                {
                  key: 'pdf',
                  label: 'Nombre en PDF',
                  children: detail.detalle?.pdfNombre || '—',
                },
                {
                  key: 'excel',
                  label: 'Nombre en Excel',
                  children: detail.detalle?.excelNombre || '—',
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  )
}

export default ResultsTable
