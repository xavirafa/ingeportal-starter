// Login.jsx — Pagina de inicio de sesion

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Detecta si la pantalla es movil (menos de 768px de ancho)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Escucha cambios de tamanio de ventana para actualizar isMobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  // Si el usuario fue redirigido al login desde una URL protegida, vuelve a ella después
  const from = location.state?.from || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Usuario o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #080e1a 0%, #0f172a 50%, #080e1a 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c4a6e 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Patron de fondo decorativo */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Boton de cambio de tema (esquina superior derecha) */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10,
          width: 40, height: 40, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)',
          backgroundColor: 'rgba(255,255,255,0.08)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          transition: 'background 0.2s',
        }}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707 8.003 8.003 0 1 0 17.293 13.293z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Contenedor principal */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        maxWidth: isMobile ? '100%' : 740,
        margin: isMobile ? '0' : '0 24px',
        borderRadius: isMobile ? 0 : 24,
        overflow: 'hidden',
        boxShadow: isMobile ? '0 4px 24px rgba(0,0,0,0.3)' : '0 30px 80px rgba(0,0,0,0.5)',
        minHeight: isMobile ? '100vh' : 'auto',
      }}>

        {/* Columna izquierda: branding */}
        <div style={{
          width: isMobile ? '100%' : 280,
          background: 'linear-gradient(160deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
          padding: isMobile ? '20px 24px' : '40px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Circulos decorativos */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 160, height: 160, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: -30,
            width: 120, height: 120, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
          }} />

          {/* Logo placeholder — reemplaza con tu logo */}
          <div style={{
            width: isMobile ? 60 : 80, height: isMobile ? 60 : 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: isMobile ? 0 : 20,
            marginRight: isMobile ? 16 : 0,
            flexShrink: 0, position: 'relative', zIndex: 1,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Textos */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 800, color: 'white',
              textAlign: isMobile ? 'left' : 'center',
              margin: isMobile ? '0 0 2px' : '0 0 6px',
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              MI PORTAL
            </h2>
            <p style={{
              fontSize: isMobile ? 12 : 13,
              color: 'rgba(255,255,255,0.85)',
              textAlign: isMobile ? 'left' : 'center',
              margin: 0, fontWeight: 500,
            }}>
              Bienvenido
            </p>
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div style={{
          flex: 1,
          backgroundColor: isDark ? '#1e293b' : 'white',
          padding: isMobile ? '32px 24px 40px' : '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>

          {/* Titulo */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 800,
              color: isDark ? '#f1f5f9' : '#0f172a',
              margin: '0 0 8px', letterSpacing: '-0.5px',
            }}>
              Portal Interno
            </h1>
            <p style={{ fontSize: 14, color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>
              Ingresa con tus credenciales
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>

            {/* Campo usuario */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: isDark ? '#94a3b8' : '#374151', marginBottom: 6,
              }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 14c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="tu usuario"
                  style={{
                    width: '100%', padding: '12px 12px 12px 38px',
                    borderRadius: 10,
                    border: `1.5px solid ${isDark ? '#2d3a4f' : '#e5e7eb'}`,
                    fontSize: 14,
                    color: isDark ? '#f1f5f9' : '#111827',
                    backgroundColor: isDark ? '#162032' : '#f9fafb',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = isDark ? '#2d3a4f' : '#e5e7eb'}
                />
              </div>
            </div>

            {/* Campo contrasena */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: isDark ? '#94a3b8' : '#374151', marginBottom: 6,
              }}>
                Contrasena
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="1" fill="currentColor" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 12px 12px 38px',
                    borderRadius: 10,
                    border: `1.5px solid ${isDark ? '#2d3a4f' : '#e5e7eb'}`,
                    fontSize: 14,
                    color: isDark ? '#f1f5f9' : '#111827',
                    backgroundColor: isDark ? '#162032' : '#f9fafb',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = isDark ? '#2d3a4f' : '#e5e7eb'}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: isDark ? 'rgba(220,38,38,0.12)' : '#fef2f2',
                border: `1px solid ${isDark ? 'rgba(220,38,38,0.25)' : '#fecaca'}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                fontSize: 13, color: '#dc2626',
              }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="#dc2626" strokeWidth="1.2" />
                  <path d="M7.5 4.5v3.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="7.5" cy="10.5" r="0.7" fill="#dc2626" />
                </svg>
                {error}
              </div>
            )}

            {/* Boton */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                transition: 'opacity 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: 'center', fontSize: 12,
            color: isDark ? '#475569' : '#cbd5e1',
            marginTop: 28, marginBottom: 0,
          }}>
            Mi Empresa &nbsp;&middot;&nbsp; Portal Interno
          </p>
        </div>
      </div>
    </div>
  )
}
