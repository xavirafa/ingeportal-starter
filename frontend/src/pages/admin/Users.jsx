// Users.jsx — Gestion de usuarios, sesiones activas e historial de conexiones
// Pestañas: Usuarios | Sesiones Activas | Historial de Conexiones

import { useState, useEffect } from 'react'
import client from '../../api/client'

// ─── Hook para detectar ancho de pantalla (responsive sin CSS) ───────────────
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ─── Apps disponibles en el portal ───────────────────────────────────────────
// IMPORTANTE: Cada vez que se agregue una nueva app al portal,
// agregar aqui tambien para que aparezca en los permisos de usuario.
// Formato: { id: 'mi_app', label: 'Mi App' }
const PORTAL_APPS = [
  // Agrega tus apps aqui:
  // { id: 'mi_app', label: 'Mi App' },
]

// ─── Colores por rol y estado ─────────────────────────────────────────────────
const ROLE_STYLE = {
  admin: { color: '#4f46e5', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' },
  user:  { color: '#0369a1', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' },
}

const STATUS_STYLE = {
  true:  { color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  false: { color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca' },
}

// ─── Pestañas ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'users',    label: 'Usuarios' },
  { id: 'sessions', label: 'Sesiones Activas' },
  { id: 'history',  label: 'Historial' },
]

// ─── Componente principal ─────────────────────────────────────────────────────
export function Users() {
  const [activeTab, setActiveTab] = useState('users')
  const width = useWindowWidth()
  const isMobile = width < 640
  const hPad = isMobile ? '16px' : '32px'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

      {/* Header con pestañas */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: `24px ${hPad} 0`,
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Administración
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Usuarios, sesiones y accesos al portal.
        </p>

        <div style={{ display: 'flex', gap: 0, marginTop: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: isMobile ? '10px 14px' : '10px 20px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #0f172a' : '2px solid transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users'    && <UsersTab />}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'history'  && <HistoryTab />}
    </div>
  )
}

// ─── Pestaña: Usuarios ────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [error, setError]           = useState('')

  const width = useWindowWidth()
  const isMobile = width < 640
  const hPad = isMobile ? '16px' : '32px'

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await client.get('/users')
      setUsers(res.data)
    } catch {
      setError('No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const openCreate  = () => { setEditUser(null); setDrawerOpen(true) }
  const openEdit    = (u) => { setEditUser(u);   setDrawerOpen(true) }
  const closeDrawer = ()  => { setDrawerOpen(false); setEditUser(null) }

  const toggleActive = async (u) => {
    try {
      await client.patch(`/users/${u.id}`, { is_active: !u.is_active })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al actualizar usuario')
    }
  }

  const onSaved = () => { closeDrawer(); fetchUsers() }

  return (
    <>
      <div style={{ padding: `16px ${hPad} 0`, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: '#0f172a', color: 'white',
            border: 'none', borderRadius: 8, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nuevo usuario
        </button>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: 13, padding: `0 ${hPad}` }}>{error}</p>}

      <main style={{ flex: 1, padding: `16px ${hPad} 28px` }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Cargando...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay usuarios registrados.</div>
            ) : (
              users.map(u => (
                <UserCard key={u.id} user={u} onEdit={openEdit} onToggle={toggleActive} />
              ))
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 1fr auto',
                padding: '10px 20px', borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'var(--table-header-bg)', minWidth: 560,
              }}>
                {['Usuario', 'Rol y estado', 'Apps habilitadas', 'Acciones'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Cargando...</div>
              ) : users.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay usuarios registrados.</div>
              ) : (
                users.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 1fr auto',
                    padding: '14px 20px', alignItems: 'center', gap: 12,
                    borderBottom: i < users.length - 1 ? '1px solid var(--border-light)' : 'none',
                    minWidth: 560,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--accent-indigo-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'var(--accent-indigo)', flexShrink: 0,
                      }}>
                        {u.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>@{u.username}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, ...(ROLE_STYLE[u.role] || ROLE_STYLE.user) }}>
                        {u.role === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, ...STATUS_STYLE[u.is_active] }}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {u.role === 'admin' ? (
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, color: '#6b21a8', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                          Todas (admin)
                        </span>
                      ) : (u.allowed_apps ?? []).length === 0 ? (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin accesos</span>
                      ) : (
                        (u.allowed_apps ?? []).map(appId => {
                          const app = PORTAL_APPS.find(a => a.id === appId)
                          return app ? (
                            <span key={appId} style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, color: '#0369a1', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                              {app.label}
                            </span>
                          ) : null
                        })
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(u)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Editar
                      </button>
                      <button onClick={() => toggleActive(u)}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                          backgroundColor: u.is_active ? '#fef2f2' : '#f0fdf4',
                          color: u.is_active ? '#dc2626' : '#16a34a',
                        }}>
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {drawerOpen && (
        <UserDrawer user={editUser} onClose={closeDrawer} onSaved={onSaved} />
      )}
    </>
  )
}

