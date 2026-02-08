import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchThinker, fetchCourses, createCourse, type Thinker, type Course } from '../api/client'
import ThinkerAvatar from '../components/ThinkerAvatar'

export default function ThinkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [thinker, setThinker] = useState<Thinker | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchThinker(id), fetchCourses(id)])
      .then(([t, c]) => { setThinker(t); setCourses(c) })
      .finally(() => setLoading(false))
  }, [id])

  const handleCreate = async () => {
    if (!title.trim() || !id) return
    setCreating(true)
    try {
      const course = await createCourse({
        title: title.trim(),
        description: description.trim(),
        thinker_id: id,
      })
      setCourses((prev) => [...prev, course])
      setTitle('')
      setDescription('')
      setShowForm(false)
    } catch (err) {
      console.error('Failed to create course:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <p className="text-center py-12 font-sans text-muted">Loading…</p>
  if (!thinker) return <p className="text-center py-12 font-sans text-burgundy">Thinker not found</p>

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="ring-2 ring-gold/30 rounded-full shrink-0">
          <ThinkerAvatar name={thinker.name} imageUrl={thinker.image_url} size="xl" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold">{thinker.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="badge">{thinker.era}</span>
            <span className="text-muted font-sans text-sm">{thinker.nationality}</span>
          </div>
          <p className="mt-4 leading-relaxed font-sans text-sm">{thinker.bio}</p>
        </div>
      </div>

      {/* Personality */}
      {thinker.personality_traits && (
        <div className="card p-6">
          <h2 className="text-sm font-sans font-semibold uppercase tracking-wider text-gold mb-2">Personality & Style</h2>
          <p className="text-muted font-sans text-sm leading-relaxed">{thinker.personality_traits}</p>
        </div>
      )}

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Courses</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-ghost' : 'btn-primary'}
          >
            {showForm ? 'Cancel' : '+ New Course'}
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title, e.g. 'The Philosophy of Mind'"
              className="input"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
              className="input resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="btn-primary"
            >
              {creating ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        )}

        {courses.length === 0 && !showForm ? (
          <div className="card p-8 text-center">
            <p className="text-muted font-sans">No courses yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="card-interactive block p-5 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold group-hover:text-gold transition-colors">{c.title}</h3>
                    <p className="text-muted font-sans text-sm mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <span className="badge shrink-0 mt-1">{c.difficulty_level}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link to="/" className="back-link">
        ← Back to home
      </Link>
    </div>
  )
}
