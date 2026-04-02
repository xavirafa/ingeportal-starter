// SecurityLogs.jsx — Panel de logs de seguridad (solo admins)
// Muestra intentos fallidos, bloqueos de IP y estadísticas del portal

import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

// Estilos responsive globales para esta página (media queries no disponibles en inline styles)
const RESPONSIVE_CSS = `
  /* Reducir padding en móvil */
  .sec-logs-page { padding: 12px !important; }

  /* Filtros apilados verticalmente en móvil */
  .sec-logs-filters { flex-direction: column !important; align-items: stretch !important; }
  .sec-logs-filters input { width: 100% !important; box-sizing: border-box; }

  /* Ocultar columnas secundarias en pantallas pequeñas */
  .sec-col-usuario, .sec-col-detalle { display: none !important; }

  /* Ajustar row de IP bloqueada en móvil */
  .sec-ip-row { flex-wrap: wrap !important; gap: 8px !important; }

  @media (min-width: 480px) {
    /* Desde 480px el input de IP vuelve a tener ancho fijo */
    .sec-logs-filters { flex-direction: row !important; align-items: center !important; }
    .sec-logs-filters input { width: 140px !important; }
  }

  @media (min-width: 640px) {
    /* Desde 640px mostrar la columna de usuario */
    .sec-col-usuario { display: table-cell !important; }
    .sec-logs-page { padding: 20px !important; }
  }

  @media (min-width: 900px) {
    /* Escritorio: mostrar todo */
    .sec-col-detalle { display: table-cell !important; }
    .sec-logs-page { padding: 24px !important; }
  }
`

const TIPO_LABELS = {
  login_failed:   { label: 'Intento fallido',   color: '#dc2626', bg: '#fef2f2' },
  ip_blocked:     { label: 'IP Bloqueada',       color: '#b45309', bg: '#fffbeb' },
  ip_unblocked:   { label: 'IP Desbloqueada',    color: '#16a34a', bg: '#f0fdf4' },
  login_success:  { label: 'Login exitoso',      color: '#2563eb', bg: '#eff6ff' },
}

const FILTROS = [
  { value: '',               label: 'Todos' },
  { value: 'login_failed',   label: 'Fallos' },
  { value: 'ip_blocked',     label: 'Bloqueos' },
  { value: 'ip_unblocked',   label: 'Desbloqueos' },
  { value: 'login_success',  label: 'Exitosos' },
]

function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  })
}

