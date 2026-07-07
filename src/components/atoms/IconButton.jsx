import './IconButton.css'

/**
 * Átomo: botón de icono (usado en el header para acciones como
 * notificaciones o cambio de tema).
 */
function IconButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      className="icon-button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}

export default IconButton
