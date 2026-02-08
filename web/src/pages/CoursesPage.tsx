import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCourses, fetchThinkers, type Course, type Thinker } from '../api/client'
import ThinkerAvatar from '../components/ThinkerAvatar'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [thinkers, setThinkers] = useState<Map<string, Thinker>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchCourses(), fetchThinkers()])
      .then(([c, t]) => {
        setCourses(c)
        setThinkers(new Map(t.map(th => [th.id, th])))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center py-12 font-sans text-muted">Loading courses…</p>

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-4xl font-bold">Courses</h1>
        <p className="text-muted font-sans">No courses yet. Visit a thinker's page to create one.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Courses</h1>
        <p className="text-muted font-sans mt-2">Structured lecture series from history's greatest</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.map((c) => (
          <Link
            key={c.id}
            to={`/courses/${c.id}`}
            className="card-interactive p-6 group"
          >
            <h3 className="text-xl font-bold group-hover:text-gold transition-colors">{c.title}</h3>
            {c.thinker_name && (
              <div className="flex items-center gap-2 mt-2">
                {(() => {
                  const th = thinkers.get(c.thinker_id)
                  return th ? <ThinkerAvatar name={th.name} imageUrl={th.image_url} size="sm" /> : null
                })()}
                <span className="text-xs font-sans text-gold">by {c.thinker_name}</span>
              </div>
            )}
            <p className="text-muted font-sans text-sm mt-2 line-clamp-2">{c.description}</p>
            <div className="mt-4">
              <span className="badge">{c.difficulty_level}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
