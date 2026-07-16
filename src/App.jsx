import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import MainLayout from './layouts/MainLayout'
import ValidacionPage from './pages/ValidacionPage'
import PlaceholderPage from './pages/PlaceholderPage'
import './App.css'

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#7c4dff' } }}>
      <AntApp>
        <BrowserRouter>
          <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/validacion" replace />} />
          <Route path="/validacion" element={<ValidacionPage />} />
          <Route
            path="/historial"
            element={<PlaceholderPage title="Historial" />}
          />
          <Route
            path="/mensajes"
            element={<PlaceholderPage title="Mensajes" />}
          />
          <Route
            path="/admin"
            element={<PlaceholderPage title="Panel Admin" />}
          />
          <Route
            path="/admin/usuarios"
            element={<PlaceholderPage title="Usuarios" />}
          />
          <Route
            path="/admin/permisos"
            element={<PlaceholderPage title="Permisos" />}
          />
          <Route
            path="/admin/mensajes"
            element={<PlaceholderPage title="Mensajes Admin" />}
          />
          <Route
            path="*"
            element={<PlaceholderPage title="Página no encontrada" />}
          />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
