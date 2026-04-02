// ProtectedRoute.jsx — Protege rutas que requieren login
// Si no estas logueado, te redirige automaticamente al Login

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    // Guarda la URL original para redirigir después del login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
