import { BellOutlined, BulbOutlined } from '@ant-design/icons'
import PageHeading from '../molecules/PageHeading'
import IconButton from '../atoms/IconButton'
import './Header.css'

/**
 * Organismo: cabecera de la vista. Título/subtítulo (molécula) a la
 * izquierda y acciones (átomos IconButton) a la derecha.
 */
function Header({ title, subtitle, onToggleTheme }) {
  return (
    <header className="header">
      <PageHeading title={title} subtitle={subtitle} />
      <div className="header__actions">
        <IconButton icon={<BellOutlined />} label="Notificaciones" />
        <IconButton
          icon={<BulbOutlined />}
          label="Cambiar tema"
          onClick={onToggleTheme}
        />
      </div>
    </header>
  )
}

export default Header
