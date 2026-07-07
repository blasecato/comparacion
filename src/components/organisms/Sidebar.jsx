import {
  DashboardOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ToolOutlined,
  HistoryOutlined,
  MessageOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LayoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import Logo from '../atoms/Logo'
import IconButton from '../atoms/IconButton'
import NavSection from '../molecules/NavSection'
import NavButton from '../atoms/NavButton'
import UserCard from '../molecules/UserCard'
import './Sidebar.css'

const mainItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { to: '/validacion', label: 'Validacion', icon: <SafetyOutlined /> },
  { to: '/fichas', label: 'Fichas', icon: <FileTextOutlined /> },
  { to: '/herramientas', label: 'Herramientas', icon: <ToolOutlined /> },
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

const footerItems = [
  { to: '/personalizar', label: 'Personalizar', icon: <LayoutOutlined /> },
  { to: '/configuracion', label: 'Configuracion', icon: <SettingOutlined /> },
]

/**
 * Organismo: menú lateral completo. Compone el logo, las secciones de
 * navegación (moléculas), el contador de servicio, accesos de pie y la
 * tarjeta de usuario.
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

      <div className="sidebar__footer">
        <div className="sidebar__footer-links">
          {footerItems.map((item) => (
            <NavButton
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </div>
        <UserCard collapsed={collapsed} />
      </div>
    </aside>
  )
}

export default Sidebar
