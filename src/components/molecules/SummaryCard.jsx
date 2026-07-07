import './SummaryCard.css'

/**
 * Molécula: tarjeta-resumen clickeable. Muestra icono + conteo + etiqueta
 * y funciona como filtro (se resalta cuando está activa).
 */
function SummaryCard({ variant, icon, count, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`summary-card summary-card--${variant}${active ? ' summary-card--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="summary-card__icon">{icon}</span>
      <span className="summary-card__count">{count}</span>
      <span className="summary-card__label">{label}</span>
    </button>
  )
}

export default SummaryCard
