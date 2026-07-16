import {
  SafetyOutlined,
  HistoryOutlined,
  MessageOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import Logo from '../atoms/Logo'
import IconButton from '../atoms/IconButton'
import NavSection from '../molecules/NavSection'
import './Sidebar.css'

const mainItems = [
  { to: '/', label: 'Validacion', icon: <SafetyOutlined />, end: true },
  { to: '/historial', label: 'Historial', icon: <HistoryOutlined /> },
  { to: '/mensajes', label: 'Mensajes', icon: <MessageOutlined />, count: 0 },
]

const adminItems = [
  { to: '/admin', label: 'Panel Admin', icon: <AppstoreOutlined />, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <TeamOutlined /> },
  {
    to: '/admin/permisos',
    label: 'Permisos',
    icon: <SafetyCertificateOutlined />,
  },
  {
    to: '/admin/mensajes',
    label: 'Mensajes Admin',
    icon: <MessageOutlined />,
    count: 0,
  },
]

/**
 * Organismo: menú lateral. Compone el logo y las secciones de navegación
 * (moléculas NavSection con átomos NavButton).
 */
function Sidebar({ collapsed = false, onToggle }) {
  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar__top">
        <Logo collapsed={collapsed} />
        <IconButton
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          onClick={onToggle}
        />
      </div>

      <div className="sidebar__scroll">
        <NavSection items={mainItems} collapsed={collapsed} />
        <NavSection title="Admin" items={adminItems} collapsed={collapsed} />
      </div>
    </aside>
  )
}

export default Sidebar
