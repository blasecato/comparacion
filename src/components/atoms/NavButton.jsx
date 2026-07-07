import { NavLink } from 'react-router-dom'
import './NavButton.css'

/**
 * Átomo: botón de navegación del menú lateral.
 * Renderiza un enlace (NavLink) con icono, etiqueta y contador opcional.
 * El estado activo lo aplica NavLink automáticamente según la ruta.
 */
function NavButton({ to, icon, label, count, collapsed = false, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `nav-button${isActive ? ' nav-button--active' : ''}`
      }
    >
      <span className="nav-button__icon" aria-hidden="true">
        {icon}
      </span>
      {!collapsed && <span className="nav-button__label">{label}</span>}
      {!collapsed && count != null && (
        <span className="nav-button__count">{count}</span>
      )}
    </NavLink>
  )
}

export default NavButton
