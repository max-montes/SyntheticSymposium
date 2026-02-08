import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-parchment shadow-lg">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-wide">
            <span className="text-gold">Synthetic</span> Symposium
          </Link>
          <div className="flex gap-6 text-sm font-sans uppercase tracking-wider">
            <Link to="/thinkers" className="hover:text-gold transition-colors">
              Thinkers
            </Link>
            <Link to="/courses" className="hover:text-gold transition-colors">
              Courses
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-navy text-parchment/60 text-center py-4 text-sm font-sans">
        Synthetic Symposium — Learn from history's greatest minds
      </footer>
    </div>
  )
}
