import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCourses, type Course } from '../api/client'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center py-12 font-sans">Loading courses...</p>

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-4xl font-bold">Courses</h1>
        <p className="text-ink/60 font-sans">No courses yet. Visit a thinker's page to create one.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-center">Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <Link
            key={c.id}
            to={`/courses/${c.id}`}
            className="bg-white rounded-xl shadow-md p-6 border border-gold/20 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold">{c.title}</h3>
            <p className="text-ink/60 font-sans text-sm mt-2">{c.description}</p>
            <div className="flex gap-4 mt-4 text-xs font-sans text-ink/40 uppercase">
              <span>{c.difficulty_level}</span>
              <span>{c.num_lectures} lectures</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
