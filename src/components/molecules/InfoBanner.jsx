import './InfoBanner.css'

/**
 * Molécula: banner gris con los datos de la ficha validada.
 */
function InfoBanner({ ficha, programa, instructor, badge }) {
  return (
    <div className="info-banner">
      <div className="info-banner__body">
        <p className="info-banner__label">Ficha validada:</p>
        <p className="info-banner__main">
          {[ficha, programa].filter(Boolean).join(' - ') || 'Sin datos de ficha'}
        </p>
        {instructor && (
          <p className="info-banner__sub">Instructor: {instructor}</p>
        )}
      </div>
      {badge && <span className="info-banner__badge">{badge}</span>}
    </div>
  )
}

export default InfoBanner
