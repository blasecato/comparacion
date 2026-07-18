import { Tag } from 'antd'
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  WarningFilled,
  TableOutlined,
  IdcardFilled,
} from '@ant-design/icons'
import { STATUS } from '../../lib/compare'

const CONFIG = {
  [STATUS.CORRECTO]: {
    color: 'success',
    label: 'Correcto',
    icon: <CheckCircleFilled />,
  },
  [STATUS.ERROR]: {
    color: 'error',
    label: 'Con Error',
    icon: <ExclamationCircleFilled />,
  },
  [STATUS.SOLO_PDF]: {
    color: 'warning',
    label: 'Solo en PDF',
    icon: <WarningFilled />,
  },
  [STATUS.SOLO_EXCEL]: {
    color: 'processing',
    label: 'Solo en Excel',
    icon: <TableOutlined />,
  },
  [STATUS.SOLO_CEDULAS]: {
    color: 'purple',
    label: 'Solo en cédulas',
    icon: <IdcardFilled />,
  },
}

/**
 * Átomo: etiqueta de estado con color e icono según el resultado de la
 * comparación. `label` permite sobreescribir el texto según el paso.
 */
function StatusTag({ status, label }) {
  const cfg = CONFIG[status] || { color: 'default', label: status }
  return (
    <Tag color={cfg.color} icon={cfg.icon} bordered={false}>
      {label || cfg.label}
    </Tag>
  )
}

export default StatusTag
