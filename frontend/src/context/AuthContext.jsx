// AuthContext.jsx — Estado global de autenticacion
// Cualquier componente puede saber si hay un usuario logueado y quien es

import { createContext, useState, useEffect } from 'react'
import client from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al cargar la app, verifica si ya habia una sesion guardada
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await client.post('/auth/login', { username, password })
    const { access_token, user: userData } = response.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    // Avisar al backend para eliminar la sesion activa
    try {
      await client.post('/auth/logout')
    } catch {
      // Si falla (token ya expirado, etc.), no importa — seguimos limpiando
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
