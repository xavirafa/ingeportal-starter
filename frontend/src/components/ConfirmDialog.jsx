// ConfirmDialog.jsx — Dialogo de confirmacion reutilizable
// Uso: <ConfirmDialog open={bool} titulo="..." mensaje="..." onConfirm={fn} onCancel={fn} tipo="danger|warning" />

import { useEffect, useRef } from 'react'

const TIPOS = {
  danger: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', btnBg: '#ef4444', icon: 'trash' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', btnBg: '#f59e0b', icon: 'alert' },
}

const ICONS = {
  trash: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  alert: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5"/></svg>,
}

export function ConfirmDialog({ open, titulo, mensaje, onConfirm, onCancel, tipo = 'danger', textoConfirmar = 'Eliminar', textoCancelar = 'Cancelar' }) {
  const ref = useRef(null)

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  // Focus al abrir
  useEffect(() => {
    if (open && ref.current) ref.current.focus()
  }, [open])

  if (!open) return null

  const t = TIPOS[tipo] || TIPOS.danger

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.15s ease',
    }} onClick={onCancel}>
      <div ref={ref} tabIndex={-1} onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-card, #fff)', borderRadius: 16,
        border: '1px solid var(--border-primary, #e5e7eb)',
        padding: '28px', maxWidth: 400, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'scaleIn 0.2s ease',
      }}>
        {/* Icono */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: t.bg, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.color, margin: '0 auto 16px',
        }}>
          {ICONS[t.icon]}
        </div>

        {/* Texto */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #111)', textAlign: 'center', margin: '0 0 8px' }}>
          {titulo}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #6b7280)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
          {mensaje}
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border-primary, #e5e7eb)',
            backgroundColor: 'transparent', color: 'var(--text-secondary, #374151)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {textoCancelar}
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            border: 'none', backgroundColor: t.btnBg, color: 'white',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {textoConfirmar}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  )
}
