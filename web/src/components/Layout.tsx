import { Link, Outlet } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'

export default function Layout() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-parchment text-ink">
      <header className="bg-nav-bg shadow-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-wide text-nav-text">
            <span className="text-gold">Synthetic</span> Symposium
          </Link>
          <div className="flex items-center gap-6 text-sm font-sans uppercase tracking-wider">
            <Link to="/courses" className="text-nav-text hover:text-gold transition-colors">
              Courses
            </Link>
            <div className="flex gap-1 ml-2 pl-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all ${
                    theme === t.id ? 'scale-110 ring-2 ring-gold' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-nav-bg border-t text-center py-6 text-sm font-sans text-muted" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-nav-text opacity-60">Synthetic Symposium</span>
        <span className="text-muted mx-2">·</span>
        <span className="text-muted">Learn from history's greatest minds</span>
      </footer>
    </div>
  )
}
