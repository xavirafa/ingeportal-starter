// App.jsx — Rutas del portal
// Agrega aqui cada nueva app que crees (ver CLAUDE.md seccion 6)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/admin/Users'
import { SecurityLogs } from './pages/admin/SecurityLogs'
import { Layout } from './components/Layout'

// ── Importa aqui tus apps ────────────────────────────────────────────────────
// Ejemplo:
// import { MiApp } from './pages/apps/MiApp'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Publicas */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas — core */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/seguridad" element={
            <ProtectedRoute>
              <Layout>
                <SecurityLogs />
              </Layout>
            </ProtectedRoute>
          } />

          {/* ── Agrega aqui las rutas de tus apps ──────────────────────────
          <Route path="/apps/mi-app" element={
            <ProtectedRoute><MiApp /></ProtectedRoute>
          } />
          ─────────────────────────────────────────────────────────────────── */}

          {/* Raiz */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
