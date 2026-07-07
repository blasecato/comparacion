import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/organisms/Sidebar'
import './MainLayout.css'

/**
 * Plantilla: estructura base de la app. Menú lateral (organismo) fijo a la
 * izquierda + área de contenido a la derecha donde cada vista pinta su
 * propio header y contenido mediante <Outlet />.
 */
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="main-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
