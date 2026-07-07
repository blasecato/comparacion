import './Logo.css'

/**
 * Átomo: logotipo de la aplicación (icono + nombre "RISE").
 */
function Logo({ collapsed = false }) {
  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            fill="currentColor"
            d="M12 2s7 7.6 7 12a7 7 0 1 1-14 0c0-4.4 7-12 7-12Z"
          />
        </svg>
      </span>
      {!collapsed && <span className="logo__text">RISE</span>}
    </div>
  )
}

export default Logo
