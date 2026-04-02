// Dashboard.jsx — Pagina de inicio del portal
// Agrega tus apps al array APPS para que aparezcan aqui

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'

// ── Apps del portal ─────────────────────────────────────────────────────────
// AGREGAR AQUI cada nueva app que crees.
// Formato de cada item:
// {
//   id: 'mi_app',             // debe coincidir con el id en PORTAL_APPS (Users.jsx)
//   title: 'Mi App',
//   desc: 'Descripcion breve de la app.',
//   href: '/apps/mi-app',
//   badge: 'Nuevo',           // texto del badge
//   badgeColor: '#10b981',    // color del badge
//   icon: <svg>...</svg>,     // icono SVG
// }
const APPS = [
  // Ejemplo (descomenta y adapta):
  // {
  //   id: 'mi_app',
  //   title: 'Mi App',
  //   desc: 'Descripcion de lo que hace mi app.',
  //   href: '/apps/mi-app',
  //   badge: 'Nuevo',
  //   badgeColor: '#10b981',
  //   icon: <svg width="18" height="18" viewBox="0 0 22 22" fill="none">...</svg>,
  // },
]

export function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? 'Usuario'

  // Los admins ven todas las apps. Los usuarios normales solo las que tienen habilitadas.
  const allowedIds = user?.allowed_apps ?? []
  const isAdmin = user?.role === 'admin'
  const visibleApps = isAdmin ? APPS : APPS.filter(app => allowedIds.includes(app.id))

  return (
    <Layout>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Hola, {firstName}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Selecciona una aplicacion para comenzar
        </p>
      </div>

      {/* Cuerpo */}
      <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 960 }}>

          {visibleApps.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12, padding: '40px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                  <rect x="4" y="4" width="18" height="18" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <rect x="26" y="4" width="18" height="18" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <rect x="4" y="26" width="18" height="18" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <rect x="26" y="26" width="18" height="18" rx="3" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="2 2"/>
                </svg>
              </div>
              {isAdmin ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    No hay apps configuradas aun
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Agrega apps al array APPS en Dashboard.jsx para que aparezcan aqui.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Sin aplicaciones asignadas
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Contacta al administrador para que habilite tus accesos.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 10,
            }}>
              {visibleApps.map(app => <AppCard key={app.id} app={app} />)}
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}

// ── Tarjeta de app ─────────────────────────────────────────────────────────

function AppCard({ app }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(app.href)}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 10, padding: '14px',
        cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: 'var(--accent-indigo-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {app.icon}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 12,
          color: app.badgeColor,
          backgroundColor: app.badgeColor + '12',
          border: `1px solid ${app.badgeColor}30`,
          whiteSpace: 'nowrap',
        }}>
          {app.badge}
        </span>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: 1.3 }}>
        {app.title}
      </h3>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        {app.desc}
      </p>
    </div>
  )
}
