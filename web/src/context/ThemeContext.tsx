import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'classical' | 'midnight' | 'nord' | 'rose-pine'

export const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'classical', label: 'Classical', icon: '🏛️' },
  { id: 'midnight', label: 'Midnight', icon: '🌙' },
  { id: 'nord', label: 'Nord', icon: '❄️' },
  { id: 'rose-pine', label: 'Rosé Pine', icon: '🌷' },
]

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'classical', setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('ss-theme') as Theme) || 'classical'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ss-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
