import Header from '../components/organisms/Header'
import ValidationWizard from '../components/organisms/ValidationWizard'
import './ValidacionPage.css'

/**
 * Vista de Validación de Documentos: header + asistente de 4 pasos
 * (Excel → PDF → análisis → resultados).
 */
function ValidacionPage() {
  return (
    <>
      <Header
        title="Validacion de Documentos"
        subtitle="Extrae y valida documentos de identidad"
      />
      <div className="validacion-page__body">
        <ValidationWizard />
      </div>
    </>
  )
}

export default ValidacionPage
