// UndoToast.jsx — Toast con contador regresivo y boton deshacer
// Uso: <UndoToast mensaje="..." segundos={5} onUndo={fn} onExpire={fn} visible={bool} />
// El padre controla visible. Cuando el timer llega a 0, llama onExpire (ejecutar la accion real).
// Si el usuario da click en Deshacer, llama onUndo (cancelar la accion).

import { useState, useEffect, useRef } from 'react'

export function UndoToast({ mensaje, segundos = 5, onUndo, onExpire, visible }) {
  const [restante, setRestante] = useState(segundos)
  const timerRef = useRef(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!visible) {
      setRestante(segundos)
      expiredRef.current = false
      return
    }
    expiredRef.current = false
    setRestante(segundos)

    timerRef.current = setInterval(() => {
      setRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (!expiredRef.current) {
            expiredRef.current = true
            // Llamar onExpire en el siguiente tick para evitar update durante render
            setTimeout(() => onExpire?.(), 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [visible, segundos])

  const handleUndo = () => {
    clearInterval(timerRef.current)
    expiredRef.current = true
    onUndo?.()
  }

  if (!visible) return null

  const porcentaje = (restante / segundos) * 100

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10000, minWidth: 320, maxWidth: '90%',
      backgroundColor: '#1e293b', borderRadius: 12,
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      overflow: 'hidden', animation: 'slideUp 0.25s ease',
    }}>
      {/* Barra de progreso */}
      <div style={{
        height: 3, backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', backgroundColor: '#f59e0b',
          width: `${porcentaje}%`,
          transition: 'width 1s linear',
          borderRadius: 3,
        }} />
      </div>

      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Icono */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: '#ef4444',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Mensaje */}
        <span style={{ flex: 1, color: 'white', fontSize: 13, fontWeight: 500 }}>
          {mensaje}
        </span>

        {/* Contador */}
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>
          {restante}s
        </span>

        {/* Boton deshacer */}
        <button onClick={handleUndo} style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)',
          backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b',
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
          Deshacer
        </button>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}
