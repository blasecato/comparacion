import { LogoutOutlined } from '@ant-design/icons'
import IconButton from '../atoms/IconButton'
import './UserCard.css'

/**
 * Molécula: tarjeta de usuario al pie del menú (avatar + nombre + salir).
 */
function UserCard({ name = 'Diana Milena Mar...', onLogout, collapsed = false }) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div className="user-card">
      <span className="user-card__avatar" aria-hidden="true">
        {initial}
      </span>
      {!collapsed && (
        <>
          <span className="user-card__name">{name}</span>
          <IconButton
            icon={<LogoutOutlined />}
            label="Cerrar sesión"
            onClick={onLogout}
          />
        </>
      )}
    </div>
  )
}

export default UserCard
