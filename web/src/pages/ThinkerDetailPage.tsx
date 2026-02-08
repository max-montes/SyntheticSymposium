import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchThinker, fetchCourses, createCourse, type Thinker, type Course } from '../api/client'

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Courses</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-sans bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Course'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gold/20 mb-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title, e.g. 'The Philosophy of Mind'"
              className="w-full px-4 py-3 border border-ink/20 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full px-4 py-3 border border-ink/20 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="px-6 py-3 bg-navy text-white rounded-lg font-sans font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        )}

        {courses.length === 0 && !showForm ? (
          <p className="text-ink/50 font-sans">No courses yet for this thinker.</p>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="block bg-white rounded-xl p-6 shadow-sm border border-gold/20 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold">{c.title}</h3>
                <p className="text-ink/60 font-sans text-sm mt-1">{c.description}</p>
                <div className="flex gap-4 mt-3 text-xs font-sans text-ink/40">
                  <span className="uppercase">{c.difficulty_level}</span>
                  <span>{c.num_lectures} lectures</span>
                </div>
              </Link>
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
