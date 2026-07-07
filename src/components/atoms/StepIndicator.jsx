import { CheckOutlined } from '@ant-design/icons'
import './StepIndicator.css'

/**
 * Átomo: un nodo del stepper. Muestra el número o un check según el estado
 * (done / active / pending) junto al título y subtítulo del paso.
 */
function StepIndicator({ index, title, subtitle, status = 'pending' }) {
  return (
    <div className={`step-indicator step-indicator--${status}`}>
      <span className="step-indicator__node">
        {status === 'done' ? <CheckOutlined /> : index}
      </span>
      <span className="step-indicator__title">{title}</span>
      {subtitle && <span className="step-indicator__subtitle">{subtitle}</span>}
    </div>
  )
}

export default StepIndicator
