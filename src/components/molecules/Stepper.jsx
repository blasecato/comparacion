import StepIndicator from '../atoms/StepIndicator'
import './Stepper.css'

/**
 * Molécula: barra de pasos. Compone los átomos StepIndicator y dibuja los
 * conectores, marcando cada paso como done / active / pending según el
 * paso actual.
 *
 * Si se pasa `onStepClick`, los pasos ya alcanzados (index <= maxReached)
 * se vuelven clickeables para volver a ellos. El estado del wizard se
 * conserva, así que al volver se ve todo lo ya registrado.
 */
function Stepper({ steps, current, maxReached = current, onStepClick }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending'
        const clickable = Boolean(onStepClick) && i <= maxReached && i !== current
        const node = (
          <StepIndicator
            index={i + 1}
            title={step.title}
            subtitle={step.subtitle}
            status={status}
          />
        )
        return (
          <div className="stepper__item" key={step.title}>
            {clickable ? (
              <button
                type="button"
                className="stepper__btn"
                onClick={() => onStepClick(i)}
                title={`Volver a: ${step.title}`}
              >
                {node}
              </button>
            ) : (
              node
            )}
            {i < steps.length - 1 && (
              <span
                className={`stepper__line${i < current ? ' stepper__line--done' : ''}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
