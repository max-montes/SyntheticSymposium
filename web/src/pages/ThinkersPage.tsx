import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchThinkers, type Thinker } from '../api/client'

export default function ThinkersPage() {
  const [thinkers, setThinkers] = useState<Thinker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchThinkers()
      .then(setThinkers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center py-12 font-sans">Loading thinkers...</p>
  if (error) return <p className="text-center py-12 text-red-600 font-sans">{error}</p>

  if (thinkers.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-4xl font-bold">The Thinkers</h1>
        <p className="text-ink/60 font-sans">No thinkers yet. Seed the database to get started.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-center">The Thinkers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {thinkers.map((t) => (
          <Link
            key={t.id}
            to={`/thinkers/${t.id}`}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gold/20"
          >
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-navy">
                {t.name.charAt(0)}
              </span>
            </div>
            <h3 className="text-xl font-bold">{t.name}</h3>
            <p className="text-gold font-sans text-sm font-medium">{t.era}</p>
            <p className="text-ink/60 font-sans text-sm mt-2 line-clamp-3">{t.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
