import NavButton from '../atoms/NavButton'
import './NavSection.css'

/**
 * Molécula: sección del menú. Un título opcional + una lista de
 * botones de navegación (átomos NavButton).
 */
function NavSection({ title, items, collapsed = false }) {
  return (
    <div className="nav-section">
      {title && !collapsed && <p className="nav-section__title">{title}</p>}
      <nav className="nav-section__list">
        {items.map((item) => (
          <NavButton
            key={item.to}
            to={item.to}
            end={item.end}
            icon={item.icon}
            label={item.label}
            count={item.count}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </div>
  )
}

export default NavSection