export function SecurityLogs() {
  const [stats, setStats]           = useState(null)
  const [eventos, setEventos]       = useState([])
  const [bloqueadas, setBloqueadas] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroIp, setFiltroIp]     = useState('')
  const [cargando, setCargando]     = useState(true)
  const [desbloqueando, setDesbloqueando] = useState(null)
  const [toast, setToast]           = useState(null)

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const cargarDatos = useCallback(async () => {
    try {
      const [resStats, resEventos, resBloq] = await Promise.all([
        client.get('/security/stats'),
        client.get('/security/events', {
          params: { limit: 100, ...(filtroTipo && { tipo: filtroTipo }), ...(filtroIp && { ip: filtroIp }) },
        }),
        client.get('/security/blocked-ips'),
      ])
      setStats(resStats.data)
      setEventos(resEventos.data)
      setBloqueadas(resBloq.data.bloqueadas || [])
    } catch (e) {
      mostrarToast('Error al cargar datos de seguridad', 'error')
    } finally {
      setCargando(false)
    }
  }, [filtroTipo, filtroIp])

  useEffect(() => {
    cargarDatos()
    // Auto-refresh cada 30 segundos
    const intervalo = setInterval(cargarDatos, 30000)
    return () => clearInterval(intervalo)
  }, [cargarDatos])

  const desbloquearIp = async (ip) => {
    setDesbloqueando(ip)
    try {
      await client.post(`/security/unblock/${encodeURIComponent(ip)}`)
      mostrarToast(`IP ${ip} desbloqueada correctamente`)
      cargarDatos()
    } catch {
      mostrarToast('Error al desbloquear la IP', 'error')
    } finally {
      setDesbloqueando(null)
    }
  }

  // ── Estilos ────────────────────────────────────────────────────────────────
  const s = {
    page:      { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
    titulo:    { fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '4px' },
    subtitulo: { fontSize: '13px', color: '#6b7280', marginBottom: '24px' },

    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' },
    card:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' },
    cardVal: { fontSize: '28px', fontWeight: '700', color: '#111', lineHeight: 1 },
    cardLbl: { fontSize: '11px', color: '#9ca3af', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    cardSub: { fontSize: '12px', color: '#6b7280', marginTop: '6px' },

    seccion: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' },
    secHead: { padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' },
    secTit:  { fontSize: '14px', fontWeight: '600', color: '#111' },

    filtros: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    btnFiltro: (activo) => ({
      padding: '4px 12px', borderRadius: '20px', border: '1px solid',
      borderColor: activo ? '#111' : '#d1d5db',
      background:  activo ? '#111' : '#fff',
      color:       activo ? '#fff' : '#374151',
      fontSize: '12px', cursor: 'pointer', fontWeight: activo ? '600' : '400',
    }),

    inputIp: {
      padding: '5px 10px', borderRadius: '6px', border: '1px solid #d1d5db',
      fontSize: '12px', outline: 'none', width: '140px',
    },

    tabla:   { width: '100%', borderCollapse: 'collapse' },
    th:      { padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f3f4f6' },
    td:      { padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f9fafb', verticalAlign: 'middle' },
    tdMono:  { padding: '10px 14px', fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #f9fafb', fontFamily: 'monospace' },

    badge: (tipo) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600',
      background: TIPO_LABELS[tipo]?.bg || '#f3f4f6',
      color:      TIPO_LABELS[tipo]?.color || '#374151',
    }),

    btnRojo: { padding: '4px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    btnVerde: { padding: '4px 10px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    btnRefresh: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '12px', cursor: 'pointer' },

    toast: (tipo) => ({
      position: 'fixed', bottom: '24px', right: '24px',
      padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
      background: tipo === 'error' ? '#fef2f2' : '#f0fdf4',
      color:      tipo === 'error' ? '#dc2626'  : '#16a34a',
      border:     `1px solid ${tipo === 'error' ? '#fca5a5' : '#86efac'}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 999,
    }),

    alertaRoja: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c' },
    ipRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #fef2f2' },
    ipInfo: { fontSize: '13px', fontFamily: 'monospace', color: '#111', fontWeight: '600' },
    ipSub:  { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },

    vacio: { padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' },
    cargando: { padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' },
  }

  if (cargando) return <div style={s.page} className="sec-logs-page"><div style={s.cargando}>Cargando logs de seguridad...</div></div>

  return (
    <div style={s.page} className="sec-logs-page">
      {/* Inyectar estilos responsive una sola vez */}
      <style>{RESPONSIVE_CSS}</style>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={s.titulo}>Logs de Seguridad</div>
          <div style={s.subtitulo}>Intentos de acceso, bloqueos de IP y actividad del portal — actualiza cada 30 seg</div>
        </div>
        <button style={s.btnRefresh} onClick={cargarDatos}>Actualizar</button>
      </div>

      {/* Alerta si hay IPs bloqueadas ahora */}
      {bloqueadas.length > 0 && (
        <div style={s.alertaRoja}>
          <strong>{bloqueadas.length} IP{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}</strong> actualmente por intentos fallidos de login
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div style={s.grid4}>
          <div style={{ ...s.card, borderTop: '3px solid #dc2626' }}>
            <div style={{ ...s.cardVal, color: '#dc2626' }}>{stats.hoy.fallos}</div>
            <div style={s.cardLbl}>Fallos hoy</div>
            <div style={s.cardSub}>{stats.ultimas_24h.fallos} en 24h</div>
          </div>
          <div style={{ ...s.card, borderTop: '3px solid #b45309' }}>
            <div style={{ ...s.cardVal, color: '#b45309' }}>{stats.hoy.bloqueos}</div>
            <div style={s.cardLbl}>IPs bloqueadas hoy</div>
            <div style={s.cardSub}>{bloqueadas.length} activas ahora</div>
          </div>
          <div style={{ ...s.card, borderTop: '3px solid #2563eb' }}>
            <div style={{ ...s.cardVal, color: '#2563eb' }}>{stats.hoy.logins_exitosos}</div>
            <div style={s.cardLbl}>Logins exitosos hoy</div>
            <div style={s.cardSub}>{stats.ultimas_24h.logins_exitosos} en 24h</div>
          </div>
          <div style={{ ...s.card, borderTop: '3px solid #7c3aed' }}>
            <div style={{ ...s.cardVal, color: '#7c3aed' }}>{stats.ultimas_24h.ips_con_fallos}</div>
            <div style={s.cardLbl}>IPs con fallos (24h)</div>
            {stats.usuario_mas_atacado && (
              <div style={s.cardSub}>+ atacado: <strong>{stats.usuario_mas_atacado}</strong></div>
            )}
          </div>
        </div>
      )}

      {/* IPs bloqueadas ahora */}
      {bloqueadas.length > 0 && (
        <div style={s.seccion}>
          <div style={s.secHead}>
            <span style={{ ...s.secTit, color: '#dc2626' }}>IPs Bloqueadas Ahora</span>
          </div>
          {bloqueadas.map(b => (
            <div key={b.ip} style={s.ipRow} className="sec-ip-row">
              <div>
                <div style={s.ipInfo}>{b.ip}</div>
                <div style={s.ipSub}>Expira en {Math.ceil(b.segundos_restantes / 60)} min ({b.segundos_restantes}s)</div>
              </div>
              <button
                style={s.btnVerde}
                onClick={() => desbloquearIp(b.ip)}
                disabled={desbloqueando === b.ip}
              >
                {desbloqueando === b.ip ? '...' : 'Desbloquear'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de eventos */}
      <div style={s.seccion}>
        <div style={s.secHead}>
          <span style={s.secTit}>Eventos Recientes</span>
          {/* En móvil los filtros se apilan verticalmente via clase sec-logs-filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }} className="sec-logs-filters">
            <input
              style={s.inputIp}
              placeholder="Filtrar por IP..."
              value={filtroIp}
              onChange={e => setFiltroIp(e.target.value)}
            />
            <div style={s.filtros}>
              {FILTROS.map(f => (
                <button
                  key={f.value}
                  style={s.btnFiltro(filtroTipo === f.value)}
                  onClick={() => setFiltroTipo(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {eventos.length === 0 ? (
          <div style={s.vacio}>No hay eventos registrados con este filtro</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.tabla}>
              <thead>
                <tr>
                  <th style={s.th}>Fecha / Hora</th>
                  <th style={s.th}>Tipo</th>
                  <th style={s.th}>IP</th>
                  {/* Columna oculta en móvil, visible desde 640px */}
                  <th style={s.th} className="sec-col-usuario">Usuario intentado</th>
                  {/* Columna oculta hasta escritorio (900px+) */}
                  <th style={s.th} className="sec-col-detalle">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map(e => (
                  <tr key={e.id} style={{ background: e.event_type === 'ip_blocked' ? '#fffbeb' : 'transparent' }}>
                    <td style={s.tdMono}>{formatFecha(e.created_at)}</td>
                    <td style={s.td}><span style={s.badge(e.event_type)}>{TIPO_LABELS[e.event_type]?.label || e.event_type}</span></td>
                    <td style={s.tdMono}>
                      {e.ip_address}
                      {bloqueadas.find(b => b.ip === e.ip_address) && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', color: '#dc2626', fontWeight: '700' }}>BLOQUEADA</span>
                      )}
                    </td>
                    {/* Oculto en móvil, visible desde 640px */}
                    <td style={s.td} className="sec-col-usuario">{e.username_attempt || '—'}</td>
                    {/* Oculto hasta escritorio (900px+) */}
                    <td style={{ ...s.td, color: '#9ca3af', fontSize: '11px' }} className="sec-col-detalle">{e.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div style={s.toast(toast.tipo)}>{toast.msg}</div>}
    </div>
  )
}
