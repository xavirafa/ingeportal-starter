// ThemeContext.jsx — Sistema de temas (claro/oscuro)
// Guarda la preferencia en localStorage.
// Si no hay preferencia guardada, usa el modo claro por defecto.

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Revisar si hay preferencia guardada
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    // Default: claro
    return 'light'
  })

  useEffect(() => {
    // Aplicar el atributo data-theme en el <html>
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const isDark = theme === 'dark'

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
