import StepIndicator from '../atoms/StepIndicator'
import './Stepper.css'

/**
 * Molécula: barra de pasos. Compone los átomos StepIndicator y dibuja los
 * conectores, marcando cada paso como done / active / pending según el
 * paso actual.
 */
function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : 'pending'
        return (
          <div className="stepper__item" key={step.title}>
            <StepIndicator
              index={i + 1}
              title={step.title}
              subtitle={step.subtitle}
              status={status}
            />
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