// ─── Tarjeta de usuario para vista movil ──────────────────────────────────────
function UserCard({ user: u, onEdit, onToggle }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', backgroundColor: 'var(--accent-indigo-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'var(--accent-indigo)', flexShrink: 0,
        }}>
          {u.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>@{u.username}</p>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, ...(ROLE_STYLE[u.role] || ROLE_STYLE.user) }}>
            {u.role === 'admin' ? 'Admin' : 'Usuario'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, ...STATUS_STYLE[u.is_active] }}>
            {u.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {u.role === 'admin' ? (
          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, color: '#6b21a8', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
            Todas las apps (admin)
          </span>
        ) : (u.allowed_apps ?? []).length === 0 ? (
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin accesos</span>
        ) : (
          (u.allowed_apps ?? []).map(appId => {
            const app = PORTAL_APPS.find(a => a.id === appId)
            return app ? (
              <span key={appId} style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, color: '#0369a1', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                {app.label}
              </span>
            ) : null
          })
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(u)}
          style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
          Editar
        </button>
        <button onClick={() => onToggle(u)}
          style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, backgroundColor: u.is_active ? '#fef2f2' : '#f0fdf4', color: u.is_active ? '#dc2626' : '#16a34a' }}>
          {u.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}

// ─── Pestaña: Sesiones Activas ────────────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const width = useWindowWidth()
  const isMobile = width < 640
  const hPad = isMobile ? '16px' : '32px'

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await client.get('/sessions/active')
      setSessions(res.data)
    } catch {
      setError('No se pudieron cargar las sesiones')
    } finally {
      setLoading(false)
    }
  }

  const forceLogout = async (sessionId, fullName) => {
    if (!confirm(`Cerrar la sesion de ${fullName}?`)) return
    try {
      await client.delete(`/sessions/force-logout/${sessionId}`)
      fetchSessions()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cerrar sesion')
    }
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  }

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Justo ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    return `Hace ${Math.floor(hours / 24)}d`
  }

  const shortBrowser = (ua) => {
    if (!ua) return '—'
    if (ua.includes('Edg/'))     return 'Edge'
    if (ua.includes('Chrome/'))  return 'Chrome'
    if (ua.includes('Firefox/')) return 'Firefox'
    if (ua.includes('Safari/'))  return 'Safari'
    return 'Otro'
  }

  return (
    <main style={{ flex: 1, padding: `28px ${hPad}` }}>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Cargando...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay sesiones activas.</div>
          ) : (
            sessions.map(s => (
              <div key={s.session_id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{s.full_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>@{s.username}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase' }}>Conectado</p>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{formatDate(s.created_at)}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{s.ip_address || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase' }}>Ultima actividad</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{timeAgo(s.last_activity)}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{shortBrowser(s.user_agent)}</p>
                  </div>
                </div>
                <button onClick={() => forceLogout(s.session_id, s.full_name)}
                  style={{ padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                  Cerrar sesion
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 140px auto', padding: '10px 20px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--table-header-bg)', minWidth: 580 }}>
              {['Usuario', 'Conectado desde', 'Navegador', 'Ultima actividad', 'Acciones'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay sesiones activas.</div>
            ) : (
              sessions.map((s, i) => (
                <div key={s.session_id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 140px auto', padding: '14px 20px', alignItems: 'center', gap: 12, borderBottom: i < sessions.length - 1 ? '1px solid var(--border-light)' : 'none', minWidth: 580 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>@{s.username}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{formatDate(s.created_at)}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{s.ip_address || '—'}</p>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shortBrowser(s.user_agent)}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{timeAgo(s.last_activity)}</span>
                  <button onClick={() => forceLogout(s.session_id, s.full_name)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, backgroundColor: '#fef2f2', color: '#dc2626', whiteSpace: 'nowrap' }}>
                    Cerrar sesion
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {!loading && sessions.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>{sessions.length} sesion(es) activa(s)</p>
      )}
    </main>
  )
}

// ─── Pestaña: Historial de Conexiones ─────────────────────────────────────────
function HistoryTab() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 50

  const width = useWindowWidth()
  const isMobile = width < 640
  const hPad = isMobile ? '16px' : '32px'

  useEffect(() => { fetchHistory(0) }, [])

  const fetchHistory = async (pageNum) => {
    try {
      setLoading(true)
      const res = await client.get('/sessions/login-history', { params: { limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE } })
      setLogs(res.data)
      setHasMore(res.data.length === PAGE_SIZE)
      setPage(pageNum)
    } catch {
      setError('No se pudo cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
  const shortBrowser = (ua) => {
    if (!ua) return '—'
    if (ua.includes('Edg/'))     return 'Edge'
    if (ua.includes('Chrome/'))  return 'Chrome'
    if (ua.includes('Firefox/')) return 'Firefox'
    if (ua.includes('Safari/'))  return 'Safari'
    return 'Otro'
  }

  return (
    <main style={{ flex: 1, padding: `28px ${hPad}` }}>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay registros.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-indigo-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', flexShrink: 0 }}>
                  {log.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.full_name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{formatDate(log.logged_in_at)} · {shortBrowser(log.user_agent)} · {log.ip_address || '—'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 100px 120px', padding: '10px 20px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--table-header-bg)', minWidth: 500 }}>
              {['Usuario', 'Fecha y hora', 'Navegador', 'IP'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</span>
              ))}
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay registros.</div>
            ) : (
              logs.map((log, i) => (
                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 100px 120px', padding: '12px 20px', alignItems: 'center', gap: 12, borderBottom: i < logs.length - 1 ? '1px solid var(--border-light)' : 'none', minWidth: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-indigo-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', flexShrink: 0 }}>
                      {log.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.full_name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>@{log.username}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(log.logged_in_at)}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shortBrowser(log.user_agent)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ip_address || '—'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Pagina {page + 1}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fetchHistory(page - 1)} disabled={page === 0}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: page === 0 ? 'default' : 'pointer', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', color: page === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: page === 0 ? 0.5 : 1 }}>
              Anterior
            </button>
            <button onClick={() => fetchHistory(page + 1)} disabled={!hasMore}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: !hasMore ? 'default' : 'pointer', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', color: !hasMore ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: !hasMore ? 0.5 : 1 }}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Drawer: formulario crear/editar ─────────────────────────────────────────
function UserDrawer({ user, onClose, onSaved }) {
  const isEdit = Boolean(user)
  const width = useWindowWidth()
  const isMobile = width < 640
  const drawerWidth = isMobile ? '100vw' : '400px'

  const [form, setForm] = useState({
    full_name:    user?.full_name    ?? '',
    username:     user?.username     ?? '',
    role:         user?.role         ?? 'user',
    password:     '',
    allowed_apps: user?.allowed_apps ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        const payload = { full_name: form.full_name, role: form.role, allowed_apps: form.allowed_apps }
        if (form.password) payload.password = form.password
        await client.patch(`/users/${user.id}`, payload)
      } else {
        await client.post('/users', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: drawerWidth, maxWidth: '100vw',
        backgroundColor: 'var(--bg-secondary)', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ padding: isMobile ? '16px 20px' : '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          <Field label="Nombre completo">
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} required placeholder="Ej: Maria Garcia" style={inputStyle} />
          </Field>

          <Field label="Nombre de usuario">
            <input value={form.username} onChange={e => set('username', e.target.value)} required placeholder="Ej: mgarcia"
              disabled={isEdit} style={{ ...inputStyle, ...(isEdit ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}) }} />
            {!isEdit && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Solo letras, numeros y guion bajo. Sin espacios.</span>}
          </Field>

          <Field label="Rol">
            <select value={form.role} onChange={e => { set('role', e.target.value); if (e.target.value === 'admin') set('allowed_apps', []) }} style={inputStyle}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>

          <Field label={isEdit ? 'Nueva contrasena (dejar en blanco para no cambiar)' : 'Contrasena'}>
            <input value={form.password} onChange={e => set('password', e.target.value)} type="password" required={!isEdit} placeholder="••••••••" style={inputStyle} />
          </Field>

          {/* Permisos — solo para usuarios normales y cuando hay apps configuradas */}
          {form.role !== 'admin' && PORTAL_APPS.length > 0 && (
            <Field label="Aplicaciones habilitadas">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                {PORTAL_APPS.map(app => {
                  const checked = form.allowed_apps.includes(app.id)
                  return (
                    <label key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          const next = checked ? form.allowed_apps.filter(id => id !== app.id) : [...form.allowed_apps, app.id]
                          set('allowed_apps', next)
                        }}
                        style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: checked ? 600 : 400 }}>{app.label}</span>
                    </label>
                  )
                })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Los administradores siempre ven todas las apps.</span>
            </Field>
          )}

          {form.role !== 'admin' && PORTAL_APPS.length === 0 && (
            <Field label="Aplicaciones habilitadas">
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  No hay apps configuradas aun. Agrega apps al array PORTAL_APPS en Users.jsx.
                </p>
              </div>
            </Field>
          )}

          {error && (
            <div style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border-primary)', fontSize: 14, color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-input)', outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
