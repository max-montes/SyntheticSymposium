import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchCourse,
  fetchLectures,
  fetchThinker,
  type Course,
  type Lecture,
  type Thinker,
} from '../api/client'
import ThinkerAvatar from '../components/ThinkerAvatar'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [thinker, setThinker] = useState<Thinker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchCourse(id), fetchLectures(id)])
      .then(([c, l]) => {
        setCourse(c)
        setLectures(l)
        if (c.thinker_id) fetchThinker(c.thinker_id).then(setThinker)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-center py-12 font-sans text-muted">Loading course…</p>
  if (!course) return <p className="text-center py-12 font-sans text-burgundy">Course not found</p>

  const readyLectures = lectures.filter((l) => l.status === 'ready')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <span className="badge mb-2">{course.difficulty_level}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-1">{course.title}</h1>
        <p className="text-muted font-sans mt-2">{course.description}</p>
        {thinker && (
          <Link to={`/thinkers/${thinker.id}`} className="flex items-center gap-3 mt-4 group">
            <ThinkerAvatar name={thinker.name} imageUrl={thinker.image_url} size="sm" />
            <span className="text-gold font-sans text-sm font-medium group-hover:underline">{thinker.name}</span>
          </Link>
        )}
      </div>

      {/* Lectures List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Lectures <span className="text-muted font-sans text-base font-normal">({readyLectures.length})</span>
        </h2>
        {lectures.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted font-sans">No lectures available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture) => (
              <div key={lecture.id} className="card p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/lectures/${lecture.id}`}
                      className="text-lg font-bold hover:text-gold transition-colors"
                    >
                      {lecture.sequence_number}. {lecture.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-sans">
                      <span className={
                        lecture.status === 'ready' ? 'status-ready font-medium' :
                        lecture.status === 'generating' ? 'status-generating font-medium' :
                        'status-error font-medium'
                      }>
                        ● {lecture.status}
                      </span>
                      {lecture.duration_seconds && (
                        <span className="text-muted">{Math.round(lecture.duration_seconds / 60)} min</span>
                      )}
                      {lecture.audio_url && (
                        <span className="status-ready">🔊 Audio ready</span>
                      )}
                    </div>
                  </div>
                  {lecture.status === 'ready' && (
                    <Link
                      to={`/lectures/${lecture.id}`}
                      className="btn-secondary shrink-0 text-xs"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/courses" className="back-link">
        ← Back to courses
      </Link>
    </div>
  )
}
