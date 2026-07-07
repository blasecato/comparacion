import { Tag } from 'antd'
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  WarningFilled,
  TableOutlined,
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
}

/**
 * Átomo: etiqueta de estado con color e icono según el resultado de la
 * comparación.
 */
function StatusTag({ status }) {
  const cfg = CONFIG[status] || { color: 'default', label: status }
  return (
    <Tag color={cfg.color} icon={cfg.icon} bordered={false}>
      {cfg.label}
    </Tag>
  )
}

export default StatusTag
