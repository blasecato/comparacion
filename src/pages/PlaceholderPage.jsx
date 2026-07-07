import Header from '../components/organisms/Header'

/**
 * Vista provisional para rutas aún no implementadas. Reutiliza el header
 * (organismo) con el título recibido.
 */
function PlaceholderPage({ title, subtitle }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div style={{ flex: 1, padding: 24, color: 'var(--rise-text-muted)' }}>
        Vista «{title}» en construcción.
      </div>
    </>
  )
}

export default PlaceholderPage
