import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchThinker, fetchCourses, type Thinker, type Course } from '../api/client'

export default function ThinkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [thinker, setThinker] = useState<Thinker | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchThinker(id), fetchCourses(id)])
      .then(([t, c]) => { setThinker(t); setCourses(c) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-center py-12 font-sans">Loading...</p>
  if (!thinker) return <p className="text-center py-12 font-sans text-red-600">Thinker not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 bg-navy/10 rounded-full flex items-center justify-center shrink-0">
          <span className="text-4xl font-bold text-navy">{thinker.name.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold">{thinker.name}</h1>
          <p className="text-gold font-sans font-medium">{thinker.era}</p>
          <p className="text-ink/50 font-sans text-sm">{thinker.nationality}</p>
          <p className="mt-4 text-ink/80 leading-relaxed">{thinker.bio}</p>
        </div>
      </div>

      {thinker.personality_traits && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/20">
          <h2 className="text-lg font-bold mb-2">Personality</h2>
          <p className="text-ink/70 font-sans text-sm">{thinker.personality_traits}</p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Courses</h2>
        {courses.length === 0 ? (
          <p className="text-ink/50 font-sans">No courses yet for this thinker.</p>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border border-gold/20">
                <h3 className="text-lg font-bold">{c.title}</h3>
                <p className="text-ink/60 font-sans text-sm mt-1">{c.description}</p>
                <div className="flex gap-4 mt-3 text-xs font-sans text-ink/40">
                  <span className="uppercase">{c.difficulty_level}</span>
                  <span>{c.num_lectures} lectures</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/thinkers" className="inline-block text-navy font-sans text-sm hover:text-gold transition-colors">
        ← Back to all thinkers
      </Link>
    </div>
  )
}
