import { useEffect, useState } from 'react'
import { Progress } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './step.css'

const PHASES = [
  'Normalizando documentos…',
  'Cruzando PDF contra Excel…',
  'Detectando faltantes y diferencias…',
  'Generando resultados…',
]

/**
 * Organismo (paso 3): animación de análisis mientras se comparan los datos.
 * Al terminar dispara onDone() para avanzar a los resultados.
 */
function AnalyzingStep({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [percent, setPercent] = useState(8)

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1))
    }, 500)
    const pctTimer = setInterval(() => {
      setPercent((p) => Math.min(p + 7, 100))
    }, 120)
    const done = setTimeout(() => {
      setPercent(100)
      onDone()
    }, 2100)
    return () => {
      clearInterval(phaseTimer)
      clearInterval(pctTimer)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className="step step--center">
      <LoadingOutlined className="step__spinner" spin />
      <h3 className="step__title">Paso 3: Analizando datos</h3>
      <p className="step__hint">{PHASES[phase]}</p>
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor="#7c4dff"
        style={{ maxWidth: 360 }}
      />
    </div>
  )
}

export default AnalyzingStep
