// useAuth.js — Hook para acceder al contexto de autenticacion
// Uso: const { user, login, logout } = useAuth()

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
