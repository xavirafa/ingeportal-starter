// Layout.jsx — Layout principal con sidebar compartido
// Todas las paginas internas usan este componente
// Responsive: sidebar se colapsa en pantallas pequeñas (< 768px)

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import client from '../api/client'

// Grupo superior fijo — visible para todos
const NAV_TOP = [
  {
    label: 'Inicio', path: '/dashboard', adminOnly: false,
    icon: <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M2 7.5L9 2l7 5.5V16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6.5 17V11h5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
]

// Grupo administración — solo admins
const NAV_ADMIN = [
  {
    label: 'Usuarios', path: '/admin/users', adminOnly: true,
    icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M1 15c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M13 8v5M15.5 10.5H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  },
  {
    label: 'Logs de Seguridad', path: '/admin/seguridad', adminOnly: true,
    icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 1.5L2 4.5v5c0 3.5 3 6.5 7 7 4-0.5 7-3.5 7-7v-5L9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

// Grupos de apps — AGREGAR AQUI las apps de tu proyecto
// Formato:
// {
//   label: 'Trabajo',
//   items: [
//     { label: 'Mi App', path: '/apps/mi-app', adminOnly: false, indent: true, appId: 'mi_app', icon: <svg...> },
//   ]
// }
const NAV_GROUPS = [
  // Agrega tus grupos de apps aqui
]

export function Layout({ children }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [alerts, setAlerts] = useState({ bloqueadas: 0 })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cargar alertas de seguridad para admins (badge en sidebar)
  useEffect(() => {
    if (user?.role !== 'admin') return
    const cargar = async () => {
      try {
        const r = await client.get('/security/alerts')
        setAlerts(r.data)
      } catch { /* silencioso */ }
    }
    cargar()
    const intervalo = setInterval(cargar, 60000) // cada 1 minuto
    return () => clearInterval(intervalo)
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  // Determina si un item del sidebar debe mostrarse
  const shouldShow = (item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.appId && !isAdmin) {
      return user?.allowed_apps?.includes(item.appId)
    }
    return true
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // ── Estilos inline ────────────────────────────────────────────────────────
  const sidebarBg    = 'var(--sidebar-bg, #334155)'
  const sidebarText  = 'var(--sidebar-text, #cbd5e1)'
  const activeText   = 'var(--sidebar-text-active, #a5b4fc)'
  const accentBg     = 'var(--sidebar-accent, rgba(99,102,241,0.2))'

  const navItem = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
    color: active ? activeText : sidebarText,
    backgroundColor: active ? accentBg : 'transparent',
    fontSize: 13, fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
    textDecoration: 'none',
  })

  const sidebarContent = (
    <div style={{
      width: 220, minHeight: '100vh',
      backgroundColor: sidebarBg,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 100,
      transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.25s ease',
      overflowY: 'auto',
    }}>
      {/* Header del sidebar */}
      <div style={{
        padding: '20px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
            Mi Portal
          </span>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{
              background: 'none', border: 'none', color: sidebarText,
              cursor: 'pointer', padding: 4,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {user && (
          <div style={{ marginTop: 10 }}>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0 }}>{user.full_name}</p>
            <p style={{ color: sidebarText, fontSize: 11, margin: '2px 0 0', opacity: 0.7 }}>{user.role}</p>
          </div>
        )}
      </div>

      {/* Nav principal */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>

        {/* Top items */}
        {NAV_TOP.filter(shouldShow).map(item => (
          <div
            key={item.path}
            style={navItem(isActive(item.path))}
            onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false) }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}

        {/* Grupos de apps */}
        {NAV_GROUPS.map(group => {
          const visibles = group.items.filter(shouldShow)
          if (visibles.length === 0) return null
          return (
            <div key={group.label} style={{ marginTop: 16 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                padding: '0 12px', marginBottom: 4,
              }}>
                {group.label}
              </p>
              {visibles.map(item => (
                <div
                  key={item.path}
                  style={{
                    ...navItem(isActive(item.path)),
                    paddingLeft: item.indent ? 20 : 12,
                  }}
                  onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false) }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )
        })}

        {/* Admin */}
        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
              padding: '0 12px', marginBottom: 4,
            }}>
              Admin
            </p>
            {NAV_ADMIN.map(item => (
              <div
                key={item.path}
                style={navItem(isActive(item.path))}
                onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false) }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {/* Badge de alertas en Logs de Seguridad */}
                {item.path === '/admin/seguridad' && alerts.bloqueadas > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    backgroundColor: '#ef4444', color: 'white',
                    borderRadius: 10, padding: '1px 6px',
                    animation: 'pulse 2s infinite',
                  }}>
                    {alerts.bloqueadas}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer sidebar */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {/* Toggle tema */}
        <div
          style={{ ...navItem(false), justifyContent: 'space-between' }}
          onClick={toggleTheme}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707 8.003 8.003 0 1 0 17.293 13.293z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span style={{ fontSize: 12 }}>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </div>
        </div>

        {/* Cerrar sesion */}
        <div
          style={{ ...navItem(false), color: '#f87171' }}
          onClick={handleLogout}
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
            <path d="M11 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M15 9H7M15 9l-2.5-2.5M15 9l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 12 }}>Cerrar sesion</span>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
    }}>
      {/* Sidebar */}
      {sidebarContent}

      {/* Overlay en móvil cuando sidebar está abierto */}
      {isMobile && sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 220,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        {/* Topbar móvil */}
        {isMobile && (
          <div style={{
            height: 52, backgroundColor: 'var(--sidebar-bg, #334155)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
            gap: 12, flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none', border: 'none',
                color: 'white', cursor: 'pointer', padding: 4,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Mi Portal</span>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
